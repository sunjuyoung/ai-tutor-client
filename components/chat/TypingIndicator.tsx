"use client";

interface TypingIndicatorProps {
  avatarEmoji?: string;
}

export default function TypingIndicator({ avatarEmoji }: TypingIndicatorProps) {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0">
        {avatarEmoji || "🤖"}
      </div>
      <div className="bg-white shadow-sm border border-gray-50 rounded-2xl px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
