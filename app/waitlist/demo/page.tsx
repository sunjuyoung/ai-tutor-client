"use client";

/**
 * 텍스트 미니 데모 — Phase 3 (W15)
 *
 * UIUX.md 11.2절 기반:
 * - Waitlist 등록 직후 3턴 대화 체험
 * - 로그인 불필요 (백엔드 프록시로 OpenAI 호출)
 * - 항상 힌트 표시
 * - 3턴 완료 후 → 베타 안내 + 공유 CTA
 *
 * API: POST /api/v1/waitlist/demo
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** 대화 메시지 */
interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

/** Suspense 래핑 — useSearchParams는 Suspense 경계 필요 (Next.js 16) */
export default function DemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-subtle" />}>
      <DemoPageContent />
    </Suspense>
  );
}

function DemoPageContent() {
  const searchParams = useSearchParams();
  const position = searchParams.get("position") || "?";
  const referralCode = searchParams.get("code") || "";
  const language = searchParams.get("lang") || "ja";

  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [turn, setTurn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const MAX_TURNS = 3;

  /** 데모 시작 — AI 첫 인사 */
  async function startDemo() {
    setIsStarted(true);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/waitlist/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "(The learner just arrived. Greet them warmly.)",
          turn: 0,
          language,
          history: [],
        }),
      });
      const data = await res.json();

      setMessages([{ role: "assistant", content: data.reply }]);
      setHint(data.hint || "");
      setTurn(1);
    } catch {
      setMessages([
        {
          role: "assistant",
          content:
            language === "ja"
              ? "はじめまして！私はユイです。よろしくね！"
              : "Hey! I'm Emma. Nice to meet you!",
        },
      ]);
      setTurn(1);
    } finally {
      setIsLoading(false);
    }
  }

  /** 유저 메시지 전송 */
  async function sendMessage() {
    if (!input.trim() || isLoading || isFinished) return;

    const userMsg: DemoMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // API 히스토리 형식으로 변환
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/api/v1/waitlist/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          turn,
          language,
          history,
        }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      setHint(data.hint || "");
      setTurn((prev) => prev + 1);

      if (data.is_last || turn >= MAX_TURNS) {
        setIsFinished(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  /** 초대 링크 복사 */
  function copyReferralLink() {
    const link = `${window.location.origin}/waitlist?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    alert("초대 링크가 복사되었습니다!");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle to-white flex flex-col">
      <div className="px-5 pt-8 pb-6 max-w-md mx-auto flex-1 flex flex-col w-full">
        {/* ─── 헤더 ─── */}
        <div className="text-center mb-6">
          <p className="text-sm text-brand font-semibold">
            {position}번째로 등록했어요!
          </p>
          <p className="text-xs text-gray-400 mt-1">
            베타 초대까지 기다리는 동안, 텍스트로 먼저 만나보세요!
          </p>
        </div>

        {/* ─── 시작 전 화면 ─── */}
        {!isStarted && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-6xl mb-4">
              {language === "ja" ? "🇯🇵" : "🇺🇸"}
            </span>
            <p className="text-lg font-bold text-gray-900 mb-2">
              {language === "ja" ? "유이와 대화해보기" : "Emma와 대화해보기"}
            </p>
            <p className="text-sm text-gray-400 mb-6">3턴 체험 대화</p>
            <button
              onClick={startDemo}
              className="px-8 py-3 bg-brand text-white rounded-full font-semibold hover:bg-brand/90 transition-colors"
            >
              대화 시작하기
            </button>
          </div>
        )}

        {/* ─── 대화 영역 ─── */}
        {isStarted && (
          <>
            <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-brand-subtle text-gray-900 rounded-br-md"
                        : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* 타이핑 인디케이터 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <span className="text-gray-400 text-sm animate-pulse">
                      ...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ─── 힌트 표시 (항상) ─── */}
            {hint && !isFinished && (
              <div className="bg-warn/10 rounded-xl px-4 py-2.5 mb-3">
                <p className="text-xs text-warn font-semibold mb-0.5">힌트</p>
                <p className="text-sm text-gray-700">{hint}</p>
              </div>
            )}

            {/* ─── 남은 턴 수 ─── */}
            {!isFinished && (
              <p className="text-center text-xs text-gray-400 mb-2">
                남은 대화: {Math.max(MAX_TURNS - turn + 1, 0)}턴
              </p>
            )}

            {/* ─── 입력 바 또는 완료 화면 ─── */}
            {!isFinished ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={
                    language === "ja"
                      ? "일본어로 답해보세요..."
                      : "영어로 답해보세요..."
                  }
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-3 bg-brand text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  전송
                </button>
              </div>
            ) : (
              /* ─── 3턴 완료 → 베타 안내 ─── */
              <div className="text-center py-6">
                <p className="text-lg font-bold text-gray-900 mb-2">
                  베타에서는 음성으로 진짜 대화할 수 있어요
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  순서가 오면 이메일로 알려드릴게요!
                </p>

                {referralCode && (
                  <button
                    onClick={copyReferralLink}
                    className="w-full py-3 bg-brand text-white rounded-xl font-semibold mb-3"
                  >
                    친구에게 공유하고 우선 초대받기
                  </button>
                )}

                <p className="text-xs text-gray-400">
                  내 추천 코드:{" "}
                  <span className="font-mono font-bold text-brand">
                    {referralCode}
                  </span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
