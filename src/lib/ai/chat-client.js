import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

const DEFAULT_ENDPOINT = "/api/ai/chat";

export async function streamChat({
  payload,
  signal,
  onEvent,
  endpoint = DEFAULT_ENDPOINT,
}) {
  await fetchEventSource(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
    openWhenHidden: true,
    async onopen(response) {
      const contentType = response.headers.get("content-type") || "";

      if (
        response.ok &&
        contentType.toLowerCase().includes(EventStreamContentType)
      ) {
        return;
      }

      let errorMessage = `AI 请求失败（${response.status}）`;

      try {
        const errorBody = await response.clone().json();
        if (errorBody?.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        const text = await response.text().catch(() => "");
        if (text) {
          errorMessage = text;
        }
      }

      throw new Error(errorMessage);
    },
    onmessage(event) {
      onEvent(parseMessageEvent(event));
    },
    onclose() {
      return;
    },
    onerror(error) {
      throw error;
    },
  });
}

function parseMessageEvent(event) {
  const type = event.event || "message";
  const rawData = event.data || "";

  try {
    return { type, data: JSON.parse(rawData) };
  } catch {
    return { type, data: { text: rawData } };
  }
}
