"use client";

import type { CorrectionItem } from "@/types/report";

const TYPE_LABELS: Record<string, string> = {
  grammar: "문법",
  vocabulary: "어휘",
  expression: "표현",
};

const TYPE_COLORS: Record<string, string> = {
  grammar: "bg-warn/10 text-warn",
  vocabulary: "bg-info/10 text-info",
  expression: "bg-brand-subtle text-brand",
};

export default function CorrectionCard({ item }: { item: CorrectionItem }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-warn p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <p className="text-sm text-gray-400 line-through">{item.original}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {item.corrected}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            TYPE_COLORS[item.error_type] || "bg-gray-100 text-gray-400"
          }`}
        >
          {TYPE_LABELS[item.error_type] || item.error_type}
        </span>
      </div>
      <p className="text-xs text-gray-700 mt-2 leading-relaxed">
        {item.explanation}
      </p>
    </div>
  );
}
