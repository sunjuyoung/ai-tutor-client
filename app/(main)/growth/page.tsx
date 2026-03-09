"use client";

/**
 * 성장 페이지 — 학습 통계 + 과거 리포트 목록
 *
 * 표시 항목:
 * - 주간 학습 요약 (총 대화 수, 평균 유창성 점수)
 * - 과거 교정 리포트 목록 → /report/{id} 링크
 * - XP/레벨 현황
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { CorrectionReport } from "@/types/report";
import { useAuthStore } from "@/stores/authStore";

/** 대화 목록 아이템 (리포트 유무 확인용) */
interface ConversationItem {
  id: string;
  persona_id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  duration_sec: number | null;
}

/** 페르소나 (이름/이모지 표시용) */
interface Persona {
  id: string;
  name: string;
  icon_emoji: string;
}

/** 대화별 리포트 데이터 (목록 표시용) */
interface ConversationReport {
  conversation: ConversationItem;
  persona: Persona | null;
  report: CorrectionReport | null;
}

export default function GrowthPage() {
  const { user, fetchUser } = useAuthStore();
  const [items, setItems] = useState<ConversationReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    loadGrowthData();
  }, [fetchUser]);

  async function loadGrowthData() {
    try {
      // 1. 완료된 대화 목록 로드 (최대 20개)
      const conversations = await apiFetch<ConversationItem[]>(
        "/api/v1/conversations?limit=20"
      );

      // 완료된 대화만 필터
      const completed = conversations.filter((c) => c.ended_at !== null);

      // 2. 페르소나 목록 로드
      const personaList = await apiFetch<Persona[]>("/api/v1/personas");
      const personaMap: Record<string, Persona> = {};
      personaList.forEach((p) => (personaMap[p.id] = p));

      // 3. 각 대화에 대해 리포트 시도 (실패해도 계속)
      const results: ConversationReport[] = await Promise.all(
        completed.map(async (conv) => {
          let report: CorrectionReport | null = null;
          try {
            report = await apiFetch<CorrectionReport>(
              `/api/v1/reports/${conv.id}`
            );
          } catch {
            // 리포트 없거나 아직 처리 중 — 무시
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

  // ─── 통계 계산 ───
  const totalConversations = items.length;
  const reportsWithScore = items.filter(
    (i) => i.report?.fluency_score !== null && i.report?.fluency_score !== undefined
  );
  const avgFluency =
    reportsWithScore.length > 0
      ? Math.round(
          reportsWithScore.reduce(
            (sum, i) => sum + (i.report?.fluency_score || 0),
            0
          ) / reportsWithScore.length
        )
      : null;
  const totalCorrections = items.reduce(
    (sum, i) => sum + (i.report?.corrections?.length || 0),
    0
  );
  const totalExpressions = items.reduce(
    (sum, i) => sum + (i.report?.new_expressions?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="px-5 pt-12 pb-6 max-w-lg mx-auto animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-36 mb-6" />
        <div className="h-24 bg-gray-100 rounded-xl mb-6" />
        <div className="h-16 bg-gray-100 rounded-xl mb-3" />
        <div className="h-16 bg-gray-100 rounded-xl mb-3" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">나의 성장</h1>

      {/* ─── 학습 요약 카드 ─── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">학습 요약</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* 총 대화 수 */}
          <div className="text-center">
            <p className="text-2xl font-bold text-brand">
              {totalConversations}
            </p>
            <p className="text-xs text-gray-400 mt-1">완료한 대화</p>
          </div>
          {/* 평균 유창성 */}
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {avgFluency !== null ? avgFluency : "-"}
            </p>
            <p className="text-xs text-gray-400 mt-1">평균 유창성</p>
          </div>
          {/* 교정 수 */}
          <div className="text-center">
            <p className="text-2xl font-bold text-warn">{totalCorrections}</p>
            <p className="text-xs text-gray-400 mt-1">교정 항목</p>
          </div>
          {/* 배운 표현 */}
          <div className="text-center">
            <p className="text-2xl font-bold text-info">{totalExpressions}</p>
            <p className="text-xs text-gray-400 mt-1">배운 표현</p>
          </div>
        </div>
      </div>

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

                {/* 유창성 점수 배지 (리포트 있을 때만) */}
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
