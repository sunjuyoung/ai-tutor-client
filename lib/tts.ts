/**
 * TTS 유틸 — AI 메시지 음성 재생
 *
 * Phase 3.5: POST /api/v1/tts → mp3 바이트 → Audio 재생
 * ChatBubble 🔊 버튼 + 음성 모드 자동 재생에서 사용
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 재생 중인 Audio 인스턴스 (중복 재생 방지)
let currentAudio: HTMLAudioElement | null = null;

/**
 * TTS API 호출 → mp3 오디오 재생
 *
 * @param text 합성할 텍스트
 * @param personaId 페르소나 ID (음성 결정)
 * @param onStart 재생 시작 콜백
 * @param onEnd 재생 종료 콜백
 */
export async function playTTS(
  text: string,
  personaId: string,
  onStart?: () => void,
  onEnd?: () => void,
): Promise<void> {
  // 이전 재생 중지
  stopTTS();

  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE}/api/v1/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, persona_id: personaId }),
  });

  if (!response.ok) {
    console.error("TTS API error:", response.status);
    return;
  }

  // mp3 바이트 → Blob URL → Audio 재생
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onplay = () => onStart?.();
  audio.onended = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    onEnd?.();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    onEnd?.();
  };

  await audio.play();
}

/** 현재 재생 중인 TTS 중지 */
export function stopTTS(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
