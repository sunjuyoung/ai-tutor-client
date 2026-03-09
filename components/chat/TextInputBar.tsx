"use client";

/**
 * 텍스트 입력 바 — 채팅 하단 고정 입력 영역
 *
 * 기능:
 * - 자동 높이 조절 textarea (최대 120px)
 * - Enter로 전송, Shift+Enter로 줄바꿈
 * - 스트리밍 중 비활성화
 * - forwardRef로 외부에서 insertText() 호출 가능 (힌트 삽입용)
 */

import { useState, useRef, useImperativeHandle, forwardRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface TextInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/** 외부에서 사용할 수 있는 메서드 */
export interface TextInputBarRef {
  insertText: (text: string) => void;
}

const TextInputBar = forwardRef<TextInputBarRef, TextInputBarProps>(
  function TextInputBar({ onSend, disabled }, ref) {
    const [text, setText] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // 외부에서 텍스트 삽입 (힌트 "이 표현 사용하기" 버튼)
    useImperativeHandle(ref, () => ({
      insertText: (newText: string) => {
        setText(newText);
        // textarea에 포커스
        inputRef.current?.focus();
      },
    }));

    const handleSend = () => {
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    // textarea 높이 자동 조절 (입력 시)
    const handleInput = () => {
      const el = inputRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
      }
    };

    return (
      <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-gray-100">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="메시지를 입력하세요..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    );
  }
);

export default TextInputBar;
