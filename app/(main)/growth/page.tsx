"use client";

/**
 * 성장 대시보드 — Phase 3 강화 버전
 *
 * UIUX.md 5.6절 기반:
 * - 주간/월간 학습 요약 (총 대화 시간, 평균 유창성, 배운 표현, 오류 추이)
 * - 문법 오류 추이 라인 차트 (Recharts)
 * - 시나리오별 최고 유창성 점수 바
 * - 자주 틀리는 패턴 Top 3
 * - XP/레벨 현황
 * - 과거 리포트 목록
 *
 * API: GET /api/v1/growth?period=weekly|monthly
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { CorrectionReport } from "@/types/report";
import { useAuthStore } from "@/stores/authStore";
import ErrorTrendChart from "@/components/growth/ErrorTrendChart";
import ScenarioScoreBar from "@/components/growth/ScenarioScoreBar";

/** GET /api/v1/growth 응답 타입 */
interface GrowthData {
  summary: {
    total_duration_min: number;
    total_conversations: number;
    avg_fluency: number | null;
    total_expressions: number;
    total_errors: number;
  };
  error_trend: {
    week_label: string;
    week_start: string;
    error_count: number;
  }[];
  scenario_scores: {
    scenario_id: string;
    title: string;
    emoji: string;
    best_fluency: number | null;
  }[];
  common_errors: {
    pattern: string;
    count: number;
  }[];
}

/** 대화별 리포트 데이터 (목록 표시용) */
interface ConversationItem {
  id: string;
  persona_id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  duration_sec: number | null;
}

interface Persona {
  id: string;
  name: string;
  icon_emoji: string;
}

interface ConversationReport {
  conversation: ConversationItem;
  persona: Persona | null;
  report: CorrectionReport | null;
}

export default function GrowthPage() {
  const { user, fetchUser } = useAuthStore();
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [items, setItems] = useState<ConversationReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 기간 변경 시 데이터 다시 로드
  useEffect(() => {
    loadAllData();
  }, [period]);

  async function loadAllData() {
    setLoading(true);
    try {
      // 성장 대시보드 데이터 + 리포트 목록 병렬 로드
      const [growth, conversations, personaList] = await Promise.all([
        apiFetch<GrowthData>(`/api/v1/growth?period=${period}`),
        apiFetch<ConversationItem[]>("/api/v1/conversations?limit=20"),
        apiFetch<Persona[]>("/api/v1/personas"),
      ]);

      setGrowthData(growth);

      // 리포트 목록 구성
      const personaMap: Record<string, Persona> = {};
      personaList.forEach((p) => (personaMap[p.id] = p));
      const completed = conversations.filter((c) => c.ended_at !== null);

      const results: ConversationReport[] = await Promise.all(
        completed.map(async (conv) => {
          let report: CorrectionReport | null = null;
          try {
            report = await apiFetch<CorrectionReport>(
              `/api/v1/reports/${conv.id}`
            );
          } catch {
            // 리포트 없거나 처리 중
          }
          return {
            conversation: conv,
            persona: personaMap[conv.persona_id] || null,
            report,
          };
        })
      );
      setItems(results);
    } catch {
      // 미로그인
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-12 pb-20 max-w-lg mx-auto animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-36 mb-6" />
        <div className="h-24 bg-gray-100 rounded-xl mb-6" />
        <div className="h-48 bg-gray-100 rounded-xl mb-6" />
        <div className="h-24 bg-gray-100 rounded-xl mb-6" />
      </div>
    );
  }

  const summary = growthData?.summary;

  return (
    <div className="px-5 pt-12 pb-20 max-w-lg mx-auto">
      {/* ─── 헤더 + 기간 필터 ─── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">나의 성장</h1>
        {/* 기간 드롭다운 */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "weekly" | "monthly")}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white"
        >
          <option value="weekly">주간</option>
          <option value="monthly">월간</option>
        </select>
      </div>

      {/* ─── 이번 주/월 요약 카드 ─── */}
      {summary && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">
            {period === "weekly" ? "이번 주" : "이번 달"} 요약
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* 총 대화 시간 */}
            <div className="text-center">
              <p className="text-2xl font-bold text-brand">
                {summary.total_duration_min}분
              </p>
              <p className="text-xs text-gray-400 mt-1">총 대화 시간</p>
            </div>
            {/* 평균 유창성 */}
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {summary.avg_fluency !== null ? summary.avg_fluency : "-"}
              </p>
              <p className="text-xs text-gray-400 mt-1">평균 유창성</p>
            </div>
            {/* 배운 표현 */}
            <div className="text-center">
              <p className="text-2xl font-bold text-info">
                {summary.total_expressions}개
              </p>
              <p className="text-xs text-gray-400 mt-1">배운 표현</p>
            </div>
            {/* 문법 오류 */}
            <div className="text-center">
              <p className="text-2xl font-bold text-warn">
                {summary.total_errors}개
              </p>
              <p className="text-xs text-gray-400 mt-1">문법 오류</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── XP / 레벨 현황 ─── */}
      <div className="bg-brand-subtle rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-brand">
            Lv.{user?.level || 1}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand">
            {(user?.xp || 0).toLocaleString()} XP
          </p>
          <p className="text-xs text-brand/60">
            🔥 {user?.streak_days || 0}일 연속 학습
          </p>
        </div>
      </div>

      {/* ─── 문법 오류 추이 라인 차트 ─── */}
      {growthData && growthData.error_trend.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            문법 오류 추이
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <ErrorTrendChart data={growthData.error_trend} />
          </div>
        </section>
      )}

      {/* ─── 시나리오별 성과 ─── */}
      {growthData && growthData.scenario_scores.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            시나리오별 성과
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {growthData.scenario_scores.map((s) => (
              <ScenarioScoreBar
                key={s.scenario_id}
                emoji={s.emoji}
                title={s.title}
                score={s.best_fluency}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── 자주 틀리는 패턴 Top 3 ─── */}
      {growthData && growthData.common_errors.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            자주 틀리는 패턴 Top 3
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {growthData.common_errors.map((err, idx) => (
              <div
                key={err.pattern}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm font-bold text-brand w-6">
                  {idx + 1}.
                </span>
                <span className="text-sm text-gray-700 flex-1">
                  {err.pattern}
                </span>
                <span className="text-xs text-gray-400">({err.count}회)</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 과거 리포트 목록 ─── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          대화 리포트
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <span className="text-3xl">📊</span>
            <p className="text-sm text-gray-400 mt-2">
              아직 완료한 대화가 없어요.
              <br />
              대화를 끝까지 마치면 리포트가 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(({ conversation, persona, report }) => (
              <Link
                key={conversation.id}
                href={`/report/${conversation.id}`}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand/30 transition-colors"
              >
                {/* 페르소나 아이콘 */}
                <span className="text-2xl">
                  {persona?.icon_emoji || "💬"}
                </span>

                {/* 대화 정보 */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {persona?.name || "대화"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(conversation.started_at).toLocaleDateString(
                      "ko-KR"
                    )}{" "}
                    &middot; {conversation.message_count}개 메시지
                  </p>
                </div>

                {/* 유창성 점수 배지 */}
                {report?.fluency_score !== null &&
                  report?.fluency_score !== undefined && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        report.fluency_score >= 80
                          ? "bg-success/10 text-success"
                          : report.fluency_score >= 50
                          ? "bg-brand-subtle text-brand"
                          : "bg-warn/10 text-warn"
                      }`}
                    >
                      {report.fluency_score}점
                    </span>
                  )}

                {/* 리포트 미생성 */}
                {!report && (
                  <span className="text-xs text-gray-300">리포트 없음</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
