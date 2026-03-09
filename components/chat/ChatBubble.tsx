"use client";

/**
 * 채팅 말풍선 컴포넌트
 *
 * Phase 3.5: AI 메시지에 🔊 스피커 버튼 추가 (TTS 재생)
 */

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  avatarEmoji?: string;
  // Phase 3.5: TTS 재생용 페르소나 ID
  personaId?: string;
}

export default function ChatBubble({
  role,
  content,
  timestamp,
  avatarEmoji,
  personaId,
}: ChatBubbleProps) {
  const isUser = role === "user";
  // Phase 3.5: TTS 재생 상태
  const [isPlaying, setIsPlaying] = useState(false);

  // Phase 3.5: AI 메시지 TTS 재생
  const handlePlayTTS = async () => {
    if (isPlaying) {
      stopTTS();
      setIsPlaying(false);
      return;
    }
    if (!personaId || !content) return;

    setIsPlaying(true);
    await playTTS(
      content,
      personaId,
      undefined,
      () => setIsPlaying(false),
    );
  };

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0 mt-1">
          {avatarEmoji || "🤖"}
        </div>
      )}
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-brand-subtle text-gray-900"
            : "bg-white text-gray-900 shadow-sm border border-gray-50"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {/* Phase 3.5: AI 메시지 하단에 타임스탬프 + 🔊 버튼 */}
        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-between"}`}>
          {timestamp && (
            <p
              className={`text-[11px] ${
                isUser ? "text-brand/50" : "text-gray-300"
              }`}
            >
              {new Date(timestamp).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {/* AI 메시지에만 스피커 버튼 표시 */}
          {!isUser && personaId && content && (
            <button
              onClick={handlePlayTTS}
              className={`p-0.5 rounded transition-colors ${
                isPlaying
                  ? "text-brand animate-pulse"
                  : "text-gray-300 hover:text-gray-500"
              }`}
              title={isPlaying ? "재생 중지" : "음성으로 듣기"}
            >
              <Volume2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
