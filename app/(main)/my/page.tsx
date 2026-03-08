"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";

interface Conversation {
  id: string;
  persona_id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

interface Persona {
  id: string;
  name: string;
  icon_emoji: string;
}

export default function MyPage() {
  const { user, fetchUser, logout } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});

  useEffect(() => {
    fetchUser();
    loadHistory();
  }, [fetchUser]);

  async function loadHistory() {
    try {
      const convs = await apiFetch<Conversation[]>(
        "/api/v1/conversations?limit=10"
      );
      setConversations(convs);

      if (convs.length > 0) {
        const personaList = await apiFetch<Persona[]>("/api/v1/personas");
        const map: Record<string, Persona> = {};
        personaList.forEach((p) => (map[p.id] = p));
        setPersonas(map);
      }
    } catch {
      // Not logged in
    }
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>

      {/* Profile card */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <p className="text-lg font-semibold text-gray-900">
          {user?.nickname || "사용자"}
        </p>
        <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <span>
            {user?.target_language === "en"
              ? "🇺🇸 영어"
              : user?.target_language === "ja"
              ? "🇯🇵 일본어"
              : "-"}
          </span>
          <span>Lv.{user?.level || 1}</span>
          <span>{user?.xp || 0} XP</span>
          <span>{user?.streak_days || 0}일 연속</span>
        </div>
        <div className="mt-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              user?.plan_type === "PRO"
                ? "bg-brand-subtle text-brand"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {user?.plan_type || "FREE"}
          </span>
        </div>
      </div>

      {/* Conversation history */}
      {conversations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            대화 히스토리
          </h2>
          <div className="flex flex-col gap-2">
            {conversations.map((conv) => {
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
                      {new Date(conv.started_at).toLocaleDateString("ko-KR")} &middot;{" "}
                      {conv.message_count}개 메시지
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.ended_at
                        ? "bg-gray-100 text-gray-400"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {conv.ended_at ? "완료" : "진행중"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <button
        onClick={handleLogout}
        className="w-full h-12 border border-error text-error font-medium rounded-full hover:bg-error/5 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
