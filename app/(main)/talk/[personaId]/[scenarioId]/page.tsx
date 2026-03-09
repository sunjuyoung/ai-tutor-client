"use client";

/**
 * 텍스트/음성 대화 페이지
 *
 * 핵심 흐름:
 * 1. 페르소나 + 시나리오 정보 로드
 * 2. 대화 생성 → AI 첫 인사 메시지 수신
 * 3. 유저 메시지 전송 → SSE 스트리밍 응답
 * 4. 힌트 버튼 → HintBottomSheet (맥락 기반 표현 추천)
 * 5. 대화 종료 → XP/스트릭 보상 → 리포트 페이지 이동
 *
 * Phase 3.5 추가:
 * 6. 마이크 버튼 → 음성 녹음 → STT → 텍스트 메시지 전송
 * 7. AI 응답 완료 → TTS 자동 재생 (음성 모드 시)
 * 8. ChatBubble 🔊 버튼 → 개별 메시지 TTS 재생
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X, Lightbulb } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useChatStore, type ChatMessage } from "@/stores/chatStore";
import { streamMessage, streamAudioMessage } from "@/hooks/useSSE";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import TextInputBar from "@/components/chat/TextInputBar";
import HintBottomSheet from "@/components/chat/HintBottomSheet";

interface Scenario {
  id: string;
  title: string;
  icon_emoji: string;
}

interface Persona {
  id: string;
  name: string;
  icon_emoji: string;
}

interface ConversationResponse {
  id: string;
}

interface MessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.personaId as string;
  const scenarioId = params.scenarioId as string;

  const {
    conversationId,
    messages,
    isStreaming,
    isVoiceMode,
    setConversationId,
    setMessages,
    addMessage,
    appendToLastMessage,
    setIsStreaming,
    setIsVoiceMode,
    setIsPlayingAudio,
    reset,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<Persona | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const initializedRef = useRef(false);
  const inputRef = useRef<{ insertText: (text: string) => void } | null>(null);

  // 힌트 바텀시트 상태
  const [hintOpen, setHintOpen] = useState(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  // Phase 3.5: AI 응답 완료 후 TTS 자동 재생 (음성 모드 시)
  const autoPlayTTS = useCallback(
    async (text: string) => {
      if (!isVoiceMode || !personaId) return;
      setIsPlayingAudio(true);
      await playTTS(text, personaId, undefined, () => setIsPlayingAudio(false));
    },
    [isVoiceMode, personaId, setIsPlayingAudio]
  );

  // Phase 3.5: 음성 녹음 완료 → 서버로 전송
  const handleAudioComplete = useCallback(
    async (blob: Blob) => {
      if (!conversationId || isStreaming) return;

      // AI 응답 플레이스홀더 (STT 변환 대기 중에는 비어있음)
      const aiPlaceholder: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      setIsStreaming(true);

      await streamAudioMessage(conversationId, blob, {
        // STT 변환 결과 → 유저 말풍선 추가
        onTranscription: (text) => {
          const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            created_at: new Date().toISOString(),
          };
          addMessage(userMsg);
          addMessage(aiPlaceholder);
        },
        onChunk: (chunk) => {
          appendToLastMessage(chunk);
        },
        onDone: (fullText) => {
          setIsStreaming(false);
          // Phase 3.5: 음성 모드 자동 재생
          autoPlayTTS(fullText);
        },
        onError: (error) => {
          console.error("Audio stream error:", error);
          setIsStreaming(false);
        },
      });
    },
    [conversationId, isStreaming, addMessage, appendToLastMessage, setIsStreaming, autoPlayTTS]
  );

  // Phase 3.5: 오디오 레코더 훅
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onComplete: handleAudioComplete,
  });

  // ─── 대화 초기화 ───
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      reset();

      // 페르소나 정보 로드
      const persona = await apiFetch<Persona>(
        `/api/v1/personas/${personaId}`
      );
      personaRef.current = persona;

      // 시나리오 정보 (페르소나 상세에서 추출)
      const detail = await apiFetch<{ scenarios: Scenario[] }>(
        `/api/v1/personas/${personaId}`
      );
      scenarioRef.current =
        detail.scenarios.find((s) => s.id === scenarioId) || null;

      // 대화 생성 → 서버에서 AI 첫 인사 메시지 생성
      const conv = await apiFetch<ConversationResponse>(
        "/api/v1/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            persona_id: personaId,
            scenario_id: scenarioId,
          }),
        }
      );
      setConversationId(conv.id);

      // 메시지 로드 (AI 인사 포함)
      const msgs = await apiFetch<MessageResponse[]>(
        `/api/v1/conversations/${conv.id}/messages`
      );
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        }))
      );
      scrollToBottom();
    }

    init();
  }, [personaId, scenarioId, reset, setConversationId, setMessages, scrollToBottom]);

  // 메시지 추가/변경 시 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── 텍스트 메시지 전송 (SSE 스트리밍) ───
  const handleSend = async (text: string) => {
    if (!conversationId || isStreaming) return;

    // 유저 메시지 로컬 추가
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);

    // AI 응답 플레이스홀더 (스트리밍 중 점진적으로 채워짐)
    const aiPlaceholder: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };
    addMessage(aiPlaceholder);
    setIsStreaming(true);

    await streamMessage(conversationId, text, {
      onChunk: (chunk) => {
        appendToLastMessage(chunk);
      },
      onDone: (fullText) => {
        setIsStreaming(false);
        // Phase 3.5: 음성 모드 자동 재생
        autoPlayTTS(fullText);
      },
      onError: (error) => {
        console.error("Stream error:", error);
        appendToLastMessage("\n[오류가 발생했습니다]");
        setIsStreaming(false);
      },
    });
  };

  // ─── 대화 종료 → XP 보상 + 리포트 분석 트리거 ───
  const handleEnd = async () => {
    if (conversationId) {
      // 1. 대화 종료 (XP/스트릭 자동 부여)
      await apiFetch(`/api/v1/conversations/${conversationId}/end`, {
        method: "PATCH",
      });
      // 2. CrewAI 비동기 분석 트리거 (fire-and-forget)
      apiFetch(`/api/v1/reports/conversations/${conversationId}/analyze`, {
        method: "POST",
      }).catch(() => {
        // 분석 트리거 실패는 치명적이지 않음
      });
      // 3. 리포트 페이지로 이동
      const convId = conversationId;
      reset();
      router.push(`/report/${convId}`);
    } else {
      reset();
      router.push(`/talk/${personaId}`);
    }
  };

  // ─── 힌트 사용 → 텍스트 입력에 삽입 ───
  const handleUseExpression = (text: string) => {
    inputRef.current?.insertText(text);
  };

  const avatarEmoji = personaRef.current?.icon_emoji || "🤖";

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* ─── 미니 헤더 (48px) ─── */}
      <header className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
        {/* 뒤로가기 */}
        <button
          onClick={() => {
            reset();
            router.back();
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>

        {/* 시나리오 제목 */}
        <span className="text-sm font-medium text-gray-700 truncate mx-4">
          {scenarioRef.current?.icon_emoji} {scenarioRef.current?.title || "대화"}
        </span>

        {/* 오른쪽 버튼 그룹: 힌트 + 종료 */}
        <div className="flex items-center gap-2">
          {/* 힌트 버튼 💡 */}
          <button
            onClick={() => setHintOpen(true)}
            className="text-warn hover:text-warn/80 transition-colors"
            title="표현 힌트"
          >
            <Lightbulb size={20} />
          </button>
          {/* 대화 종료 ✕ */}
          <button
            onClick={handleEnd}
            className="text-gray-400 hover:text-error"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* ─── 대화 메시지 영역 ─── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
      >
        {messages.map((msg) =>
          msg.role === "assistant" && msg.content === "" && isStreaming ? (
            <TypingIndicator key={msg.id} avatarEmoji={avatarEmoji} />
          ) : (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.created_at}
              avatarEmoji={avatarEmoji}
              personaId={personaId}
            />
          )
        )}
      </div>

      {/* ─── 텍스트/음성 입력 바 ─── */}
      <TextInputBar
        ref={inputRef}
        onSend={handleSend}
        disabled={isStreaming}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {/* ─── 힌트 바텀시트 ─── */}
      {conversationId && (
        <HintBottomSheet
          conversationId={conversationId}
          isOpen={hintOpen}
          onClose={() => setHintOpen(false)}
          onUseExpression={handleUseExpression}
        />
      )}
    </div>
  );
}
