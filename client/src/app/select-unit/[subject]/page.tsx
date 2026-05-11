'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  LayoutGrid,
  Calendar,
  Zap,
  Thermometer,
  ShieldCheck,
  Download,
  Share,
  PlusSquare
} from 'lucide-react';

const LEVEL_TITLES = [
  "입문자", "초보자", "수련자", "숙련자", 
  "전문가", "달인", "명인", "현자", 
  "영웅", "전설", "신화", "초월자"
];

interface Unit {
  name: string;
  count: number;
  isPart?: boolean;
  originalName?: string;
  range?: [number, number];
}

interface Exam {
  name: string;
  count: number;
}

export default function SelectUnitPage() {
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.subject as string);
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [studyLogs, setStudyLogs] = useState<any[]>([]); 
  const [userRole, setUserRole] = useState<string>('student');
  const [userProfile, setUserProfile] = useState<any>(null);
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

    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('dukigo_profiles').select('*').eq('id', user.id).single();
          if (profile) {
            setUserProfile(profile);
            setUserRole(profile.role?.toLowerCase() || 'student');
          }
        }
        const res = await fetch(`/api/units?subject=${subject}`);
        const data = await res.json();
        setUnits(data.units || []);
        setExams(data.exams || []);
        setTotalQuestions((data.units || []).reduce((acc: number, cur: Unit) => acc + cur.count, 0));

        if (user) {
          const { data: logs } = await supabase.from('dukigo_study_logs').select('*').eq('user_id', user.id).eq('subject', subject);
          setStudyLogs(logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [subject]);

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
      // 안드로이드/PC용 범용 안내
      alert('브라우저 우측 상단/하단 메뉴(⋮)에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해 주세요!');
    }
  };

  const getSetStats = (unitName: string, setNum: number, expectedTotal: number) => {
    const relevantLogs = studyLogs.filter(log => log.unit === unitName && log.set_num === setNum);
    if (relevantLogs.length === 0) return null;
    const count = relevantLogs.length;
    const bestScore = Math.max(...relevantLogs.map(log => log.correct_questions));
    const total = relevantLogs[0].total_questions || expectedTotal;
    const accuracy = Math.round((bestScore / total) * 100);
    const allScores = relevantLogs
      .sort((a, b) => new Date(a.end_time || 0).getTime() - new Date(b.end_time || 0).getTime())
      .map(log => Math.round(((log.correct_questions || 0) / (log.total_questions || expectedTotal)) * 100));
    return { count, bestScore, total, accuracy, allScores };
  };

  const handleSelectExam = (exam: Exam) => {
    const yearMatch = exam.name.match(/(\d{4})년/);
    const roundMatch = exam.name.match(/(\d+)회/);
    const sangsiMatch = exam.name.match(/상시\s*(\d+)/);
    let query = `/study/${encodeURIComponent(subject)}?`;
    if (yearMatch) query += `year=${yearMatch[1]}&`;
    if (roundMatch) query += `round=${roundMatch[1]}`;
    else if (sangsiMatch) query += `round=상시${sangsiMatch[1]}`;
    router.push(query);
  };

  const [isUnitsCollapsed, setIsUnitsCollapsed] = useState(false);
  const [isExamsCollapsed, setIsExamsCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <div className="mesh-bg" />
        <Loader2 className="w-16 h-16 text-brand-600 animate-spin" />
      </div>
    );
  }

  let globalIndex = 1;
  let runningSetCount = 1;

  return (
    <div className="min-h-screen relative text-slate-800 font-sans pb-32">
      <div className="mesh-bg" />

      {/* Header */}
      <nav className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-6 relative z-10 border-b border-white/20 bg-white/40 backdrop-blur-md shadow-sm mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-6">
          
          {/* Top Row: Back Button + Subject Name */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/select-subject')} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/50 hover:bg-white border-2 border-slate-100 rounded-xl shrink-0">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] md:text-xs font-black text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100 whitespace-nowrap">Step 02</span>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{subject}</h2>
            </div>
          </div>

          {/* Bottom Row (Mobile) / Right Row (PC): Info Badges (Right Aligned) */}
          <div className="flex items-center justify-end gap-1 md:gap-5 border-t border-slate-100/50 md:border-none pt-1.5 md:pt-0">
            {/* 학교 이름 (글자 크기 상향 및 밀착) */}
            <span className="text-[14px] md:text-[25px] font-black text-brand-600 tracking-tight whitespace-nowrap">경성전자고등학교</span>
            
            <div className="flex items-center gap-1 md:gap-5">
              {/* 학습 온도 */}
              <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-1 md:px-6 md:py-3 rounded-lg md:rounded-2xl border md:border-2 border-rose-100 shadow-sm flex-shrink-0">
                <Thermometer className="w-3.5 h-3.5 md:w-8 md:h-8 text-rose-500" />
                <span className="text-[13px] md:text-2xl font-black text-rose-600 whitespace-nowrap">
                  {(() => {
                    const threeDaysAgo = new Date();
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    const recentCount = studyLogs.filter(log => log.end_time && new Date(log.end_time) > threeDaysAgo).length;
                    return Math.min(100, 36.5 + recentCount * 1.0).toFixed(1);
                  })()}°C
                </span>
              </div>
              {/* 등급 */}
              <div className="flex items-center gap-1 bg-brand-50 px-1.5 py-1 md:px-8 md:py-3 rounded-lg md:rounded-2xl border md:border-2 border-brand-100 shadow-sm flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 md:w-10 md:h-10 text-brand-600" />
                <span className="text-[13px] md:text-2xl font-black text-brand-700 whitespace-nowrap">
                  {userProfile ? (LEVEL_TITLES[Math.min(11, Math.floor((userProfile.exp_points || 0) / 1000))] || "입문자") : "입문자"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* PC Install Button */}
      {!isInstalled && !isIOS && deferredPrompt && (
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50">
          <motion.button onClick={handleInstall} className="flex flex-col items-center gap-3 p-5 bg-white/60 backdrop-blur-xl border-2 border-slate-200 rounded-[2.5rem] shadow-xl group">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all">
              <Download size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-600 uppercase text-center">앱 설치<br/>PC/바탕화면</span>
          </motion.button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-8 relative z-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <motion.h1 className="text-lg md:text-2xl font-black tracking-tight leading-tight">
            두껍고 딱딱한 <span className="text-brand-600">기능사 책 대신</span><br className="sm:hidden" />
            고민말고 <span className="text-brand-600 font-black">두 기 고</span> 하세요!
          </motion.h1>
          {!isInstalled && (
            <motion.button onClick={handleInstall} className="flex items-center gap-2 px-3 py-1.5 bg-white/40 text-slate-500 rounded-full border-2 border-slate-200 shadow-sm">
              <PlusSquare size={16} />
              <span className="text-[10px] md:text-xs font-black">홈 화면에 추가</span>
            </motion.button>
          )}
        </div>

        {/* Sections */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white"><Sparkles size={20} /></div>
              <h2 className="text-xl md:text-3xl font-black text-slate-900">단원별 핵심 공략</h2>
            </div>
            <button onClick={() => setIsUnitsCollapsed(!isUnitsCollapsed)} className="px-3 py-1.5 bg-white/50 border border-brand-100 rounded-lg text-xs font-black">{isUnitsCollapsed ? '펼치기' : '접기'}</button>
          </div>
          {!isUnitsCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.map((unit, idx) => {
                const unitIndex = globalIndex++;
                const unitSetCount = Math.ceil(unit.count / 30);
                return (
                  <div key={unit.name} className="glass-card p-6 rounded-[2rem] border border-white/60">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 font-black text-xs">{unitIndex}</div>
                      <h4 className="text-sm font-black truncate">{unit.name}</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: unitSetCount }).map((_, sIdx) => {
                        const setNum = runningSetCount++;
                        const stats = getSetStats(unit.name, sIdx + 1, 30);

                        return (
                          <button 
                            key={sIdx} 
                            onClick={() => router.push(`/study/${encodeURIComponent(subject)}?unit=${encodeURIComponent(unit.name)}&set=${sIdx+1}&size=30${unit.range ? `&rStart=${unit.range[0]}&rEnd=${unit.range[1]}` : ''}`)}
                            className="h-24 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center hover:border-brand-300 transition-all relative group overflow-hidden"
                          >
                            {/* 횟수 뱃지 */}
                            {stats && (
                              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-brand-600 text-white text-[8px] font-black rounded-md shadow-sm">
                                {stats.count}회
                              </div>
                            )}

                            <span className="text-2xl font-black tracking-tighter text-slate-800">{setNum}</span>
                            <span className="text-[9px] font-black uppercase text-slate-400">세트</span>

                            {/* 미니 막대 그래프 */}
                            {stats && (
                              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50 flex items-end gap-0.5 px-1">
                                {stats.allScores.slice(-5).map((score, i) => (
                                  <div 
                                    key={i} 
                                    className="flex-1 bg-brand-500 rounded-t-sm transition-all"
                                    style={{ height: `${Math.max(20, score)}%` }}
                                  />
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Calendar size={20} /></div>
              <h2 className="text-xl md:text-3xl font-black text-slate-900">연도별 기출 정복</h2>
            </div>
            <button onClick={() => setIsExamsCollapsed(!isExamsCollapsed)} className="px-3 py-1.5 bg-white/50 border border-indigo-100 rounded-lg text-xs font-black">{isExamsCollapsed ? '펼치기' : '접기'}</button>
          </div>
          {!isExamsCollapsed && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {exams.map((exam) => (
                <div key={exam.name} onClick={() => handleSelectExam(exam)} className="glass-card p-6 rounded-[1.5rem] cursor-pointer hover:bg-brand-50 transition-all text-center">
                  <h4 className="text-lg font-black">{exam.name}</h4>
                  <p className="text-xs text-slate-400">{exam.count}문항</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section onClick={() => router.push(`/study/${encodeURIComponent(subject)}`)} className="glass-card p-10 rounded-[3rem] cursor-pointer hover:shadow-xl transition-all border border-white/80 flex items-center gap-8">
          <div className="w-20 h-20 bg-amber-500 text-white rounded-3xl flex items-center justify-center"><LayoutGrid size={40} /></div>
          <div>
            <h3 className="text-3xl font-black mb-2">전체 랜덤 모의고사</h3>
            <p className="text-slate-500 font-bold">모든 단원과 연도를 무작위로 섞어 실전 감각을 극대화합니다.</p>
          </div>
        </section>
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
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6">
              <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600"><PlusSquare size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">홈 화면에 추가</h3>
                <p className="text-slate-500 font-bold leading-relaxed">
                  브라우저 하단의 <Share size={16} className="inline" /> 공유 버튼을 누른 뒤,<br/>
                  <PlusSquare size={16} className="inline" /> 홈 화면에 추가를 선택해 주세요!
                </p>
              </div>
              <button onClick={() => setShowIOSPopup(false)} className="w-full py-4 bg-slate-100 font-black rounded-xl">알겠습니다</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
