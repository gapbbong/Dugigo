'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, ChevronRight, Loader2, Sparkles, LogOut, LayoutDashboard, Zap, Terminal, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const getSubjectStyle = (name: string) => {
  if (name.includes('전기')) {
    return {
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      hoverBg: 'group-hover:bg-amber-500',
      hoverText: 'group-hover:text-amber-600',
      glow: 'bg-amber-500/5 group-hover:bg-amber-500/10'
    };
  }
  if (name.includes('정보처리')) {
    return {
      icon: Terminal,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      hoverBg: 'group-hover:bg-emerald-500',
      hoverText: 'group-hover:text-emerald-600',
      glow: 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
    };
  }
  if (name.includes('승강기')) {
    return {
      icon: ArrowUpDown,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      hoverBg: 'group-hover:bg-violet-500',
      hoverText: 'group-hover:text-violet-600',
      glow: 'bg-violet-500/5 group-hover:bg-violet-500/10'
    };
  }
  return {
    icon: BookOpen,
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    hoverBg: 'group-hover:bg-brand-600',
    hoverText: 'group-hover:text-brand-600',
    glow: 'bg-brand-500/5 group-hover:bg-brand-500/10'
  };
};

export default function SelectSubjectPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 2. Fetch user profile to check if teacher or admin
      try {
        const { data: profile } = await supabase
          .from('dukigo_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role?.toLowerCase() === 'teacher' || user.email === 'serv@kakao.com') {
          setIsTeacher(true);
        }
      } catch (e) {
        console.error('Failed to load profile role:', e);
      }

      // 3. Fetch Subjects from API
      try {
        const res = await fetch('/api/subjects');
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSelect = (subject: string) => {
    localStorage.setItem('selected_subject', subject);
    router.push(`/select-unit/${encodeURIComponent(subject)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-white">
      {/* 🌈 배경 메쉬 그라데이션 (Stripe Style) */}
      <div className="mesh-bg" />

      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-16 relative z-10 pt-12 px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            DugiGo <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full">v2.0.2</span>
            <span className="text-sm font-bold text-slate-500 ml-2 tracking-normal">
              두꺼운 기능사 책 대신 고민말고 <span className="text-rose-600 font-black text-lg ml-1">두 기 고</span>
            </span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {isTeacher && (
            <Link 
              href="/teacher"
              className="flex items-center gap-2 text-brand-600 hover:text-brand-700 hover:bg-brand-100 transition-colors px-4 py-2 rounded-xl bg-white/80 font-bold border-2 border-brand-200/50 shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" /> 대시보드 이동
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5 font-medium"
          >
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10 px-6 md:px-12">
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-slate-900"
          >
            환영합니다, <span className="text-brand-600">{user?.email?.split('@')[0]}</span>님!<br />
            공부할 <span className="text-gradient">자격증 종목</span>을 선택하세요.
          </motion.h1>
          <p className="text-slate-500 max-w-2xl text-lg font-medium">
            선택하신 종목에 따라 최신 기출문제와 오답 분석 리포트가 제공됩니다.
          </p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {subjects.length > 0 ? (
              subjects.map((subject, index) => {
                const style = getSubjectStyle(subject);
                const Icon = style.icon;
                return (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(subject)}
                    className="group glass-card p-8 rounded-[2.5rem] cursor-pointer transition-all relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] transition-colors ${style.glow}`} />
                    
                    <div className="flex flex-col h-full relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:text-white transition-all shadow-sm ${style.bg} ${style.color} ${style.hoverBg}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      
                      <h3 className={`text-2xl font-bold mb-2 text-slate-800 transition-colors tracking-tight ${style.hoverText}`}>{subject}</h3>
                      <p className="text-slate-400 mb-8 text-sm font-medium">최신 기출문제 및 오답 노트 분석 포함</p>
                      
                      <div className={`mt-auto flex items-center font-bold gap-2 text-sm ${style.color}`}>
                        학습 시작하기 <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center glass-card rounded-[2.5rem] border-dashed border-slate-200">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">아직 등록된 종목이 없습니다.<br />src/data 폴더에 폴더를 추가해 주세요.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer hint */}
      <footer className="max-w-6xl mx-auto mt-20 pb-12 text-center text-slate-400 text-sm font-medium">
        © 2026 DugiGo Smart License Solution. 관리자가 종목 폴더를 추가하면 자동으로 리스트에 반영됩니다.
      </footer>
    </div>
  );
}
