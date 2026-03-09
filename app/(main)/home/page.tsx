"use client";

/**
 * 홈 페이지 — 학습 대시보드
 *
 * GET /api/v1/home 단일 API로 모든 데이터 로드:
 * - 🔥 스트릭 카드 (연속 학습 일수)
 * - XP 프로그레스 바 (현재/다음 레벨 임계값)
 * - 최근 대화 목록
 * - 추천 시나리오 (학습 언어 기반)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

/** GET /api/v1/home 응답 타입 */
interface HomeData {
  user: {
    nickname: string;
    email: string;
    xp: number;
    level: number;
    streak_days: number;
    xp_to_next: number | null;
    plan_type: string;
    target_language: string | null;
  };
  recent_conversations: {
    id: string;
    persona_name: string;
    persona_emoji: string;
    started_at: string | null;
    ended_at: string | null;
    message_count: number;
    duration_sec: number | null;
  }[];
  recommended_scenarios: {
    id: string;
    title: string;
    description: string;
    icon_emoji: string;
    persona_name: string;
    persona_emoji: string;
    persona_id: string;
    difficulty: number;
    estimated_minutes: number;
  }[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        const homeData = await apiFetch<HomeData>("/api/v1/home");
        setData(homeData);
      } catch {
        // 미로그인 상태
      } finally {
        setLoading(false);
      }
    }
    loadHome();
  }, []);

  if (loading) {
    return (
      <div className="px-5 pt-12 pb-6 max-w-lg mx-auto animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-32 mb-8" />
        <div className="h-12 bg-gray-100 rounded-full mb-8" />
        <div className="h-24 bg-gray-100 rounded-xl mb-8" />
      </div>
    );
  }

  if (!data) return null;

  const { user, recent_conversations, recommended_scenarios } = data;

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto">
      {/* ─── 인사 ─── */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        안녕, {user.nickname}!
      </h1>
      <p className="text-sm text-gray-400 mb-6">오늘도 함께 연습해볼까요?</p>

      {/* ─── CTA 버튼 ─── */}
      <Link
        href="/talk"
        className="flex items-center justify-center w-full h-12 bg-brand text-white font-semibold rounded-full hover:bg-brand/90 transition-colors shadow-glow mb-6"
      >
        대화 시작하기
      </Link>

      {/* ─── 스트릭 + XP + 레벨 카드 ─── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        {/* 상단: 스트릭 강조 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-warn/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">&#128293;</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {user.streak_days}일 연속
            </p>
            <p className="text-xs text-gray-400">학습 스트릭</p>
          </div>
        </div>

        {/* 하단: XP 프로그레스 */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-700 font-medium">
            Lv.{user.level}
          </span>
          <span className="text-gray-400">
            {user.xp.toLocaleString()} XP
            {user.xp_to_next !== null && (
              <span> / 다음 레벨까지 {user.xp_to_next.toLocaleString()}</span>
            )}
          </span>
        </div>

        {/* XP 프로그레스 바 */}
        {user.xp_to_next !== null && (
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  (1 - user.xp_to_next / (user.xp + user.xp_to_next)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        )}

        {/* 플랜 배지 */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              user.plan_type === "PRO"
                ? "bg-brand-subtle text-brand"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {user.plan_type}
          </span>
          <span className="text-xs text-gray-400">
            {user.target_language === "en"
              ? "🇺🇸 영어"
              : user.target_language === "ja"
              ? "🇯🇵 일본어"
              : ""}
          </span>
        </div>
      </div>

      {/* ─── 최근 대화 ─── */}
      {recent_conversations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            최근 대화
          </h2>
          <div className="flex flex-col gap-2">
            {recent_conversations.map((conv) => (
              <Link
                key={conv.id}
                href={
                  conv.ended_at
                    ? `/report/${conv.id}`       /* 완료 → 리포트 */
                    : `/talk/resume/${conv.id}`   /* 진행중 → 이어하기 */
                }
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand/30 transition-colors"
              >
                <span className="text-2xl">{conv.persona_emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {conv.persona_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {conv.started_at
                      ? new Date(conv.started_at).toLocaleDateString("ko-KR")
                      : ""}{" "}
                    &middot; {conv.message_count}개 메시지
                    {conv.duration_sec !== null && (
                      <span>
                        {" "}
                        &middot; {Math.round(conv.duration_sec / 60)}분
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    conv.ended_at
                      ? "bg-gray-100 text-gray-400"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {conv.ended_at ? "완료" : "진행중"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── 추천 시나리오 ─── */}
      {recommended_scenarios.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            추천 시나리오
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {recommended_scenarios.map((s) => (
              <Link
                key={s.id}
                href={`/talk/${s.persona_id}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-brand/30 transition-colors"
              >
                <span className="text-2xl">{s.icon_emoji}</span>
                <span className="text-sm font-medium text-gray-900 text-center">
                  {s.title}
                </span>
                <span className="text-xs text-gray-400">
                  {s.persona_emoji} {s.persona_name}
                </span>
                <div className="flex items-center gap-1">
                  {/* 난이도 별 */}
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${
                        i < s.difficulty ? "text-warn" : "text-gray-200"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    ~{s.estimated_minutes}분
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 대화가 없고 추천 시나리오도 없을 때 */}
      {recent_conversations.length === 0 &&
        recommended_scenarios.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl">💬</span>
            <p className="text-sm text-gray-400 mt-3">
              아직 대화 기록이 없어요.
              <br />
              첫 대화를 시작해 보세요!
            </p>
          </div>
        )}
    </div>
  );
}
