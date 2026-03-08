"use client";

import { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useChatStore, type ChatMessage } from "@/stores/chatStore";
import { streamMessage } from "@/hooks/useSSE";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import TextInputBar from "@/components/chat/TextInputBar";

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
    setConversationId,
    setMessages,
    addMessage,
    appendToLastMessage,
    setIsStreaming,
    reset,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<Persona | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  // Initialize conversation
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      reset();

      // Fetch persona info
      const persona = await apiFetch<Persona>(
        `/api/v1/personas/${personaId}`
      );
      personaRef.current = persona;

      // Fetch scenario info from persona detail
      const detail = await apiFetch<{ scenarios: Scenario[] }>(
        `/api/v1/personas/${personaId}`
      );
      scenarioRef.current =
        detail.scenarios.find((s) => s.id === scenarioId) || null;

      // Create conversation
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

      // Load messages (should include the AI greeting)
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text: string) => {
    if (!conversationId || isStreaming) return;

    // Add user message locally
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Add placeholder for AI response
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

  const handleEnd = async () => {
    if (conversationId) {
      await apiFetch(`/api/v1/conversations/${conversationId}/end`, {
        method: "PATCH",
      });
    }
    reset();
    router.push(`/talk/${personaId}`);
  };

  const avatarEmoji = personaRef.current?.icon_emoji || "🤖";

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Mini header */}
      <header className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
        <button
          onClick={() => {
            reset();
            router.back();
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-700 truncate mx-4">
          {scenarioRef.current?.icon_emoji} {scenarioRef.current?.title || "대화"}
        </span>
        <button
          onClick={handleEnd}
          className="text-gray-400 hover:text-error"
        >
          <X size={20} />
        </button>
      </header>

      {/* Messages area */}
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

      {/* Input bar */}
      <TextInputBar onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
