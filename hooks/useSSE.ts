const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SSEEvent {
  type: "chunk" | "done" | "error" | "transcription";
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

/**
 * Phase 3.5: 음성 메시지 스트리밍 — 오디오 Blob → STT → AI 응답 SSE
 *
 * send_audio_message 엔드포인트를 호출하여:
 * 1. transcription 이벤트 수신 → onTranscription 콜백
 * 2. chunk/done/error 이벤트 → 기존과 동일
 */
export async function streamAudioMessage(
  conversationId: string,
  audioBlob: Blob,
  {
    onTranscription,
    onChunk,
    onDone,
    onError,
  }: {
    onTranscription: (text: string) => void;
    onChunk: (text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: string) => void;
  }
) {
  const token = localStorage.getItem("access_token");

  // FormData로 오디오 파일 전송
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  const response = await fetch(
    `${API_BASE}/api/v1/conversations/${conversationId}/audio`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
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
        if (event.type === "transcription" && event.text) {
          onTranscription(event.text);
        } else if (event.type === "chunk" && event.text) {
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
