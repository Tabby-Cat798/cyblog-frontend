import OpenAI from "openai";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";

export async function createChatTextStream({
  message,
  history = [],
  systemPrompt,
  signal,
  traceId = "deepseek",
}) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("服务端未配置 DEEPSEEK_API_KEY");
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL,
  });
  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const streamStartedAt = Date.now();
  console.info(
    `[${traceId}] 开始请求 DeepSeek，history=${Array.isArray(history) ? history.length : 0}，messageLength=${message.length}`
  );
  const upstream = await client.chat.completions.create(
    {
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...sanitizeHistory(history),
        {
          role: "user",
          content: message,
        },
      ],
      stream: true,
      temperature: 0.4,
      max_tokens: 1200,
      thinking: {
        type: "disabled",
      },
    },
    { signal }
  );
  console.info(
    `[${traceId}] DeepSeek 上游响应已建立，耗时 ${Date.now() - streamStartedAt}ms`
  );

  return {
    provider: "deepseek",
    model,
    stream: readDeepSeekText(upstream, signal, traceId),
  };
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        ["user", "assistant"].includes(item?.role) &&
        typeof item?.content === "string" &&
        item.content.trim()
    )
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 4000),
    }));
}

async function* readDeepSeekText(upstream, signal, traceId) {
  const startedAt = Date.now();
  let hasLoggedFirstToken = false;
  let chunkCount = 0;

  for await (const chunk of upstream) {
    if (signal?.aborted) return;

    const text = chunk.choices?.[0]?.delta?.content;
    if (text) {
      chunkCount += 1;

      if (!hasLoggedFirstToken) {
        hasLoggedFirstToken = true;
        console.info(
          `[${traceId}] 收到首个 token，耗时 ${Date.now() - startedAt}ms`
        );
      }

      yield text;
    }
  }

  console.info(
    `[${traceId}] DeepSeek 流读取结束，chunkCount=${chunkCount}，耗时 ${
      Date.now() - startedAt
    }ms`
  );
}
