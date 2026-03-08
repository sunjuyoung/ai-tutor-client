const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SSEEvent {
  type: "chunk" | "done" | "error";
  text?: string;
  full_text?: string;
  message?: string;
}

export async function streamMessage(
  conversationId: string,
  content: string,
  {
    onChunk,
    onDone,
    onError,
  }: {
    onChunk: (text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: string) => void;
  }
) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_BASE}/api/v1/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    onError(`HTTP ${response.status}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("No reader available");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event: SSEEvent = JSON.parse(jsonStr);
        if (event.type === "chunk" && event.text) {
          onChunk(event.text);
        } else if (event.type === "done" && event.full_text) {
          onDone(event.full_text);
        } else if (event.type === "error") {
          onError(event.message || "Unknown error");
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }
}
