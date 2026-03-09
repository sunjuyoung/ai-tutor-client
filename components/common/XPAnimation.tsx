"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * XP 획득 애니메이션 컴포넌트
 *
 * 대화 종료 시 획득한 XP를 카운트업 애니메이션으로 표시.
 * 반짝이 파티클 CSS 효과 포함.
 */

interface XPAnimationProps {
  /** 획득한 XP */
  earnedXP: number;
  /** 누적 XP */
  totalXP: number;
  /** 현재 레벨 */
  level: number;
  /** 애니메이션 완료 콜백 */
  onComplete?: () => void;
}

export default function XPAnimation({
  earnedXP,
  totalXP,
  level,
  onComplete,
}: XPAnimationProps) {
  const [displayXP, setDisplayXP] = useState(0);

  // 카운트업 애니메이션
  useEffect(() => {
    const duration = 1500; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic 이징
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.round(earnedXP * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        // 애니메이션 완료 후 1초 대기 → 콜백
        setTimeout(onComplete, 1000);
      }
    };

    requestAnimationFrame(animate);
  }, [earnedXP, onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center gap-3 py-4"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 12, stiffness: 200 }}
    >
      {/* XP 아이콘 + 숫자 */}
      <div className="relative">
        {/* 반짝이 파티클 효과 */}
        <div className="absolute -inset-4 flex items-center justify-center pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-warn rounded-full"
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: Math.cos((i / 6) * Math.PI * 2) * 40,
                y: Math.sin((i / 6) * Math.PI * 2) * 40,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <motion.span
          className="text-4xl font-bold text-brand"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          +{displayXP} XP
        </motion.span>
      </div>

      {/* 총 XP / 레벨 */}
      <p className="text-sm text-gray-400">
        총 {totalXP.toLocaleString()} XP &middot; Lv.{level}
      </p>
    </motion.div>
  );
}
