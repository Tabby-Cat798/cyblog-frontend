const CONTEXT_DEPENDENT_SIGNALS = [
  "这个",
  "这个方法",
  "这个问题",
  "这种",
  "这些",
  "它",
  "它们",
  "上面",
  "前面",
  "刚才",
  "继续",
  "还有呢",
  "然后呢",
  "分别",
  "怎么选",
  "怎么用",
  "优缺点",
  "区别",
  "总结一下",
  "这篇",
  "当前文章",
];

const MAX_QUERY_LENGTH = 700;
const MAX_HISTORY_ITEMS = 4;
const MAX_HISTORY_ITEM_LENGTH = 120;

export function buildRetrievalQuery({
  message,
  history = [],
  currentArticle,
}) {
  const originalMessage = normalizeText(message);
  if (!originalMessage) {
    return {
      query: "",
      strategy: "empty",
      reasons: [],
    };
  }

  const reasons = getRewriteReasons(originalMessage, history, currentArticle);
  if (reasons.length === 0) {
    return {
      query: originalMessage,
      strategy: "original-message",
      reasons,
    };
  }

  const queryParts = [
    formatCurrentArticle(currentArticle),
    formatRecentHistory(history),
    `用户当前问题：${originalMessage}`,
  ].filter(Boolean);

  return {
    query: limitText(queryParts.join("\n"), MAX_QUERY_LENGTH),
    strategy: "context-aware-rewrite",
    reasons,
  };
}

function getRewriteReasons(message, history, currentArticle) {
  const reasons = [];
  const normalizedMessage = message.toLowerCase();
  const hasContextSignal = CONTEXT_DEPENDENT_SIGNALS.some((signal) =>
    normalizedMessage.includes(signal)
  );
  const hasHistory = Array.isArray(history) && history.length > 0;
  const hasArticleTitle = Boolean(normalizeText(currentArticle?.title));

  if (hasContextSignal && hasHistory) {
    reasons.push("history-reference");
  }

  if (hasContextSignal && hasArticleTitle) {
    reasons.push("current-article-reference");
  }

  if (isShortFollowup(message) && (hasHistory || hasArticleTitle)) {
    reasons.push("short-followup");
  }

  return [...new Set(reasons)];
}

function isShortFollowup(message) {
  const compactMessage = message.replace(/\s/g, "");
  return compactMessage.length <= 24;
}

function formatCurrentArticle(currentArticle) {
  const title = normalizeText(currentArticle?.title);
  if (!title) return "";

  return `当前文章：《${title}》`;
}

function formatRecentHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return "";

  const recentHistory = history
    .filter(
      (item) =>
        ["user", "assistant"].includes(item?.role) &&
        normalizeText(item?.content)
    )
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => {
      const roleLabel = item.role === "user" ? "用户" : "助手";
      return `${roleLabel}：${limitText(
        normalizeText(item.content),
        MAX_HISTORY_ITEM_LENGTH
      )}`;
    });

  if (recentHistory.length === 0) return "";

  return `最近对话：\n${recentHistory.join("\n")}`;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function limitText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
