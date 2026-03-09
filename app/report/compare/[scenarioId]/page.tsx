"use client";

/**
 * Before/After 비교 리포트 — Phase 3 (W14)
 *
 * UIUX.md 5.5절 기반:
 * - 동일 시나리오의 첫 도전 vs 재도전 비교
 * - 문법 오류, 새 표현, 힌트 사용, 유창성 점수 비교 바 차트
 * - 성장률 퍼센트 표시
 * - 페르소나 코멘트
 * - SNS 공유 카드 생성 (html2canvas)
 *
 * API: GET /api/v1/benchmarks/{scenarioId}
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/** 벤치마크 라운드 데이터 */
interface BenchmarkRound {
  id: string;
  round_number: number;
  grammar_errors: number;
  new_expressions: number;
  hint_count: number;
  fluency_score: number | null;
  response_time_avg: number | null;
  persona_comment: string | null;
  created_at: string;
}

/** 성장 요약 */
interface Improvement {
  grammar_errors: { before: number; after: number; change_pct: number | null };
  new_expressions: { before: number; after: number; change: number };
  hint_count: { before: number; after: number; change_pct: number | null };
  fluency_score: { before: number | null; after: number | null; change: number };
}

/** GET /api/v1/benchmarks/{scenarioId} 응답 */
interface CompareData {
  scenario_id: string;
  scenario_title: string;
  scenario_emoji: string;
  persona_name: string;
  rounds: BenchmarkRound[];
  improvement: Improvement | null;
}

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.scenarioId as string;

  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComparison();
  }, [scenarioId]);

  async function loadComparison() {
    try {
      const result = await apiFetch<CompareData>(
        `/api/v1/benchmarks/${scenarioId}`
      );
      setData(result);
    } catch {
      // 벤치마크 없음
    } finally {
      setLoading(false);
    }
  }

  /** SNS 공유 카드 생성 (html2canvas) */
  async function handleShare() {
    if (!shareCardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `growth-${scenarioId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("공유 카드 생성 실패:", err);
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-12 pb-6 max-w-lg mx-auto animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48 mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl mb-6" />
      </div>
    );
  }

  if (!data || !data.improvement) {
    return (
      <div className="px-5 pt-12 pb-6 max-w-lg mx-auto text-center">
        <span className="text-4xl">📊</span>
        <p className="text-sm text-gray-400 mt-3">
          아직 비교할 데이터가 없어요.
          <br />
          같은 시나리오를 2번 이상 도전해보세요!
        </p>
        <button
          onClick={() => router.push("/talk")}
          className="mt-4 px-6 py-2 bg-brand text-white rounded-full text-sm font-semibold"
        >
          시나리오 선택하기
        </button>
      </div>
    );
  }

  const { improvement, rounds } = data;
  const firstRound = rounds[0];
  const lastRound = rounds[rounds.length - 1];

  return (
    <div className="px-5 pt-12 pb-20 max-w-lg mx-auto">
      {/* ─── 헤더 ─── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 text-sm"
        >
          &larr; 뒤로
        </button>
        <h1 className="text-lg font-bold text-gray-900">성장 리포트</h1>
        <button onClick={handleShare} className="text-brand text-sm font-semibold">
          공유
        </button>
      </div>

      {/* ─── 공유 카드 영역 (html2canvas 캡처 대상) ─── */}
      <div ref={shareCardRef} className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        {/* 시나리오 정보 */}
        <div className="text-center mb-4">
          <span className="text-3xl">{data.scenario_emoji}</span>
          <h2 className="text-lg font-bold text-gray-900 mt-1">
            {data.scenario_title}
          </h2>
          <p className="text-xs text-gray-400">
            {new Date(firstRound.created_at).toLocaleDateString("ko-KR")} (첫
            도전) &rarr;{" "}
            {new Date(lastRound.created_at).toLocaleDateString("ko-KR")} (재도전)
          </p>
        </div>

        {/* ─── 비교 바 차트들 ─── */}
        <div className="space-y-5">
          {/* 문법 오류 */}
          <CompareBar
            label="문법 오류"
            before={improvement.grammar_errors.before}
            after={improvement.grammar_errors.after}
            unit="개"
            changePct={improvement.grammar_errors.change_pct}
            isLowerBetter={true}
          />

          {/* 새 표현 사용 */}
          <CompareBar
            label="새 표현 사용"
            before={improvement.new_expressions.before}
            after={improvement.new_expressions.after}
            unit="개"
            changeAbs={improvement.new_expressions.change}
            isLowerBetter={false}
          />

          {/* 힌트 사용 */}
          <CompareBar
            label="힌트 사용"
            before={improvement.hint_count.before}
            after={improvement.hint_count.after}
            unit="회"
            changePct={improvement.hint_count.change_pct}
            isLowerBetter={true}
          />

          {/* 유창성 종합 점수 */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              유창성 종합 점수
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">
                  {improvement.fluency_score.before ?? "-"}점
                </p>
                <p className="text-xs text-gray-400">Before</p>
              </div>
              <span className="text-xl text-gray-300">&rarr;</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-brand">
                  {improvement.fluency_score.after ?? "-"}점
                </p>
                <p className="text-xs text-gray-400">After</p>
              </div>
            </div>
            {improvement.fluency_score.change > 0 && (
              <p className="text-center text-sm font-bold text-success mt-2">
                +{improvement.fluency_score.change}점 상승!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── 페르소나 코멘트 ─── */}
      {lastRound.persona_comment && (
        <div className="bg-brand-subtle rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-brand mb-1">
            {data.persona_name}의 한마디
          </p>
          <p className="text-sm text-gray-700">{lastRound.persona_comment}</p>
        </div>
      )}

      {/* ─── 하단 CTA ─── */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 py-3 bg-white border border-brand text-brand rounded-xl text-sm font-semibold"
        >
          성장 카드 공유
        </button>
        <button
          onClick={() => router.push("/talk")}
          className="flex-1 py-3 bg-brand text-white rounded-xl text-sm font-semibold"
        >
          다른 시나리오 도전
        </button>
      </div>
    </div>
  );
}

/**
 * 비교 바 — Before/After 수평 바 차트 컴포넌트
 */
function CompareBar({
  label,
  before,
  after,
  unit,
  changePct,
  changeAbs,
  isLowerBetter,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
  changePct?: number | null;
  changeAbs?: number;
  isLowerBetter: boolean;
}) {
  // 바 너비 계산 (최대값 기준 비율)
  const maxVal = Math.max(before, after, 1);
  const beforeWidth = (before / maxVal) * 100;
  const afterWidth = (after / maxVal) * 100;

  // 변화 표시 텍스트
  let changeText = "";
  let changeColor = "text-gray-400";
  if (changePct !== undefined && changePct !== null) {
    const isImproved = isLowerBetter ? changePct < 0 : changePct > 0;
    changeText = `${changePct > 0 ? "+" : ""}${changePct}%`;
    changeColor = isImproved ? "text-success" : "text-warn";
  } else if (changeAbs !== undefined) {
    const isImproved = isLowerBetter ? changeAbs < 0 : changeAbs > 0;
    changeText = `${changeAbs > 0 ? "+" : ""}${changeAbs}${unit}`;
    changeColor = isImproved ? "text-success" : "text-warn";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${changeColor}`}>{changeText}</span>
      </div>
      {/* Before 바 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-400 w-10">
          {before}
          {unit}
        </span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-300 rounded-full transition-all duration-700"
            style={{ width: `${beforeWidth}%` }}
          />
        </div>
      </div>
      {/* After 바 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-brand w-10">
          {after}
          {unit}
        </span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-700"
            style={{ width: `${afterWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
