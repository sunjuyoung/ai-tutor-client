"use client";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  avatarEmoji?: string;
}

export default function ChatBubble({
  role,
  content,
  timestamp,
  avatarEmoji,
}: ChatBubbleProps) {
  const isUser = role === "user";

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
        {timestamp && (
          <p
            className={`text-[11px] mt-1 ${
              isUser ? "text-brand/50" : "text-gray-300"
            }`}
          >
            {new Date(timestamp).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
