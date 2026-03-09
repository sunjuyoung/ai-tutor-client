"use client";

/**
 * 시나리오별 유창성 점수 바 — 수평 프로그레스 바
 *
 * UIUX.md 5.6절: 시나리오별 최고 유창성 점수를 바 형태로 표시.
 * 점수에 따라 색상 변경 (80+: 성공 초록, 50+: 브랜드 보라, 그 외: 주황)
 */

interface Props {
  emoji: string;
  title: string;
  score: number | null;
}

export default function ScenarioScoreBar({ emoji, title, score }: Props) {
  // 점수에 따른 색상 결정
  const getBarColor = (s: number) => {
    if (s >= 80) return "bg-success";
    if (s >= 50) return "bg-brand";
    return "bg-warn";
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      {/* 시나리오 이모지 + 제목 */}
      <span className="text-lg">{emoji}</span>
      <span className="text-sm text-gray-700 w-24 truncate">{title}</span>

      {/* 점수 바 */}
      {score !== null ? (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getBarColor(score)}`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-10 text-right">
            {score}점
          </span>
        </div>
      ) : (
        /* 아직 점수 없음 */
        <span className="text-xs text-gray-300 flex-1">--</span>
      )}
    </div>
  );
}
