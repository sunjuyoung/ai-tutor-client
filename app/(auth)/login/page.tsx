"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuthStore();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <div className="bg-white rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-lg)]">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          SpeakTutor
        </h1>
        <p className="text-sm text-center text-gray-400 mb-8">
          AI와 함께하는 언어 학습
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 px-4 bg-gray-100 rounded-[var(--radius-md)] text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 px-4 bg-gray-100 rounded-[var(--radius-md)] text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand"
          />

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 bg-brand text-white font-semibold rounded-full hover:bg-brand-light transition-colors disabled:opacity-50"
          >
            {loading ? "..." : isSignup ? "회원가입" : "로그인"}
          </button>
        </form>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-4 text-sm text-gray-400 hover:text-brand transition-colors"
        >
          {isSignup
            ? "이미 계정이 있나요? 로그인"
            : "계정이 없나요? 회원가입"}
        </button>
      </div>
    </div>
  );
}
