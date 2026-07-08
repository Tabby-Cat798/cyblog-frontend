"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faRobot,
  faRotateRight,
  faStop,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { streamChat } from "@/lib/ai/chat-client";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useAuth } from "@/lib/auth";
import { hasAICopilotAccess, isAICopilotAuthRequired } from "@/lib/ai/access";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 CyBlog AI。你可以向我询问博客文章中的内容，或者让我帮你查找相关文章。",
  status: "complete",
};

const SUGGESTIONS = [
  "博客里有哪些前端相关文章？",
  "帮我总结当前文章",
  "作者写过哪些面试经验？",
];
const STORAGE_KEY = "cyblog-ai-widget-state";

function createConversationId() {
  return globalThis.crypto?.randomUUID?.() || `conversation-${Date.now()}`;
}

function readStoredWidgetState() {
  if (typeof window === "undefined") return null;

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    return rawState ? JSON.parse(rawState) : null;
  } catch {
    return null;
  }
}

function normalizeStoredMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [INITIAL_MESSAGE];
  }

  const normalized = messages
    .filter(
      (message) =>
        ["user", "assistant"].includes(message?.role) &&
        typeof message?.content === "string"
    )
    .slice(-30)
    .map((message) => ({
      ...message,
      content: message.content.slice(0, 8000),
      sources: Array.isArray(message.sources) ? message.sources.slice(0, 8) : [],
      status: message.status === "streaming" ? "stopped" : message.status,
    }));

  return normalized.some((message) => message.id === INITIAL_MESSAGE.id)
    ? normalized
    : [INITIAL_MESSAGE, ...normalized];
}

