"use client";

import type { NewExpressionItem } from "@/types/report";

export default function NewExpressionCard({
  item,
}: {
  item: NewExpressionItem;
}) {
  return (
    <div className="bg-success/5 rounded-xl p-4 border border-success/20">
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0">&#11088;</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {item.expression}
          </p>
          <p className="text-xs text-gray-700 mt-1">{item.meaning_ko}</p>
          <p className="text-xs text-gray-400 mt-1 italic">{item.context}</p>
        </div>
      </div>
    </div>
  );
}
