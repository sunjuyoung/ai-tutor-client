"use client";

/**
 * 대화 이어하기 페이지
 *
 * 기존 채팅 페이지(/talk/[personaId]/[scenarioId])와 동일한 UI이지만,
 * 새 대화를 생성하지 않고 기존 대화를 불러와 이어서 진행한다.
 *
 * 핵심 차이점:
 * - 새 대화 생성(POST /conversations) 대신 기존 대화 조회(GET /conversations/{id})
 * - 페르소나/시나리오 정보를 대화 상세 응답에서 추출 (별도 API 호출 불필요)
 * - 이미 종료된 대화(ended_at !== null)는 리포트 페이지로 리다이렉트
 * - AI 첫 인사 메시지를 새로 생성하지 않음 (기존 메시지 히스토리 사용)
 *
 * URL 패턴: /talk/resume/{conversationId}
 * 레이아웃: (main)/layout.tsx의 정규식이 /talk/ 하위 2+ depth를 매칭하므로
 *           BottomTabBar가 자동으로 숨겨진다.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X, Lightbulb } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useChatStore, type ChatMessage } from "@/stores/chatStore";
import { streamMessage } from "@/hooks/useSSE";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import TextInputBar from "@/components/chat/TextInputBar";
import HintBottomSheet from "@/components/chat/HintBottomSheet";

/** GET /api/v1/conversations/{id} 응답 타입 */
interface ConversationDetail {
  id: string;
  persona_id: string;
  scenario_id: string;
  ended_at: string | null;
  message_count: number;
  persona_name: string;
  persona_emoji: string;
  scenario_title: string;
  scenario_emoji: string;
}

/** GET /api/v1/conversations/{id}/messages 응답 타입 */
interface MessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function ResumeChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const {
    messages,
    isStreaming,
    setConversationId,
    setMessages,
    addMessage,
    appendToLastMessage,
    setIsStreaming,
    reset,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const inputRef = useRef<{ insertText: (text: string) => void } | null>(null);

  // 대화 메타데이터 (페르소나/시나리오 정보)
  const [convMeta, setConvMeta] = useState<ConversationDetail | null>(null);
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

  // ─── 기존 대화 불러오기 ───
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      reset();

      // 1. 대화 상세 조회 (페르소나/시나리오 메타데이터 포함)
      const detail = await apiFetch<ConversationDetail>(
        `/api/v1/conversations/${conversationId}`
      );

      // 2. 이미 종료된 대화면 리포트 페이지로 리다이렉트
      if (detail.ended_at) {
        router.replace(`/report/${conversationId}`);
        return;
      }

      setConvMeta(detail);
      setConversationId(detail.id);

      // 3. 기존 메시지 히스토리 로드 (새 인사 메시지 생성 없음)
      const msgs = await apiFetch<MessageResponse[]>(
        `/api/v1/conversations/${conversationId}/messages`
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
  }, [conversationId, reset, setConversationId, setMessages, scrollToBottom, router]);

  // 메시지 추가/변경 시 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── 메시지 전송 (SSE 스트리밍) ───
  // 기존 채팅 페이지와 완전히 동일한 로직
  const handleSend = async (text: string) => {
    const convId = useChatStore.getState().conversationId;
    if (!convId || isStreaming) return;

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

    await streamMessage(convId, text, {
      onChunk: (chunk) => {
        appendToLastMessage(chunk);
      },
      onDone: () => {
        setIsStreaming(false);
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
    const convId = useChatStore.getState().conversationId;
    if (convId) {
      // 1. 대화 종료 (XP/스트릭 자동 부여)
      await apiFetch(`/api/v1/conversations/${convId}/end`, {
        method: "PATCH",
      });
      // 2. CrewAI 비동기 분석 트리거 (fire-and-forget)
      apiFetch(`/api/v1/reports/conversations/${convId}/analyze`, {
        method: "POST",
      }).catch(() => {
        // 분석 트리거 실패는 치명적이지 않음
      });
      // 3. 리포트 페이지로 이동
      reset();
      router.push(`/report/${convId}`);
    } else {
      reset();
      router.push("/talk");
    }
  };

  // ─── 힌트 사용 → 텍스트 입력에 삽입 ───
  const handleUseExpression = (text: string) => {
    inputRef.current?.insertText(text);
  };

  const avatarEmoji = convMeta?.persona_emoji || "🤖";
  const storeConversationId = useChatStore((s) => s.conversationId);

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
          {convMeta?.scenario_emoji} {convMeta?.scenario_title || "대화"}
        </span>

        {/* 오른쪽 버튼 그룹: 힌트 + 종료 */}
        <div className="flex items-center gap-2">
          {/* 힌트 버튼 */}
          <button
            onClick={() => setHintOpen(true)}
            className="text-warn hover:text-warn/80 transition-colors"
            title="표현 힌트"
          >
            <Lightbulb size={20} />
          </button>
          {/* 대화 종료 */}
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
            />
          )
        )}
      </div>

      {/* ─── 텍스트 입력 바 ─── */}
      <TextInputBar ref={inputRef} onSend={handleSend} disabled={isStreaming} />

      {/* ─── 힌트 바텀시트 ─── */}
      {storeConversationId && (
        <HintBottomSheet
          conversationId={storeConversationId}
          isOpen={hintOpen}
          onClose={() => setHintOpen(false)}
          onUseExpression={handleUseExpression}
        />
      )}
    </div>
  );
}
