const DEFAULT_ENDPOINT = "/api/ai/chat";

export async function streamChat({
  payload,
  signal,
  onEvent,
  endpoint = DEFAULT_ENDPOINT,
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || `AI 请求失败（${response.status}）`);
  }

  if (!response.body) {
    throw new Error("当前浏览器不支持流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (event) onEvent(event);
    }

    if (done) break;
  }

  if (buffer.trim()) {
    const event = parseSseBlock(buffer);
    if (event) onEvent(event);
  }
}

function parseSseBlock(block) {
  let type = "message";
  const dataLines = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      type = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;

  const rawData = dataLines.join("\n");

  try {
    return { type, data: JSON.parse(rawData) };
  } catch {
    return { type, data: { text: rawData } };
  }
}
