"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/extract");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium animate-pulse">시스템 접속 중...</p>
      </div>
    </div>
  );
}
