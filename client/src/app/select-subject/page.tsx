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
  if (name.includes('자동화설비') || name.includes('생산자동화')) return { icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', hoverBg: 'group-hover:bg-indigo-600' };
  return { icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50', hoverBg: 'group-hover:bg-brand-600' };
};

export default function SelectSubjectPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
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

      const { data: profile } = await supabase.from('dukigo_profiles').select('*').eq('id', currentUser.id).single();
      setUser({ ...currentUser, ...profile });

      if (profile?.role?.toLowerCase() === 'teacher' || currentUser.email === 'serv@kakao.com') {
        setIsTeacher(true);
        const { data: dbGroups } = await supabase
          .from('dukigo_teacher_groups')
          .select('*')
          .eq('teacher_id', currentUser.id);
        setGroups(dbGroups || []);
      }

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
    } else {
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
      
      {/* Integrated Header Area (1.5x Larger Mobile Text) */}
      <header className="max-w-[1600px] mx-auto pt-6 md:pt-8 px-2 md:px-12 relative z-10">
        <div className="flex items-center justify-between gap-1 md:gap-6 bg-white/40 backdrop-blur-md p-2 md:p-3 rounded-xl md:rounded-[2rem] border border-white/60 shadow-sm relative overflow-hidden">
          
          {/* 1. Left Section: Logo */}
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 relative z-20">
            <div className="w-6 h-6 md:w-10 md:h-10 bg-brand-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <GraduationCap size={14} className="text-white md:hidden" />
              <GraduationCap size={22} className="text-white hidden md:block" />
            </div>
            <h2 className="text-[15px] md:text-[21px] font-black tracking-tight text-slate-900">DugiGo</h2>
          </div>

          {/* 2. Middle Section: School Name (Absolute Center, 1.5x Larger) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none md:pointer-events-auto w-full justify-center px-2">
            <span className="text-[16px] md:text-[25px] font-black text-brand-600 tracking-tighter whitespace-nowrap">
              경성전자고등학교
            </span>
          </div>

          {/* 3. Right Section: Buttons (1.5x Larger) */}
          <div className="flex items-center gap-2 md:gap-6 ml-auto relative z-20">
            {isTeacher && (
              <Link 
                href="/teacher" 
                className="text-[15px] md:text-[17px] px-2 py-1 md:px-6 md:py-2.5 bg-brand-600 text-white font-black rounded-lg md:rounded-xl shadow-lg hover:bg-brand-700 transition-all whitespace-nowrap"
              >
                Dashboard
              </Link>
            )}
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
              className="text-[15px] md:text-[17px] text-slate-400 hover:text-rose-500 font-black transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Slogan & Install Row (1.5x Larger Mobile Text) */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 mt-3 md:mt-3 pt-3 md:pt-3 px-2">
          <p className="text-[13px] md:text-xs font-bold text-slate-500 whitespace-nowrap flex-shrink overflow-hidden text-ellipsis uppercase tracking-tight">
            <span className="text-blue-500">두</span>꺼운 <span className="text-emerald-500">기</span>능사 책 대신 <span className="text-rose-500">고</span>민말고 <span className="font-black">두기고</span>
          </p>
          {!isInstalled && (
            <motion.button 
              onClick={handleInstall} 
              className="flex items-center gap-1.5 px-3 py-2 md:px-6 md:py-3 bg-white/60 text-slate-600 rounded-full border border-slate-200 shadow-sm flex-shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <PlusSquare size={14} className="text-brand-500 md:hidden" />
              <PlusSquare size={18} className="text-brand-500 hidden md:block" />
              <span className="text-[15px] md:text-[17px] font-black tracking-tight whitespace-nowrap">홈 화면 추가</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* PC Install Button (Floating) */}
      {!isInstalled && !isIOS && deferredPrompt && (
        <div className="hidden lg:block fixed left-10 top-1/2 -translate-y-1/2 z-50">
          <motion.button onClick={handleInstall} className="flex flex-col items-center gap-4 p-6 bg-white/80 border border-slate-200 rounded-[2.5rem] shadow-xl group transition-all hover:border-brand-300">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all"><Download size={28} /></div>
            <span className="text-xs font-black text-slate-400 group-hover:text-brand-600 uppercase text-center tracking-widest">설치</span>
          </motion.button>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10 pt-8 md:pt-10">
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-5xl font-black text-slate-900 italic mb-2 leading-tight tracking-tighter">"{randomQuote}"</h1>
          <p className="text-sm md:text-xl font-bold text-slate-500 italic">
            환영합니다, <span className="text-brand-600 font-black">{user?.display_name || user?.email?.split('@')[0]}</span>님! 👋
          </p>

          {/* 선생님 그룹 표시 */}
          {isTeacher && groups.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <div className="flex items-center gap-2 mr-2">
                <FolderPlus size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">내 그룹</span>
              </div>
              {groups.map(g => (
                <Link 
                  key={g.id} 
                  href="/teacher" 
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] md:text-xs font-black rounded-xl hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm flex items-center gap-1.5"
                >
                  {g.name}
                  <span className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded">{g.members?.length || 0}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {subjects.map((subject, index) => {
            const style = getSubjectStyle(subject);
            const Icon = style.icon;
            return (
              <motion.div 
                key={subject} 
                onClick={() => router.push(`/select-unit/${encodeURIComponent(subject)}`)} 
                className="group glass-card px-5 py-4 md:px-8 md:py-10 rounded-2xl md:rounded-[2.5rem] cursor-pointer relative overflow-hidden flex items-center gap-4 md:gap-6 hover:shadow-2xl transition-all border border-white/60 active:scale-[0.98]"
                whileHover={{ y: -5 }}
              >
                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all ${style.bg} ${style.color} group-hover:bg-brand-600 group-hover:text-white shadow-inner`}>
                  <Icon size={20} className="md:hidden" />
                  <Icon size={28} className="hidden md:block" />
                </div>
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                  <span className="text-slate-900 font-black italic text-base md:text-xl">{index + 1}.</span>
                  <h3 className="text-base md:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                    {subject}
                  </h3>
                </div>
                <ChevronRight className="ml-auto text-slate-200 group-hover:text-brand-400 group-hover:translate-x-2 transition-all flex-shrink-0" size={20} />
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-10 text-slate-400 text-[10px] md:text-sm font-medium border-t border-slate-100 mt-16">
        <p>© 2026 DugiGo Smart License Solution.</p>
        <p className="font-black uppercase tracking-widest text-slate-500 mt-1 text-[13px] md:text-[17px]">경성전자고등학교 전용 학습 서비스</p>
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
