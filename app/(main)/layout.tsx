"use client";

import { usePathname } from "next/navigation";
import BottomTabBar from "@/components/common/BottomTabBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());

  // Hide bottom tab during active conversation
  const isInChat = /\/talk\/[^/]+\/[^/]+$/.test(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-dvh flex flex-col bg-white">
        <main className={`flex-1 ${isInChat ? "" : "pb-14"}`}>{children}</main>
        {!isInChat && <BottomTabBar />}
      </div>
    </QueryClientProvider>
  );
}
