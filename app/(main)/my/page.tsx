"use client";

/**
 * 마이페이지 — 프로필, 대화 히스토리, 로그아웃
 *
 * 표시 항목:
 * - 프로필 카드: 닉네임, 이메일, 학습 언어, 레벨, XP, 스트릭, 플랜
 * - 대화 히스토리: 최근 10개 대화 (페르소나 이모지, 날짜, 메시지 수)
 *   - 완료된 대화 클릭 → 리포트 페이지 이동 (/report/{id})
 *   - 진행중 대화 클릭 → 이어하기 페이지 이동 (/talk/resume/{id})
 *   - X 버튼 → 삭제 확인 후 대화 삭제 (Hard delete)
 * - 로그아웃 버튼
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
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

  /**
   * 대화 삭제 — 확인 다이얼로그 후 서버 DELETE 호출.
   * 삭제 성공 시 로컬 state에서 즉시 제거 (재로드 불필요).
   */
  const handleDelete = async (convId: string, e: React.MouseEvent) => {
    // Link 클릭 전파 방지 (삭제 버튼 클릭이 네비게이션을 트리거하지 않도록)
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm("이 대화를 삭제하시겠습니까? 메시지와 리포트가 모두 삭제됩니다.");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/v1/conversations/${convId}`, { method: "DELETE" });
      // 삭제 성공 → 로컬 state에서 제거
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>

      {/* ─── 프로필 카드 ─── */}
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

      {/* ─── 대화 히스토리 ─── */}
      {conversations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            대화 히스토리
          </h2>
          <div className="flex flex-col gap-2">
            {conversations.map((conv) => {
              const persona = personas[conv.persona_id];

              // 공통 컨텐츠 — Link 내부 렌더링 (아바타 + 이름 + 날짜 + 상태)
              const content = (
                <>
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
                </>
              );

              const sharedClass =
                "flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand/30 transition-colors";

              return (
                <div key={conv.id} className="relative group">
                  {/* 대화 카드 — 완료: 리포트, 진행중: 이어하기 */}
                  <Link
                    href={
                      conv.ended_at
                        ? `/report/${conv.id}`       /* 완료 → 리포트 */
                        : `/talk/resume/${conv.id}`   /* 진행중 → 이어하기 */
                    }
                    className={`${sharedClass} pr-10`}
                  >
                    {content}
                  </Link>

                  {/* 삭제 X 버튼 — hover 시 표시 */}
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="대화 삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 로그아웃 ─── */}
      <button
        onClick={handleLogout}
        className="w-full h-12 border border-error text-error font-medium rounded-full hover:bg-error/5 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
