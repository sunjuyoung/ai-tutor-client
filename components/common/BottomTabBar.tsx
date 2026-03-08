"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, BarChart3, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/talk", label: "대화", icon: MessageCircle },
  { href: "/growth", label: "성장", icon: BarChart3 },
  { href: "/my", label: "마이", icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              isActive ? "text-brand" : "text-gray-400"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[11px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
