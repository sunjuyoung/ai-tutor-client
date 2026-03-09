"use client";

import { motion, AnimatePresence } from "framer-motion";

/**
 * 레벨업 축하 모달
 *
 * 대화 종료 시 레벨업이 발생하면 표시.
 * 새 레벨 숫자 + 격려 메시지 + 닫기 버튼.
 */

interface LevelUpModalProps {
  /** 도달한 새 레벨 */
  newLevel: number;
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
}

// 레벨별 격려 메시지 (한국어)
const LEVEL_MESSAGES: Record<number, string> = {
  2: "첫 번째 레벨업! 좋은 시작이에요! 🎉",
  3: "점점 실력이 늘고 있어요! 💪",
  4: "꾸준히 하고 있네요! 대단해요! 🌟",
  5: "중급 학습자가 되었어요! 🏅",
  6: "절반을 넘었어요! 멋져요! 🔥",
  7: "고급 학습자로 성장하고 있어요! 🚀",
  8: "정말 대단한 실력이에요! ⭐",
  9: "거의 마스터 수준이에요! 👑",
  10: "최고 레벨 달성! 축하합니다! 🏆",
};

export default function LevelUpModal({
  newLevel,
  isOpen,
  onClose,
}: LevelUpModalProps) {
  const message = LEVEL_MESSAGES[newLevel] || `레벨 ${newLevel} 달성! 축하합니다! 🎉`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 모달 본체 */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
            >
              {/* 레벨 뱃지 — 큰 원형 */}
              <motion.div
                className="w-24 h-24 mx-auto mb-4 bg-brand/10 rounded-full flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 0 0px rgba(108, 92, 231, 0.2)",
                    "0 0 0 20px rgba(108, 92, 231, 0)",
                    "0 0 0 0px rgba(108, 92, 231, 0)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: 2 }}
              >
                <span className="text-3xl font-bold text-brand">
                  Lv.{newLevel}
                </span>
              </motion.div>

              {/* 축하 제목 */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                레벨 업!
              </h2>

              {/* 격려 메시지 */}
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                {message}
              </p>

              {/* 확인 버튼 */}
              <button
                onClick={onClose}
                className="w-full h-12 bg-brand text-white font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                계속하기
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
