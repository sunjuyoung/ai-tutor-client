"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

/**
 * 힌트 바텀시트 — 대화 중 맥락 기반 표현 추천
 *
 * UIUX 스펙:
 * - 드래그 핸들이 있는 슬라이드업 바텀시트
 * - 추천 표현 + 발음(로마자) + 한국어 뜻
 * - "이 표현 사용하기" 버튼 → 입력란에 자동 삽입
 * - XP 50% 감소 경고 캡션
 */

interface HintData {
  expression: string;
  pronunciation: string;
  meaning_ko: string;
}

interface HintBottomSheetProps {
  /** 현재 대화 ID */
  conversationId: string;
  /** 바텀시트 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** "이 표현 사용하기" 클릭 시 → 입력란에 텍스트 삽입 */
  onUseExpression: (text: string) => void;
}

export default function HintBottomSheet({
  conversationId,
  isOpen,
  onClose,
  onUseExpression,
}: HintBottomSheetProps) {
  const [hint, setHint] = useState<HintData | null>(null);
  const [loading, setLoading] = useState(false);

  // 바텀시트가 열릴 때 힌트 요청
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    async function fetchHint() {
      setLoading(true);
      setHint(null);
      try {
        const data = await apiFetch<HintData>(
          `/api/v1/hints/${conversationId}`,
          { method: "POST" }
        );
        setHint(data);
      } catch (err) {
        console.error("힌트 로딩 실패:", err);
        // 실패 시 기본 메시지 표시
        setHint({
          expression: "Could you repeat that?",
          pronunciation: "Could you repeat that?",
          meaning_ko: "다시 말해 줄 수 있어요?",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchHint();
  }, [isOpen, conversationId]);

  const handleUse = () => {
    if (hint) {
      onUseExpression(hint.expression);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 바텀시트 본체 */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={20} className="text-warn" />
                <span className="text-lg font-semibold text-gray-900">
                  표현 힌트
                </span>
              </div>
              <button onClick={onClose} className="text-gray-400 p-1">
                <X size={18} />
              </button>
            </div>

            {/* 힌트 컨텐츠 */}
            <div className="px-5 pb-6">
              {loading ? (
                // 로딩 스켈레톤
                <div className="flex flex-col gap-3 animate-pulse">
                  <div className="h-6 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              ) : hint ? (
                <div className="flex flex-col gap-3">
                  {/* 추천 표현 */}
                  <div className="bg-brand-subtle rounded-xl p-4">
                    <p className="text-lg font-semibold text-brand">
                      {hint.expression}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {hint.pronunciation}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      {hint.meaning_ko}
                    </p>
                  </div>

                  {/* "이 표현 사용하기" 버튼 */}
                  <button
                    onClick={handleUse}
                    className="w-full h-12 bg-brand text-white font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    이 표현 사용하기
                  </button>

                  {/* XP 감소 경고 */}
                  <p className="text-xs text-gray-400 text-center">
                    ⚠️ 힌트 사용 시 획득 XP가 50% 감소합니다
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
