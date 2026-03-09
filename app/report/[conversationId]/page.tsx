"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { CorrectionReport } from "@/types/report";
import FluencyGauge from "@/components/report/FluencyGauge";
import CorrectionCard from "@/components/report/CorrectionCard";
import NewExpressionCard from "@/components/report/NewExpressionCard";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [report, setReport] = useState<CorrectionReport | null>(null);
  const [status, setStatus] = useState<"loading" | "processing" | "completed" | "failed">("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const data = await apiFetch<CorrectionReport>(
        `/api/v1/reports/${conversationId}`
      );
      setReport(data);
      setStatus("completed");
      // Stop polling
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("202") || message.includes("still being generated")) {
        setStatus("processing");
      } else if (message.includes("404")) {
        setStatus("processing"); // Not created yet, keep polling
      } else {
        setStatus("failed");
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    }
  }, [conversationId]);

  useEffect(() => {
    fetchReport();
    pollRef.current = setInterval(fetchReport, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchReport]);

  if (status === "loading" || status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 px-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        </div>
        <p className="text-lg font-semibold text-gray-900">
          리포트 생성 중...
        </p>
        <p className="text-sm text-gray-400 text-center">
          AI가 대화를 분석하고 있어요.
          <br />
          잠시만 기다려 주세요 (약 10~30초)
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 px-6">
        <span className="text-4xl">😞</span>
        <p className="text-lg font-semibold text-gray-900">
          리포트 생성에 실패했어요
        </p>
        <p className="text-sm text-gray-400">
          다시 시도해 주세요.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="mt-4 px-6 py-3 bg-brand text-white rounded-full font-medium"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!report) return null;

  const corrections = report.corrections || [];
  const expressions = report.new_expressions || [];

  return (
    <div className="min-h-dvh bg-gray-100 pb-8">
      {/* Header */}
      <header className="bg-white px-5 pt-12 pb-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">대화 리포트</h1>
        <p className="text-sm text-gray-400 mt-1">
          {report.completed_at
            ? new Date(report.completed_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </p>
      </header>

      <div className="px-5 mt-6 flex flex-col gap-6 max-w-lg mx-auto">
        {/* Fluency score */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
            유창성 점수
          </h2>
          <FluencyGauge score={report.fluency_score || 50} />
          {report.summary && (
            <p className="text-sm text-gray-700 text-center mt-4 leading-relaxed">
              {report.summary}
            </p>
          )}
        </section>

        {/* Corrections */}
        {corrections.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-warn">&#9998;</span> 교정 사항
              <span className="text-xs bg-warn/10 text-warn px-2 py-0.5 rounded-full">
                {corrections.length}개
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {corrections.map((c, i) => (
                <CorrectionCard key={i} item={c} />
              ))}
            </div>
          </section>
        )}

        {/* New expressions */}
        {expressions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-success">&#11088;</span> 잘 사용한 표현
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                {expressions.length}개
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {expressions.map((e, i) => (
                <NewExpressionCard key={i} item={e} />
              ))}
            </div>
          </section>
        )}

        {/* No corrections message */}
        {corrections.length === 0 && expressions.length === 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <span className="text-4xl">&#127881;</span>
            <p className="text-lg font-semibold text-gray-900 mt-3">
              완벽한 대화였어요!
            </p>
            <p className="text-sm text-gray-400 mt-1">
              특별한 교정 사항이 없습니다.
            </p>
          </section>
        )}

        {/* CTA */}
        <button
          onClick={() => router.push("/home")}
          className="w-full h-12 bg-brand text-white font-medium rounded-full shadow-glow hover:opacity-90 transition-opacity"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
