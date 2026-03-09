"use client";

/**
 * Waitlist 랜딩 페이지 — Phase 3 (W15)
 *
 * UIUX.md 11.1절 기반:
 * - 서비스 소개 (히어로 텍스트)
 * - 이메일 + 관심 언어 + 학습 상황 수집 폼
 * - 현재 대기자 수 실시간 표시
 * - 레퍼럴 코드 입력 (선택)
 * - 등록 완료 → 데모 페이지로 이동
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** API base URL */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** 학습 상황 옵션 */
const SITUATION_OPTIONS = [
  { value: "cafe", label: "카페/레스토랑 주문" },
  { value: "travel", label: "여행 중 현지인과 대화" },
  { value: "interview", label: "취업 면접 연습" },
  { value: "business", label: "비즈니스 미팅" },
  { value: "daily", label: "친구와 일상 수다" },
];

/** Suspense 래핑 — useSearchParams는 Suspense 경계 필요 (Next.js 16) */
export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-brand-subtle to-white" />}>
      <WaitlistPageContent />
    </Suspense>
  );
}

function WaitlistPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 레퍼럴 코드 (URL 파라미터에서 추출)
  const referralFromUrl = searchParams.get("ref") || "";

  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [referralCode, setReferralCode] = useState(referralFromUrl);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 대기자 수 로드
  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/waitlist/status`);
      if (res.ok) {
        const data = await res.json();
        setTotalCount(data.total_count);
      }
    } catch {
      // 무시
    }
  }

  /** 언어 체크박스 토글 */
  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
    );
  }

  /** Waitlist 등록 */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (languages.length === 0) {
      setError("배우고 싶은 언어를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          interested_languages: languages.join(","),
          interested_situation: situation || null,
          referred_by: referralCode || null,
        }),
      });

      if (res.status === 409) {
        setError("이미 등록된 이메일입니다.");
        return;
      }

      if (!res.ok) {
        setError("등록에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      // 데모 페이지로 이동 (등록 정보 전달)
      router.push(
        `/waitlist/demo?position=${data.queue_position}&code=${data.referral_code}&lang=${languages[0]}`
      );
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle to-white">
      <div className="px-6 pt-16 pb-12 max-w-md mx-auto">
        {/* ─── 히어로 섹션 ─── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            AI 친구와
            <br />
            진짜 대화로 배우는
            <br />
            <span className="text-brand">영어 &middot; 일본어</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            교과서가 아닌, 실제 상황에서 자연스럽게 말하는 연습
          </p>
        </div>

        {/* ─── 등록 폼 ─── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이메일 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {/* 배우고 싶은 언어 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              배우고 싶은 언어
            </label>
            <div className="flex gap-3">
              {[
                { code: "en", flag: "🇺🇸", label: "영어" },
                { code: "ja", flag: "🇯🇵", label: "일본어" },
              ].map(({ code, flag, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleLanguage(code)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                    languages.includes(code)
                      ? "border-brand bg-brand-subtle text-brand font-semibold"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  <span>{flag}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* 가장 해보고 싶은 상황 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              가장 해보고 싶은 상황
            </label>
            <div className="space-y-2">
              {SITUATION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                    situation === opt.value
                      ? "border-brand bg-brand-subtle text-brand"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="situation"
                    value={opt.value}
                    checked={situation === opt.value}
                    onChange={() => setSituation(opt.value)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      situation === opt.value
                        ? "border-brand"
                        : "border-gray-300"
                    }`}
                  >
                    {situation === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-brand" />
                    )}
                  </span>
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 추천인 코드 (선택) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              추천인 코드 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand uppercase"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "무료 베타 신청하기"}
          </button>
        </form>

        {/* ─── 대기자 수 ─── */}
        {totalCount !== null && (
          <p className="text-center text-sm text-gray-400 mt-6">
            현재 <span className="font-bold text-brand">{totalCount}명</span>이
            대기 중이에요
          </p>
        )}
      </div>
    </div>
  );
}
