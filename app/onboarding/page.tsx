"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

const STEPS = [
  {
    title: "어떤 언어를 배우고 싶나요?",
    options: [
      { value: "en", label: "영어", emoji: "🇺🇸" },
      { value: "ja", label: "일본어", emoji: "🇯🇵" },
    ],
    key: "target_language",
  },
  {
    title: "학습 목적은?",
    options: [
      { value: "travel", label: "여행", emoji: "✈️" },
      { value: "work", label: "취업", emoji: "💼" },
      { value: "daily", label: "일상", emoji: "☕" },
      { value: "exam", label: "시험", emoji: "📝" },
    ],
    key: "learning_purpose",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelect = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/v1/users/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ ...data, nickname }),
      });
      router.push("/home");
    } catch {
      setLoading(false);
    }
  };

  const isNicknameStep = step === STEPS.length;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      {/* Progress */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full transition-colors ${
              i <= step ? "bg-brand" : "bg-gray-100"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!isNicknameStep ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              {STEPS[step].title}
            </h1>
            <div
              className={`grid gap-4 ${
                STEPS[step].options.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2"
              }`}
            >
              {STEPS[step].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(STEPS[step].key, opt.value)}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-100 rounded-[var(--radius-md)] hover:bg-brand-subtle hover:ring-2 hover:ring-brand transition-all"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="nickname"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              편한 이름을 알려주세요
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              페르소나가 이 이름으로 불러줄게요
            </p>
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full h-12 px-4 bg-gray-100 rounded-[var(--radius-md)] text-center text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand mb-6"
            />
            <button
              onClick={handleComplete}
              disabled={!nickname.trim() || loading}
              className="w-full h-12 bg-brand text-white font-semibold rounded-full hover:bg-brand-light transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "시작하기"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {step > 0 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="mt-6 text-sm text-gray-400 hover:text-gray-700"
        >
          이전으로
        </button>
      )}
    </div>
  );
}
