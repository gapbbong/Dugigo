"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Users,
  Award
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [tier, setTier] = useState(1); // 1~7
  const [temp, setTemp] = useState(36.5);
  const [userName, setUserName] = useState("학습자");

  // 티어 정보 정의
  const tiers = [
    { name: "새싹", emoji: "🌱", color: "from-green-400 to-emerald-500", goal: 5 },
    { name: "줄기", emoji: "🌿", color: "from-emerald-500 to-teal-500", goal: 15 },
    { name: "잎새", emoji: "🍃", color: "from-teal-500 to-cyan-500", goal: 30 },
    { name: "꽃", emoji: "🌸", color: "from-cyan-500 to-blue-500", goal: 50 },
    { name: "열매", emoji: "🍎", color: "from-blue-500 to-indigo-500", goal: 75 },
    { name: "나무", emoji: "🌳", color: "from-indigo-500 to-violet-500", goal: 100 },
    { name: "숲", emoji: "🌲", color: "from-violet-500 to-purple-600", goal: 150 },
  ];

  return (
    <div className="relative min-h-screen flex flex-col text-slate-800">
      {/* 🌈 배경 메쉬 그라데이션 */}
      <div className="mesh-bg" />

      {/* 🧭 상단 네비게이션 */}
      <nav className="sticky top-0 z-50 px-8 py-4 glass-card border-none bg-white/40 backdrop-blur-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center text-white shadow-lg">
            <span className="font-bold text-xs">DG</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">DugiGo v2</h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <span className="flex items-center gap-1.5"><Users size={16}/> 커뮤니티</span>
          <span className="flex items-center gap-1.5"><Award size={16}/> 챌린지</span>
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-white shadow-sm overflow-hidden">
              <span className="text-xs">👤</span>
            </div>
            <span className="text-slate-900 font-semibold">{userName}님</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-10 space-y-12">
        {/* 👋 인사말 섹션 */}
        <header className="space-y-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-slate-900 tracking-tight"
          >
            오늘도 합격을 향해 <span className="text-gradient">한 걸음 더!</span>
          </motion.h2>
          <p className="text-slate-500 text-lg font-medium">지금까지 총 12번의 모의고사를 합격하셨네요. 대단합니다!</p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          
          {/* 🎋 7단계 티어 대시보드 */}
          <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-8 space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-500">My Evolution</span>
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    현재 티어: {tiers[tier-1].name} {tiers[tier-1].emoji}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-400">다음 단계 숲🌳까지 3번 더 합격!</p>
                </div>
              </div>

              {/* 티어 프로그래스 로드 */}
              <div className="relative h-20 flex items-center justify-between px-4">
                <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(tier/7) * 100}%` }}
                    className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-brand-600 shadow-[0_0_15px_rgba(99,91,255,0.3)]"
                  />
                </div>
                
                {tiers.map((t, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.2 }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border-2 transition-all duration-500
                        ${idx < tier ? `bg-white border-brand-500 scale-110 shadow-brand-200` : `bg-white border-slate-100 text-slate-300`}`}
                    >
                      {t.emoji}
                    </motion.div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${idx < tier ? 'text-brand-600' : 'text-slate-300'}`}>
                      Level {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 학습 모드 선택 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/study/electricity" className="group">
                <div className="glass-card rounded-3xl p-8 h-full flex flex-col gap-4 border-l-4 border-l-brand-600">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                    <Calendar size={28} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-slate-800">연도별 기출 학습</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">2015년부터 2026년까지 최신 기출문제를 실전처럼 풀어보세요.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-brand-600 font-bold text-sm">
                    지금 시작하기 <ChevronRight size={16} />
                  </div>
                </div>
              </Link>

              <Link href="/select-subject" className="group">
                <div className="glass-card rounded-3xl p-8 h-full flex flex-col gap-4 border-l-4 border-l-emerald-500">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-slate-800">단원별 집중 마스터</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">취약한 단원만 골라 30문제씩 집중적으로 훈련하여 정복하세요.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    약점 보완하기 <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* 🌡️ 학습 온도계 및 랭킹 세션 */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-6 relative overflow-hidden">
              {/* 온도계 배경 빛 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 blur-[60px] opacity-20" />
              
              <div className="w-full flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-700">학습 열기</h3>
                <div className="flex items-center gap-1 text-orange-500 font-bold">
                  <Flame size={18} fill="currentColor" /> {temp}°C
                </div>
              </div>

              {/* 온도계 비주얼 */}
              <div className="relative w-10 h-64 bg-slate-100 rounded-full border-4 border-white shadow-inner overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(temp/100) * 100}%` }}
                  className="absolute bottom-0 w-full bg-gradient-to-t from-red-500 via-orange-400 to-yellow-300 shadow-[0_0_20px_rgba(249,115,22,0.5)] rounded-full"
                />
                {/* 눈금 */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-slate-300 opacity-30" style={{ bottom: `${(i+1)*20}%` }} />
                ))}
              </div>
              
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                36.5°C 기본 체온에서 시작합니다.<br/>
                정답 시 +2°C, 오답 시 -1°C 변화합니다.
              </p>
            </div>

            {/* 리더보드 맛보기 */}
            <div className="glass-card rounded-3xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Leaderboard</h3>
                <span className="text-xs font-bold text-brand-600 cursor-pointer">전체보기</span>
              </div>
              <div className="space-y-4">
                {[
                  { name: "전기짱", score: "88.5°C", rank: 1, icon: "🥇" },
                  { name: "회전수", score: "82.1°C", rank: 2, icon: "🥈" },
                  { name: "옴의전설", score: "79.4°C", rank: 3, icon: "🥉" },
                ].map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{u.icon}</span>
                      <span className="text-sm font-semibold text-slate-700">{u.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-500">{u.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* 底部 푸터 */}
      <footer className="py-10 text-center text-slate-400 text-xs">
        <p>© 2026 DugiGo v2 Premium. All rights reserved.</p>
        <p className="mt-1">Designed with Stripe Aesthetics.</p>
      </footer>
    </div>
  );
}
