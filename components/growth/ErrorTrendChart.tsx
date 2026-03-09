"use client";

/**
 * 문법 오류 추이 라인 차트 — Recharts 기반
 *
 * UIUX.md 5.6절: 주별 문법 오류 수 추이를 라인 차트로 표시.
 * 오류가 줄어드는 추세를 시각적으로 확인할 수 있다.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ErrorTrendData {
  week_label: string;
  week_start: string;
  error_count: number;
}

interface Props {
  data: ErrorTrendData[];
}

export default function ErrorTrendChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
      >
        {/* 배경 그리드 — 수평선만 */}
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F8" />

        {/* X축: 주 라벨 */}
        <XAxis
          dataKey="week_label"
          tick={{ fontSize: 12, fill: "#9B9BB5" }}
          axisLine={false}
          tickLine={false}
        />

        {/* Y축: 오류 수 */}
        <YAxis
          tick={{ fontSize: 12, fill: "#9B9BB5" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />

        {/* 툴팁 */}
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #EDE9FE",
            fontSize: "12px",
          }}
          formatter={(value) => [`${value}개`, "오류 수"]}
          labelFormatter={(label) => `${label}`}
        />

        {/* 라인: Brand Purple 색상 + 점 강조 */}
        <Line
          type="monotone"
          dataKey="error_count"
          stroke="#6C5CE7"
          strokeWidth={2}
          dot={{ fill: "#6C5CE7", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#6C5CE7" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
