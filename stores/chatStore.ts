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
  setConversationId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setIsStreaming: (v: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversationId: null,
  messages: [],
  isStreaming: false,

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
  reset: () =>
    set({ conversationId: null, messages: [], isStreaming: false }),
}));
