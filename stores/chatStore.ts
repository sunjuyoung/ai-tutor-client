import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatStore {
  conversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  // Phase 3.5: 음성 모드 상태
  isVoiceMode: boolean;
  isRecording: boolean;
  isPlayingAudio: boolean;
  setConversationId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setIsStreaming: (v: boolean) => void;
  setIsVoiceMode: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setIsPlayingAudio: (v: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversationId: null,
  messages: [],
  isStreaming: false,
  // Phase 3.5: 음성 모드 상태
  isVoiceMode: false,
  isRecording: false,
  isPlayingAudio: false,

  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  appendToLastMessage: (text) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: msgs[msgs.length - 1].content + text,
        };
      }
      return { messages: msgs };
    }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setIsVoiceMode: (v) => set({ isVoiceMode: v }),
  setIsRecording: (v) => set({ isRecording: v }),
  setIsPlayingAudio: (v) => set({ isPlayingAudio: v }),
  reset: () =>
    set({
      conversationId: null,
      messages: [],
      isStreaming: false,
      isVoiceMode: false,
      isRecording: false,
      isPlayingAudio: false,
    }),
}));
