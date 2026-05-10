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
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const getSubjectStyle = (name: string) => {
  if (name.includes('전기')) {
    return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', hoverBg: 'group-hover:bg-amber-500', hoverText: 'group-hover:text-amber-600', glow: 'bg-amber-500/5 group-hover:bg-amber-500/10' };
  }
  if (name.includes('정보처리')) {
    return { icon: Terminal, color: 'text-emerald-500', bg: 'bg-emerald-50', hoverBg: 'group-hover:bg-emerald-500', hoverText: 'group-hover:text-emerald-600', glow: 'bg-emerald-500/5 group-hover:bg-emerald-500/10' };
  }
  if (name.includes('승강기')) {
    return { icon: ArrowUpDown, color: 'text-violet-500', bg: 'bg-violet-50', hoverBg: 'group-hover:bg-violet-500', hoverText: 'group-hover:text-violet-600', glow: 'bg-violet-500/5 group-hover:bg-violet-500/10' };
  }
  if (name.includes('디자인')) {
    return { icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50', hoverBg: 'group-hover:bg-pink-500', hoverText: 'group-hover:text-pink-600', glow: 'bg-pink-500/5 group-hover:bg-pink-500/10' };
  }
  if (name.includes('컴퓨터') || name.includes('컴활')) {
    return { icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50', hoverBg: 'group-hover:bg-blue-500', hoverText: 'group-hover:text-blue-600', glow: 'bg-blue-500/5 group-hover:bg-blue-500/10' };
  }
  if (name.includes('한국사')) {
    return { icon: History, color: 'text-rose-500', bg: 'bg-rose-50', hoverBg: 'group-hover:bg-rose-500', hoverText: 'group-hover:text-rose-600', glow: 'bg-rose-500/5 group-hover:bg-rose-500/10' };
  }
  if (name.includes('지게차') || name.includes('운전')) {
    return { icon: Settings, color: 'text-orange-500', bg: 'bg-orange-50', hoverBg: 'group-hover:bg-orange-500', hoverText: 'group-hover:text-orange-600', glow: 'bg-orange-500/5 group-hover:bg-orange-500/10' };
  }
  return { icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50', hoverBg: 'group-hover:bg-brand-600', hoverText: 'group-hover:text-brand-600', glow: 'bg-brand-500/5 group-hover:bg-brand-500/10' };
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
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // 2. Fetch user profile to check if teacher or admin
      try {
        const { data: profile } = await supabase
          .from('dukigo_profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();
        
        if (profile?.role?.toLowerCase() === 'teacher' || currentUser.email === 'serv@kakao.com') {
          setIsTeacher(true);
        }
      } catch (e) {
        console.error('Failed to load profile role:', e);
      }

      // 3. Fetch Subjects from API
      try {
        const res = await fetch('/api/subjects');
        const data = await res.json();
        let fetchedSubjects: string[] = data.subjects || [];

        // 정렬 로직: 일반 과목 -> 산업기사 -> 한국사
        fetchedSubjects.sort((a, b) => {
          const aIsHistory = a.includes('한국사');
          const bIsHistory = b.includes('한국사');
          const aIsInd = a.includes('산업기사');
          const bIsInd = b.includes('산업기사');

          // 한국사는 무조건 맨 뒤로
          if (aIsHistory && !bIsHistory) return 1;
          if (!aIsHistory && bIsHistory) return -1;

          // 산업기사는 한국사 바로 앞으로
          if (aIsInd && !bIsInd) {
            return bIsHistory ? -1 : 1;
          }
          if (!aIsInd && bIsInd) {
            return aIsHistory ? 1 : -1;
          }

          // 나머지는 가나다순
          return a.localeCompare(b);
        });

        setSubjects(fetchedSubjects);
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

  const quotes = [
    "오늘 걷지 않으면 내일은 뛰어야 한다.",
    "천재는 1%의 영감과 99%의 노력으로 이루어진다.",
    "가장 어두운 밤도 결국 지나가고 해는 뜰 것이다.",
    "배움에는 끝이 없다. 인생은 죽을 때까지 배우는 과정이다.",
    "성공은 결과가 아니라 과정이다.",
    "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 당신이 믿는 대로 될 것이다.",
    "포기하는 그 순간이 바로 성공하기 5분 전이다.",
    "공부할 때의 고통은 잠깐이지만, 배우지 못한 고통은 평생이다.",
    "어제보다 나은 오늘을 만드는 것이 진정한 승리다.",
    "작은 차이가 큰 결과를 만든다.",
    "당신의 꿈을 제한하지 마라. 당신의 능력을 믿어라.",
    "성공은 매일 반복되는 작은 노력들의 합이다.",
    "인생에서 가장 큰 위험은 아무런 위험도 감수하지 않는 것이다.",
    "모든 성취의 시작은 도전하겠다는 결심이다.",
    "준비된 자에게 기회는 반드시 찾아온다.",
    "실패는 다시 시작할 수 있는 기회일 뿐이다.",
    "자신을 이기는 사람이 세상에서 가장 강한 사람이다.",
    "인생은 속도가 아니라 방향이다.",
    "지금 자면 꿈을 꾸지만, 지금 공부하면 꿈을 이룬다.",
    "노력은 결코 배신하지 않는다.",
    "꿈을 크게 가져라. 깨져도 그 조각이 크다.",
    "한 번의 실패가 영원한 실패는 아니다.",
    "당신의 미래는 지금 당신이 무엇을 하느냐에 달려 있다.",
    "불가능은 노력을 하지 않는 사람의 변명일 뿐이다.",
    "성공의 비결은 시작하는 것이다.",
    "인내할 수 있는 사람은 그가 바라는 무엇이든 얻을 수 있다.",
    "미래를 예측하는 가장 좋은 방법은 미래를 만드는 것이다.",
    "행복은 성취의 기쁨과 창조적 노력이 주는 스릴 속에 있다.",
    "길이 없으면 길을 찾아라, 그래도 없으면 길을 닦아라.",
    "자신감은 위대한 일의 첫 번째 비결이다.",
    "늦었다고 생각할 때가 가장 빠른 때다.",
    "가장 위대한 영광은 한 번도 넘어지지 않는 것이 아니라, 넘어질 때마다 일어나는 것이다.",
    "배운다는 것은 자기 자신을 풍요롭게 만드는 가장 아름다운 행위다.",
    "인생은 우리가 만드는 것이다. 언제나 그래왔고 앞으로도 그럴 것이다.",
    "오늘 당신이 하는 노력이 내일의 당신을 만든다.",
    "결과보다 중요한 것은 그 과정에서 당신이 무엇을 배웠느냐이다.",
    "꿈은 이루어지기 전까지는 꿈일 뿐이지만, 행동하면 현실이 된다.",
    "어려운 일은 시간이 좀 걸릴 뿐이고, 불가능한 일은 시간이 좀 더 걸릴 뿐이다.",
    "자신을 믿는 순간, 당신은 어떻게 살아야 할지 알게 될 것이다.",
    "성공으로 가는 엘리베이터는 고장이다. 계단을 이용해라. 한 걸음씩.",
    "지혜는 학교에서 배우는 것이 아니라 평생 노력해서 얻는 것이다.",
    "당신이 세상을 바꿀 수 없다고 말하는 사람들을 무시하라.",
    "작은 성취들이 모여 거대한 성공이 된다.",
    "매일매일 조금씩 성장하는 당신이 아름답다.",
    "어려움 속에서도 웃을 수 있는 자가 최후의 승자다.",
    "기회는 노크하지 않는다. 당신이 문을 부수고 나가야 한다.",
    "인생의 주인공은 바로 당신이다. 멋진 시나리오를 써라.",
    "배움은 미래를 위한 가장 좋은 준비다.",
    "포기하지 마라. 기적은 항상 마지막에 일어난다.",
    "오늘의 수고가 내일의 보석이 되어 빛날 것이다."
  ];

  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, []);

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
      <header className="max-w-6xl mx-auto mb-8 md:mb-16 relative z-10 pt-6 md:pt-12 px-6 md:px-12 flex flex-col gap-4">
        {/* Top Row: Logo, Version, Actions */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900">DugiGo</h2>
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <span className="text-lg md:text-2xl font-black text-brand-600 tracking-tight">경성전자고등학교</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full">v2.0.2</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2">
            {isTeacher && (
              <Link 
                href="/teacher"
                className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-100 transition-colors px-2.5 py-1.5 rounded-lg bg-white/80 font-bold border-2 border-brand-200/50 shadow-sm text-xs md:text-sm"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            )}
            <button 
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-900 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-bold text-xs md:text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Bottom Row: Slogan */}
        <div className="w-full">
          <p className="text-xs md:text-sm font-bold text-slate-500 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="text-blue-500">두</span>꺼운 <span className="text-emerald-500">기</span>능사 책 대신 <span className="text-rose-500">고</span>민말고 <span className="ml-1 font-black tracking-widest"><span className="text-blue-500">두</span><span className="text-emerald-500">기</span><span className="text-rose-500">고</span></span>
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10 px-6 md:px-12">
        <div className="mb-6 md:mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3"
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 italic">
              <span className="text-brand-600">"{randomQuote}"</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-slate-500">
              환영합니다, <span className="text-brand-600">{user?.email?.split('@')[0]}</span>님! 👋
            </p>
          </motion.div>
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
                    className="group glass-card p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] cursor-pointer transition-all relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] transition-colors ${style.glow}`} />
                    
                    <div className="flex flex-row md:flex-col items-center md:items-start h-full relative z-10 gap-4 md:gap-0">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center md:mb-6 group-hover:text-white transition-all shadow-sm flex-shrink-0 ${style.bg} ${style.color} ${style.hoverBg}`}>
                        <Icon className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      
                      <div className="flex flex-col min-w-0">
                        <h3 className={`text-lg md:text-2xl font-bold mb-0.5 md:mb-2 text-slate-800 transition-colors tracking-tight truncate ${style.hoverText}`}>{index + 1}. {subject}</h3>
                        <p className="text-slate-400 mb-0 md:mb-8 text-[11px] md:text-sm font-medium line-clamp-1">최신 기출문제 및 오답 분석</p>
                      </div>
                      
                      <div className={`hidden md:flex mt-auto items-center font-bold gap-2 text-sm ${style.color}`}>
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
      <footer className="max-w-6xl mx-auto mt-20 pb-12 text-center text-slate-400 text-sm font-medium flex flex-col gap-2">
        <p>© 2026 DugiGo Smart License Solution.</p>
        <p className="text-[12px] md:text-sm font-black text-slate-600 tracking-widest uppercase">경성전자고등학교 전용 학습 서비스</p>
      </footer>
    </div>
  );
}
