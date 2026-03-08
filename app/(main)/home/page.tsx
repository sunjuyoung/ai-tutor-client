"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";

interface Conversation {
  id: string;
  persona_id: string;
  scenario_id: string;
  started_at: string;
  message_count: number;
}

interface Persona {
  id: string;
  name: string;
  icon_emoji: string;
}

export default function HomePage() {
  const { user, fetchUser } = useAuthStore();
  const [recentConvs, setRecentConvs] = useState<Conversation[]>([]);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});

  useEffect(() => {
    fetchUser();
    loadRecent();
  }, [fetchUser]);

  async function loadRecent() {
    try {
      const convs = await apiFetch<Conversation[]>(
        "/api/v1/conversations?limit=3"
      );
      setRecentConvs(convs);

      if (convs.length > 0) {
        const personaList = await apiFetch<Persona[]>("/api/v1/personas");
        const map: Record<string, Persona> = {};
        personaList.forEach((p) => (map[p.id] = p));
        setPersonas(map);
      }
    } catch {
      // Not logged in or no conversations yet
    }
  }

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        안녕, {user?.nickname || "학습자"}!
      </h1>
      <p className="text-sm text-gray-400 mb-8">오늘도 함께 연습해볼까요?</p>

      <Link
        href="/talk"
        className="flex items-center justify-center w-full h-12 bg-brand text-white font-semibold rounded-full hover:bg-brand/90 transition-colors mb-8"
      >
        대화 시작하기
      </Link>

      {/* Stats bar */}
      <div className="flex justify-around bg-gray-50 rounded-xl p-4 mb-8">
        <div className="text-center">
          <p className="text-lg font-bold text-brand">{user?.streak_days || 0}</p>
          <p className="text-xs text-gray-400">연속 일수</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-brand">{user?.xp || 0}</p>
          <p className="text-xs text-gray-400">XP</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-brand">Lv.{user?.level || 1}</p>
          <p className="text-xs text-gray-400">레벨</p>
        </div>
      </div>

      {/* Recent conversations */}
      {recentConvs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            최근 대화
          </h2>
          <div className="flex flex-col gap-2">
            {recentConvs.map((conv) => {
              const persona = personas[conv.persona_id];
              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
                >
                  <span className="text-2xl">
                    {persona?.icon_emoji || "💬"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {persona?.name || "대화"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(conv.started_at).toLocaleDateString("ko-KR")} &middot; {conv.message_count}개 메시지
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommended scenarios (static) */}
      {recentConvs.length === 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            추천 시나리오
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "☕", title: "카페 주문", tier: "Free" },
              { emoji: "🍺", title: "이자카야", tier: "Free" },
              { emoji: "💼", title: "면접 연습", tier: "PRO" },
            ].map((s) => (
              <Link
                key={s.title}
                href="/talk"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-sm font-medium text-gray-900">
                  {s.title}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    s.tier === "PRO"
                      ? "bg-warn/10 text-warn"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {s.tier}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
