'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  ChevronRight,
  Loader2, 
  LogOut, 
  Zap, 
  Terminal, 
  ArrowUpDown,
  Palette,
  Monitor,
  History,
  Download,
  Share,
  PlusSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const getSubjectStyle = (name: string) => {
  if (name.includes('전기')) return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', hoverBg: 'group-hover:bg-amber-500' };
  if (name.includes('정보처리')) return { icon: Terminal, color: 'text-emerald-500', bg: 'bg-emerald-50', hoverBg: 'group-hover:bg-emerald-500' };
  if (name.includes('승강기')) return { icon: ArrowUpDown, color: 'text-violet-500', bg: 'bg-violet-50', hoverBg: 'group-hover:bg-violet-500' };
  if (name.includes('디자인')) return { icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50', hoverBg: 'group-hover:bg-pink-500' };
  if (name.includes('컴퓨터') || name.includes('컴활')) return { icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50', hoverBg: 'group-hover:bg-blue-500' };
  if (name.includes('한국사')) return { icon: History, color: 'text-rose-500', bg: 'bg-rose-50', hoverBg: 'group-hover:bg-rose-500' };
  return { icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50', hoverBg: 'group-hover:bg-brand-600' };
};

export default function SelectSubjectPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPopup, setShowIOSPopup] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: profile } = await supabase.from('dukigo_profiles').select('role').eq('id', currentUser.id).single();
      if (profile?.role?.toLowerCase() === 'teacher' || currentUser.email === 'serv@kakao.com') setIsTeacher(true);

      const res = await fetch('/api/subjects');
      const data = await res.json();
      let fetchedSubjects = data.subjects || [];
      fetchedSubjects.sort((a: string, b: string) => {
        if (a.includes('한국사') && !b.includes('한국사')) return 1;
        if (!a.includes('한국사') && b.includes('한국사')) return -1;
        return a.localeCompare(b);
      });
      setSubjects(fetchedSubjects);
      setLoading(false);
    }
    init();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [router]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSPopup(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      // 안드로이드나 PC에서 설치 준비가 안 된 경우 (아이폰 안내가 아님)
      alert('브라우저 우측 상단/하단 메뉴(⋮)에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해 주세요!');
    }
  };

  const quotes = ["성공은 결과가 아니라 과정이다.", "오늘의 수고가 내일의 보석이 된다.", "노력은 결코 배신하지 않는다."];
  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 text-brand-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-slate-900 pb-20">
      <div className="mesh-bg opacity-40" />
      
      {/* Header Area */}
      <header className="max-w-7xl mx-auto pt-10 px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <GraduationCap size={24} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">DugiGo</h2>
          </div>

          {/* School Name (Centered on PC, Big Size) */}
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
            <span className="text-[14px] md:text-4xl font-black text-brand-600 tracking-tighter whitespace-nowrap">
              경성전자고등학교
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-4 md:gap-8">
            {isTeacher && (
              <Link 
                href="/teacher" 
                className="text-[10px] md:text-lg px-3 py-1.5 md:px-8 md:py-4 bg-brand-600 text-white font-black rounded-xl md:rounded-2xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
              >
                Dashboard
              </Link>
            )}
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
              className="text-[10px] md:text-lg text-slate-400 hover:text-rose-500 font-black transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Slogan & Install Row */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-6">
          <p className="text-[10px] md:text-sm font-bold text-slate-500 whitespace-nowrap flex-shrink overflow-hidden text-ellipsis uppercase tracking-tight">
            <span className="text-blue-500">두</span>꺼운 <span className="text-emerald-500">기</span>능사 책 대신 <span className="text-rose-500">고</span>민말고 <span className="font-black">두기고</span>
          </p>
          {!isInstalled && (
            <motion.button 
              onClick={handleInstall} 
              className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-white/60 text-slate-600 rounded-full border-2 border-slate-200 shadow-sm flex-shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <PlusSquare size={16} className="text-brand-500" />
              <span className="text-[10px] md:text-xs font-black tracking-tight whitespace-nowrap">홈 화면 추가</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* PC Install Button (Floating) */}
      {!isInstalled && !isIOS && deferredPrompt && (
        <div className="hidden lg:block fixed left-10 top-1/2 -translate-y-1/2 z-50">
          <motion.button onClick={handleInstall} className="flex flex-col items-center gap-4 p-6 bg-white/80 border-2 border-slate-200 rounded-[2.5rem] shadow-xl group transition-all hover:border-brand-300">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all"><Download size={28} /></div>
            <span className="text-xs font-black text-slate-400 group-hover:text-brand-600 uppercase text-center tracking-widest">설치</span>
          </motion.button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 pt-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-6xl font-black text-slate-900 italic mb-4 leading-tight tracking-tighter">"{randomQuote}"</h1>
          <p className="text-base md:text-2xl font-bold text-slate-500 italic">환영합니다, <span className="text-brand-600 font-black">{user?.email?.split('@')[0]}</span>님! 👋</p>
        </div>

        {/* Subject Grid - Larger Height for PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {subjects.map((subject, index) => {
            const style = getSubjectStyle(subject);
            const Icon = style.icon;
            return (
              <motion.div 
                key={subject} 
                onClick={() => router.push(`/select-unit/${encodeURIComponent(subject)}`)} 
                className="group glass-card px-6 py-6 md:px-10 md:py-12 rounded-[2rem] md:rounded-[3rem] cursor-pointer relative overflow-hidden flex items-center gap-4 md:gap-8 hover:shadow-2xl transition-all border border-white/60 active:scale-[0.98]"
                whileHover={{ y: -5 }}
              >
                <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center flex-shrink-0 transition-all ${style.bg} ${style.color} group-hover:bg-brand-600 group-hover:text-white shadow-inner`}>
                  <Icon size={32} />
                </div>
                <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                  <span className="text-slate-900 font-black italic text-xl md:text-3xl opacity-100">{index + 1}.</span>
                  <h3 className="text-lg md:text-3xl font-black text-slate-900 truncate tracking-tight">{subject}</h3>
                </div>
                <ChevronRight className="ml-auto text-slate-200 group-hover:text-brand-400 group-hover:translate-x-2 transition-all" size={28} />
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-16 text-slate-400 text-sm font-medium border-t border-slate-100 mt-20">
        <p>© 2026 DugiGo Smart License Solution.</p>
        <p className="font-black uppercase tracking-widest text-slate-500 mt-2 text-base">경성전자고등학교 전용 학습 서비스</p>
      </footer>

      {/* iOS Popup */}
      <AnimatePresence>
        {showIOSPopup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIOSPopup(false)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[3rem] p-10 shadow-2xl flex flex-col items-center text-center gap-8 text-slate-900 border-t border-brand-100">
              <div className="w-16 h-2 bg-slate-100 rounded-full" />
              <div className="w-20 h-20 bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-600 shadow-inner"><PlusSquare size={40} /></div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black">홈 화면에 추가</h3>
                <p className="text-lg text-slate-500 font-bold leading-relaxed px-4">
                  사파리 브라우저 하단의 <Share size={20} className="inline align-text-bottom mx-1" /> 공유 버튼을 누른 뒤,<br/>
                  <PlusSquare size={20} className="inline align-text-bottom mx-1" /> 홈 화면에 추가를 선택해 주세요!
                </p>
              </div>
              <button onClick={() => setShowIOSPopup(false)} className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-colors text-lg">알겠습니다</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
