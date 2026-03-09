"use client";

import { useEffect, useState } from "react";

function getScoreColor(score: number): string {
  if (score >= 80) return "#00B894"; // success
  if (score >= 50) return "#6C5CE7"; // brand
  if (score >= 30) return "#F39C12"; // warn
  return "#E17055"; // error
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent!";
  if (score >= 80) return "Great!";
  if (score >= 60) return "Good";
  if (score >= 40) return "Keep Going";
  return "Practice More";
}

export default function FluencyGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 160 160"
        >
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#F4F4F8"
            strokeWidth="12"
          />
          {/* Score arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {animatedScore}
          </span>
          <span className="text-xs text-gray-400 mt-1">/ 100</span>
        </div>
      </div>
      <span
        className="text-sm font-semibold"
        style={{ color }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  );
}
