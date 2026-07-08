import { createChatTextStream } from "@/lib/ai/model-provider";
import { createRagSystemPrompt } from "@/lib/ai/prompts";
import { buildRetrievalQuery } from "@/lib/ai/query-rewrite";
import { retrieveArticleChunks } from "@/lib/ai/retrieval";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth-options";
import { hasAICopilotAccess, isAICopilotAuthRequired } from "@/lib/ai/access";

const encoder = new TextEncoder();

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (isAICopilotAuthRequired()) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const user = await getUserFromToken(token);

    if (!hasAICopilotAccess(user)) {
      return Response.json(
        { error: "AI Copilot 仅对 VIP 或管理员开放" },
        { status: 403 }
      );
    }
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求体必须是合法 JSON" }, { status: 400 });
  }

  const message = body?.message?.trim();
  if (!message) {
    return Response.json({ error: "问题不能为空" }, { status: 400 });
  }

  if (message.length > 1000) {
    return Response.json({ error: "问题不能超过 1000 个字符" }, { status: 400 });
  }

  const conversationId = body.conversationId || crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const traceId = `ai-chat:${messageId.slice(0, 8)}`;
  const requestStartedAt = Date.now();

  console.info(
    `[${traceId}] 收到问答请求，messageLength=${message.length}，articleId=${
      body.articleId || "none"
    }`
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.info(`[${traceId}] 开始 RAG 检索`);
        const retrievalQueryResult = buildRetrievalQuery({
          message,
          history: body.history,
          currentArticle: body.currentArticle,
        });
        const retrievalQuery = retrievalQueryResult.query || message;
        const requiresArticleDiversity = isMultiArticleQuestion(retrievalQuery);
        console.info(
          `[${traceId}] 检索 Query 准备完成，strategy=${retrievalQueryResult.strategy}，reasons=${retrievalQueryResult.reasons.join(
            ","
          ) || "none"}，queryLength=${retrievalQuery.length}`
        );
        const sources = await retrieveArticleChunks({
          query: retrievalQuery,
          articleId: body.articleId,
          candidateK: requiresArticleDiversity ? 30 : 24,
          finalK: 10,
          maxChunksPerArticle: 3,
          minDistinctArticles: requiresArticleDiversity ? 2 : 1,
          traceId,
        });
        console.info(
          `[${traceId}] RAG 检索完成，命中 ${sources.length} 条，耗时 ${
            Date.now() - requestStartedAt
          }ms`
        );

        console.info(`[${traceId}] 开始创建 DeepSeek 流`);
        const chat = await createChatTextStream({
          message,
          systemPrompt: createRagSystemPrompt({
            sources,
            originalQuestion: message,
            retrievalQuery,
          }),
          history: body.history,
          signal: request.signal,
          traceId,
        });
        console.info(
          `[${traceId}] DeepSeek 流已建立，provider=${chat.provider}，model=${chat.model}`
        );

        sendEvent(controller, "start", {
          conversationId,
          messageId,
          provider: chat.provider,
          model: chat.model,
        });

        sendEvent(controller, "sources", {
          messageId,
          sources: sources.map(toPublicSource),
        });

        let chunkCount = 0;
        let outputLength = 0;
        for await (const text of chat.stream) {
          if (request.signal.aborted) break;

          chunkCount += 1;
          outputLength += text.length;
          sendEvent(controller, "delta", { messageId, text });
        }

        if (!request.signal.aborted) {
          console.info(
            `[${traceId}] 流式输出完成，chunkCount=${chunkCount}，outputLength=${outputLength}，总耗时 ${
              Date.now() - requestStartedAt
            }ms`
          );
          sendEvent(controller, "done", {
            messageId,
            finishReason: "stop",
          });
        } else {
          console.warn(
            `[${traceId}] 请求被中断，总耗时 ${Date.now() - requestStartedAt}ms`
          );
        }
      } catch (error) {
        console.error(
          `[${traceId}] 问答失败，耗时 ${Date.now() - requestStartedAt}ms`,
          error
        );
        sendEvent(controller, "error", {
          messageId,
          message: error.message || "生成回答失败",
        });
      } finally {
        console.info(
          `[${traceId}] 请求结束，总耗时 ${Date.now() - requestStartedAt}ms`
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function isMultiArticleQuestion(message) {
  const normalizedMessage = String(message || "").toLowerCase();
  const multiArticleSignals = [
    "多篇",
    "不同文章",
    "几篇文章",
    "跨文章",
    "各篇",
    "综合博客",
    "博客里有哪些",
    "作者写过哪些",
    "全部文章",
    "所有文章",
    "不要遗漏",
    "分别概括",
  ];

  return multiArticleSignals.some((signal) =>
    normalizedMessage.includes(signal)
  );
}

function toPublicSource(source) {
  return {
    citation: source.citation,
    articleId: source.articleId,
    title: source.title,
    heading: source.headingPath || source.heading,
    url: source.url,
    score: source.score,
  };
}

function sendEvent(controller, event, data) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  );
}