export default function AIWidget() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const conversationIdRef = useRef(null);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const launcherRef = useRef(null);

  useEffect(() => {
    const storedState = readStoredWidgetState();
    conversationIdRef.current =
      storedState?.conversationId || createConversationId();
    setMessages(normalizeStoredMessages(storedState?.messages));
    setIsStateRestored(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      const target = event.target;

      if (
        dialogRef.current?.contains(target) ||
        launcherRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying, requestError]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isStateRestored) return;

    const state = {
      conversationId: conversationIdRef.current,
      messages: normalizeStoredMessages(messages),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in private browsing or strict browser modes.
    }
  }, [messages, isStateRestored]);

  const sendMessage = async (message = input) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isReplying) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
      status: "complete",
    };
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      sources: [],
      status: "streaming",
    };
    const history = messages
      .filter((item) => item.id !== "welcome" && item.status === "complete")
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setRequestError(null);
    setIsReplying(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChat({
        signal: controller.signal,
        payload: {
          message: trimmedMessage,
          articleId: getArticleId(pathname),
          currentArticle: getCurrentArticleContext(pathname),
          conversationId: conversationIdRef.current,
          history,
        },
        onEvent: (event) => {
          handleStreamEvent(event, assistantMessage.id, setMessages);
        },
      });

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id && item.status === "streaming"
            ? { ...item, status: "complete" }
            : item
        )
      );
    } catch (error) {
      if (error.name === "AbortError") {
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessage.id
              ? {
                  ...item,
                  content: item.content || "已停止生成。",
                  status: "stopped",
                }
              : item
          )
        );
      } else {
        setMessages((current) =>
          current.filter((item) => item.id !== assistantMessage.id)
        );
        setRequestError({
          message: error.message || "AI 请求失败，请稍后重试",
          question: trimmedMessage,
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsReplying(false);
      inputRef.current?.focus();
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const retryLastMessage = () => {
    if (!requestError?.question) return;

    const question = requestError.question;
    setMessages((current) => {
      const lastMessage = current[current.length - 1];
      return lastMessage?.role === "user" && lastMessage.content === question
        ? current.slice(0, -1)
        : current;
    });
    setRequestError(null);
    queueMicrotask(() => sendMessage(question));
  };

  const resetConversation = () => {
    abortControllerRef.current?.abort();
    conversationIdRef.current = createConversationId();
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setRequestError(null);
    setIsReplying(false);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const requiresAuth = isAICopilotAuthRequired();
  const canUseAICopilot = hasAICopilotAccess(user);

  if (requiresAuth && (loading || !canUseAICopilot)) {
    return null;
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-5 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 sm:bottom-6 sm:right-6 ${
          isOpen
            ? "pointer-events-none scale-75 opacity-0"
            : "scale-100 opacity-100"
        }`}
        aria-label="打开 CyBlog AI 助手"
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={faRobot} className="h-6 w-6" />
      </button>

      <div
        className={`pointer-events-none fixed inset-0 z-[70] bg-gray-950/30 transition-opacity duration-300 sm:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="CyBlog AI 对话框"
        aria-hidden={!isOpen}
        className={`fixed inset-x-2 bottom-2 z-[90] flex h-[min(720px,calc(100dvh-1rem))] flex-col overflow-hidden overscroll-contain rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-900 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-8 scale-95 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FontAwesomeIcon icon={faRobot} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-gray-900 dark:text-white">
                CyBlog AI
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isReplying ? "animate-pulse bg-blue-500" : "bg-emerald-500"
                  }`}
                />
                {isReplying ? "正在生成回答" : "AI 助手已就绪"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetConversation}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="清空对话"
              title="清空对话"
            >
              <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="关闭对话框"
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            回答会优先结合博客文章；文章未覆盖的部分，会由模型补充通用知识。
          </p>
        </div>

        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-4"
          aria-live="polite"
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  你可以这样问
                </p>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    disabled={isReplying}
                    className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {requestError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <div className="flex gap-2">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  <div>
                    <p>{requestError.message}</p>
                    <button
                      type="button"
                      onClick={retryLastMessage}
                      className="mt-2 font-medium underline underline-offset-2"
                    >
                      重试上一个问题
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="border-t border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-950">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={1}
              maxLength={1000}
              placeholder="询问博客内容、技术问题或查找文章..."
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
              aria-label="输入问题"
              disabled={isReplying}
            />
            <button
              type="button"
              onClick={isReplying ? stopGeneration : () => sendMessage()}
              disabled={!isReplying && !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              aria-label={isReplying ? "停止生成" : "发送消息"}
            >
              <FontAwesomeIcon
                icon={isReplying ? faStop : faPaperPlane}
                className="h-4 w-4"
              />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
            AI 回答可能不准确，请以引用的博客原文为准
          </p>
        </footer>
      </section>
    </>
  );
}

function handleStreamEvent(event, localMessageId, setMessages) {
  if (event.type === "error") {
    throw new Error(event.data.message || "生成回答失败");
  }

  setMessages((current) =>
    current.map((item) => {
      if (item.id !== localMessageId) return item;

      if (event.type === "delta") {
        return { ...item, content: item.content + (event.data.text || "") };
      }

      if (event.type === "sources") {
        return { ...item, sources: event.data.sources || [] };
      }

      if (event.type === "done") {
        return { ...item, status: "complete" };
      }

      return item;
    })
  );
}

function getArticleId(pathname) {
  const match = pathname.match(/^\/posts\/([^/]+)$/);
  return match?.[1] || null;
}

function getCurrentArticleContext(pathname) {
  if (!getArticleId(pathname) || typeof document === "undefined") return null;

  const title = document.title
    .replace(/\s*\|\s*CyBlog.*$/i, "")
    .trim();

  return title ? { title } : null;
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const referencedSources = getReferencedSources(message);

  return (
    <div
      className={isUser ? "flex justify-end" : "flex flex-col items-start gap-2"}
    >
      <div
        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
          isUser
            ? "max-w-[82%] rounded-br-md bg-blue-600 text-white"
            : "w-full rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {message.status === "streaming" && !message.content ? (
          <span className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </span>
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <AssistantMarkdown content={message.content} />
        )}
        {message.status === "stopped" && (
          <span className="mt-2 block text-[11px] text-gray-500 dark:text-gray-400">
            已停止生成
          </span>
        )}
        {!isUser &&
          message.status === "complete" &&
          referencedSources.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-gray-200 pt-2 dark:border-gray-700">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              参考文章
            </p>
            {referencedSources.map((source) => (
              <a
                key={`${source.articleId}-${source.citation}`}
                href={source.url}
                className="block rounded-lg bg-white/80 px-2.5 py-2 text-xs text-blue-700 transition-colors hover:bg-blue-50 dark:bg-gray-900/70 dark:text-blue-300 dark:hover:bg-blue-950/50"
              >
                <span className="font-semibold">[{source.citation}]</span>{" "}
                {source.title}
                {source.heading ? (
                  <span className="mt-0.5 block truncate text-gray-500 dark:text-gray-400">
                    {source.heading}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
        )}
      </div>
      {!isUser && <AssistantAvatar />}
    </div>
  );
}

function getReferencedSources(message) {
  if (!Array.isArray(message.sources) || !message.sources.length) {
    return [];
  }

  const referencedCitations = extractReferencedCitations(message.content);
  if (!referencedCitations.size) {
    return [];
  }

  const referencedSources = message.sources.filter((source) =>
    referencedCitations.has(Number(source.citation))
  );

  const dedupedSources = [];
  const seen = new Set();

  for (const source of referencedSources) {
    const dedupeKey = `${source.articleId}::${source.heading || ""}`;
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    dedupedSources.push(source);
  }

  return dedupedSources;
}

function extractReferencedCitations(content) {
  const matches = String(content || "").match(/\[(\d+)\]/g) || [];
  return new Set(
    matches
      .map((match) => Number(match.slice(1, -1)))
      .filter((value) => Number.isInteger(value) && value > 0)
  );
}

function AssistantMarkdown({ content }) {
  return (
    <div className="ai-markdown break-words text-inherit">
      <MarkdownRenderer
        content={content}
        className="!text-inherit [&_.prose]:!text-inherit [&_p]:!text-inherit [&_h1]:!text-inherit [&_h2]:!text-inherit [&_h3]:!text-inherit [&_h4]:!text-inherit [&_h5]:!text-inherit [&_h6]:!text-inherit [&_blockquote]:!text-inherit [&_.markdown-link]:!text-blue-600 dark:[&_.markdown-link]:!text-blue-300"
      />
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
      <FontAwesomeIcon icon={faRobot} className="h-3.5 w-3.5" />
    </div>
  );
}
