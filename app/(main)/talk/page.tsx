"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

interface Persona {
  id: string;
  name: string;
  language: string;
  is_premium: boolean;
  age: number | null;
  job: string | null;
  personality: string | null;
  speech_style: string | null;
  icon_emoji: string;
  intro_line: string | null;
}

export default function TalkPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    apiFetch<Persona[]>("/api/v1/personas").then(setPersonas);
  }, []);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const threshold = 80;
    if (info.offset.x > threshold && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    } else if (info.offset.x < -threshold && currentIndex < personas.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  };

  if (!personas.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const persona = personas[currentIndex];
  const langFlag = persona.language === "en" ? "🇺🇸" : "🇯🇵";

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">대화 상대 선택</h1>
      <p className="text-sm text-gray-400 mb-8">스와이프하여 선택하세요</p>

      <div className="relative w-full max-w-sm h-[420px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={persona.id}
            custom={direction}
            initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center cursor-grab active:cursor-grabbing"
          >
            <div className="text-6xl mb-4">{persona.icon_emoji}</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-gray-900">
                {persona.name}
              </span>
              <span className="text-lg">{langFlag}</span>
            </div>
            {persona.age && persona.job && (
              <p className="text-sm text-gray-500 mb-3">
                {persona.age}세 &middot; {persona.job}
              </p>
            )}
            {persona.personality && (
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {persona.personality.split(",").map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-full bg-brand-subtle text-brand font-medium"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            {persona.intro_line && (
              <p className="text-sm text-gray-600 text-center italic bg-gray-50 rounded-xl px-4 py-3 mt-auto">
                &ldquo;{persona.intro_line}&rdquo;
              </p>
            )}
            {persona.is_premium && (
              <span className="absolute top-4 right-4 px-2 py-0.5 text-xs font-bold text-white bg-brand rounded-full">
                PRO
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page indicator */}
      <div className="flex gap-2 mt-6 mb-6">
        {personas.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentIndex ? "bg-brand" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => router.push(`/talk/${persona.id}`)}
        className="w-full max-w-sm h-12 rounded-xl bg-brand text-white font-semibold text-base hover:bg-brand/90 transition-colors"
      >
        대화하기
      </button>
    </div>
  );
}
