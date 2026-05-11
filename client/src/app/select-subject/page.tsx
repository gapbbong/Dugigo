'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  LogOut, 
  LayoutDashboard, 
  Zap, 
  Terminal, 
  ArrowUpDown,
  Palette,
  Monitor,
  History,
  Globe,
  Settings,
  Download,
  Share,
  PlusSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const getSubjectStyle = (name: string) => {
  if (name.includes('전기')) return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', hoverBg: 'group-hover:bg-amber-500', glow: 'bg-amber-500/5' };
  if (name.includes('정보처리')) return { icon: Terminal, color: 'text-emerald-500', bg: 'bg-emerald-50', hoverBg: 'group-hover:bg-emerald-500', glow: 'bg-emerald-500/5' };
  if (name.includes('승강기')) return { icon: ArrowUpDown, color: 'text-violet-500', bg: 'bg-violet-50', hoverBg: 'group-hover:bg-violet-500', glow: 'bg-violet-500/5' };
  if (name.includes('디자인')) return { icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50', hoverBg: 'group-hover:bg-pink-500', glow: 'bg-pink-500/5' };
  if (name.includes('컴퓨터') || name.includes('컴활')) return { icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50', hoverBg: 'group-hover:bg-blue-500', glow: 'bg-blue-500/5' };
  if (name.includes('한국사')) return { icon: History, color: 'text-rose-500', bg: 'bg-rose-50', hoverBg: 'group-hover:bg-rose-500', glow: 'bg-rose-500/5' };
  return { icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50', hoverBg: 'group-hover:bg-brand-600', glow: 'bg-brand-500/5' };
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
    if (isIOS) setShowIOSPopup(true);
    else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); setIsInstalled(true); }
    } else { setShowIOSPopup(true); }
  };

  const quotes = ["성공은 결과가 아니라 과정이다.", "오늘의 수고가 내일의 보석이 된다.", "노력은 결코 배신하지 않는다."];
  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-white">
      <div className="mesh-bg" />
      
      <header className="max-w-6xl mx-auto pt-12 px-12 relative z-10 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg"><GraduationCap className="text-white" /></div>
            <h2 className="text-2xl font-black text-slate-900">DugiGo</h2>
            <div className="w-px h-4 bg-slate-300 mx-2" />
            <span className="text-2xl font-black text-brand-600">경성전자고등학교</span>
          </div>
          <div className="flex items-center gap-2">
            {isTeacher && <Link href="/teacher" className="px-3 py-1.5 bg-white rounded-lg text-brand-600 font-bold border-2 border-brand-100 text-sm">Dashboard</Link>}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="px-3 py-1.5 text-slate-500 font-bold text-sm">Logout</button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold text-slate-500 uppercase">
            <span className="text-blue-500">두</span>꺼운 <span className="text-emerald-500">기</span>능사 책 대신 <span className="text-rose-500">고</span>민말고 <span className="font-black">두기고</span>
          </p>
          {!isInstalled && (
            <motion.button onClick={handleInstall} className="flex items-center gap-2 px-3 py-1.5 bg-white/40 text-slate-500 rounded-full border-2 border-slate-200 shadow-sm">
              <PlusSquare size={16} />
              <span className="text-[10px] md:text-xs font-black">홈 화면에 추가</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* PC Install Button */}
      {!isInstalled && !isIOS && deferredPrompt && (
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50">
          <motion.button onClick={handleInstall} className="flex flex-col items-center gap-3 p-5 bg-white/60 border-2 border-slate-200 rounded-[2.5rem] shadow-xl group">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all"><Download size={24} /></div>
            <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-600 uppercase text-center">앱 설치</span>
          </motion.button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-12 relative z-10 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 italic mb-2">"{randomQuote}"</h1>
          <p className="text-xl md:text-2xl font-bold text-slate-500">환영합니다, <span className="text-brand-600">{user?.email?.split('@')[0]}</span>님! 👋</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject, index) => {
            const style = getSubjectStyle(subject);
            const Icon = style.icon;
            return (
              <motion.div key={subject} onClick={() => router.push(`/select-unit/${encodeURIComponent(subject)}`)} className="group glass-card p-8 rounded-[2.5rem] cursor-pointer relative overflow-hidden">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${style.bg} ${style.color} ${style.hoverBg} group-hover:text-white`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-800">{index + 1}. {subject}</h3>
                <p className="text-slate-400 font-medium">최신 기출문제 및 오답 분석</p>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-12 text-slate-400 text-sm font-medium">
        <p>© 2026 DugiGo Smart License Solution.</p>
        <p className="text-xs font-black uppercase tracking-widest text-slate-600">경성전자고등학교 전용 학습 서비스</p>
      </footer>

      {/* iOS Popup */}
      <AnimatePresence>
        {showIOSPopup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIOSPopup(false)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6 text-slate-900">
              <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600"><PlusSquare size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">홈 화면에 추가</h3>
                <p className="text-slate-500 font-bold leading-relaxed">사파리 브라우저 하단의 공유 버튼을 누른 뒤,<br/>홈 화면에 추가를 선택해 주세요!</p>
              </div>
              <button onClick={() => setShowIOSPopup(false)} className="w-full py-4 bg-slate-100 font-black rounded-xl">알겠습니다</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
