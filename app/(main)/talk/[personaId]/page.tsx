"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Clock, Star } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Scenario {
  id: string;
  persona_id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: number;
  estimated_minutes: number;
  is_premium: boolean;
  icon_emoji: string;
  background_color: string;
}

interface PersonaDetail {
  id: string;
  name: string;
  icon_emoji: string;
  language: string;
  age: number | null;
  job: string | null;
  scenarios: Scenario[];
}

export default function ScenarioSelectPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.personaId as string;
  const [persona, setPersona] = useState<PersonaDetail | null>(null);

  useEffect(() => {
    apiFetch<PersonaDetail>(`/api/v1/personas/${personaId}`).then(setPersona);
  }, [personaId]);

  if (!persona) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 pt-4 pb-4">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-500 mb-4 w-fit"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">뒤로</span>
      </button>

      {/* Mini persona info */}
      <div className="flex items-center gap-3 mb-6 bg-gray-50 rounded-xl p-3">
        <span className="text-3xl">{persona.icon_emoji}</span>
        <div>
          <p className="font-semibold text-gray-900">{persona.name}</p>
          {persona.age && persona.job && (
            <p className="text-xs text-gray-500">
              {persona.age}세 &middot; {persona.job}
            </p>
          )}
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">
        시나리오를 선택하세요
      </h2>

      {/* Scenario cards */}
      <div className="flex flex-col gap-3">
        {persona.scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => {
              if (!scenario.is_premium) {
                router.push(`/talk/${personaId}/${scenario.id}`);
              }
            }}
            disabled={scenario.is_premium}
            className={`relative text-left p-4 rounded-xl border transition-all ${
              scenario.is_premium
                ? "border-gray-200 opacity-60 cursor-not-allowed"
                : "border-gray-100 hover:border-brand hover:shadow-md active:scale-[0.98]"
            }`}
            style={{
              backgroundColor: scenario.is_premium
                ? "#F9FAFB"
                : scenario.background_color,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{scenario.icon_emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {scenario.title}
                  </h3>
                  {scenario.is_premium && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-brand bg-brand-subtle rounded-full">
                      <Lock size={10} /> PRO
                    </span>
                  )}
                </div>
                {scenario.description && (
                  <p className="text-xs text-gray-500 mb-2">
                    {scenario.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < scenario.difficulty
                            ? "fill-warn text-warn"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock size={12} />
                    {scenario.estimated_minutes}분
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
