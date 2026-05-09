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
  ShieldCheck
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
  const [studyLogs, setStudyLogs] = useState<any[]>([]); // 학습 기록 저장
  const [userRole, setUserRole] = useState<string>('student'); // 사용자 역할 저장
  const [userProfile, setUserProfile] = useState<any>(null); // 프로필 정보 (레벨, 경험치)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // 0. 사용자 프로필 확인
        if (user) {
          const { data: profile } = await supabase
            .from('dukigo_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (profile) {
            setUserProfile(profile);
            setUserRole(profile.role?.toLowerCase() || 'student');
          }
        }

        // 1. 단원 데이터 가져오기
        const res = await fetch(`/api/units?subject=${subject}`);
        const data = await res.json();
        setUnits(data.units || []);
        setExams(data.exams || []);
        
        const total = (data.units || []).reduce((acc: number, cur: Unit) => acc + cur.count, 0);
        setTotalQuestions(total);

        // 2. 학습 기록 가져오기 (단원별/세트별 요약용)
        if (user) {
          const { data: logs } = await supabase
            .from('dukigo_study_logs')
            .select('unit, set_num, correct_questions, total_questions, end_time')
            .eq('user_id', user.id)
            .eq('subject', subject);
          setStudyLogs(logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subject]);

  const getSetStats = (unitName: string, setNum: number, expectedTotal: number) => {
    const relevantLogs = studyLogs.filter(log => log.unit === unitName && log.set_num === setNum);
    if (relevantLogs.length === 0) return null;

    const count = relevantLogs.length;
    const bestScore = Math.max(...relevantLogs.map(log => log.correct_questions));
    // 각 로그별로 저장된 total_questions를 우선 사용하고, 없으면 전달받은 expectedTotal 사용
    const total = relevantLogs[0].total_questions || expectedTotal;
    const accuracy = Math.round((bestScore / total) * 100);
    
    // 시도별 정답률 목록
    const allScores = relevantLogs
      .sort((a, b) => new Date(a.end_time || 0).getTime() - new Date(b.end_time || 0).getTime())
      .map(log => {
        const logTotal = log.total_questions || expectedTotal;
        return Math.round(((log.correct_questions || 0) / logTotal) * 100);
      });

    return { count, bestScore, total, accuracy, allScores };
  };

  // 과목 온도(Heat) 계산 (최근 3일간의 학습 횟수 기준)
  const getSubjectHeat = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentLogs = studyLogs.filter(log => log.end_time && new Date(log.end_time) > threeDaysAgo);
    
    if (recentLogs.length >= 10) return { label: '활활', color: 'text-rose-600', icon: '🔥', bg: 'bg-rose-50' };
    if (recentLogs.length >= 3) return { label: '따끈', color: 'text-amber-600', icon: '☀️', bg: 'bg-amber-50' };
    return { label: '냉정', color: 'text-blue-600', icon: '❄️', bg: 'bg-blue-50' };
  };

  const heat = getSubjectHeat();
  const level = userProfile ? Math.floor((userProfile.exp_points || 0) / 1000) + 1 : 1;
  const expProgress = userProfile ? ((userProfile.exp_points || 0) % 1000) / 10 : 0;

  const handleSelectExam = (exam: Exam) => {
    // "2020년 1회" 또는 "2021년 상시01" 형태 분석
    const yearMatch = exam.name.match(/(\d{4})년/);
    const roundMatch = exam.name.match(/(\d+)회/);
    const sangsiMatch = exam.name.match(/상시\s*(\d+)/);
    
    let query = `/study/${encodeURIComponent(subject)}?`;
    if (yearMatch) query += `year=${yearMatch[1]}&`;
    if (roundMatch) query += `round=${roundMatch[1]}`;
    else if (sangsiMatch) query += `round=상시${sangsiMatch[1]}`;
    else {
      // 숫자만 있는 경우 기존 로직 유지
      const match = exam.name.match(/(\d+)/g);
      if (match) query += `round=${match[match.length - 1]}`;
    }
    
    router.push(query.endsWith('&') ? query.slice(0, -1) : query);
  };

  const handleRandom = () => {
    router.push(`/study/${encodeURIComponent(subject)}`);
  };

  const [isUnitsCollapsed, setIsUnitsCollapsed] = useState(false);
  const [isExamsCollapsed, setIsExamsCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <div className="mesh-bg" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 rounded-[3rem] text-center">
          <Loader2 className="w-16 h-16 text-brand-600 animate-spin mb-6 mx-auto" />
          <p className="text-2xl font-black text-slate-800 tracking-tight animate-pulse">학습 데이터를 준비 중입니다...</p>
        </motion.div>
      </div>
    );
  }

  let globalIndex = 1;
  let runningSetCount = 1; // 모든 세트에 대해 일련번호 적용

  return (
    <div className="min-h-screen relative text-slate-800 font-sans pb-32">
      <div className="mesh-bg" />

      {/* Header with Level & EXP */}
      <nav className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center relative z-10 border-b border-white/20 bg-white/40 backdrop-blur-md sticky top-0 shadow-sm mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/select-subject')}
            className="w-10 h-10 flex items-center justify-center bg-white/50 hover:bg-white hover:border-brand-400 hover:text-brand-600 active:scale-90 active:bg-brand-50 transition-all shadow-sm border-2 border-slate-100 rounded-xl shrink-0"
          >
            <ChevronLeft size={20} className="transition-colors" />
          </button>
          <div>
            <span className="text-xs font-black tracking-[0.2em] text-brand-600 uppercase">Step 02</span>
            <h2 className="text-xl font-black text-slate-900 leading-tight">{subject}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-black text-brand-700">
                {userProfile ? (LEVEL_TITLES[Math.min(11, Math.floor((userProfile.exp_points || 0) / 1000))] || "입문자") : "입문자"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Thermometer className="w-3 h-3 text-rose-500" />
              <span className="text-xs font-black text-slate-500">
                {(() => {
                  const threeDaysAgo = new Date();
                  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                  const recentCount = studyLogs.filter(log => log.end_time && new Date(log.end_time) > threeDaysAgo).length;
                  const temp = Math.min(100, 36.5 + recentCount * 1.0);
                  return temp.toFixed(1);
                })()}°C
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 relative z-10">
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-brand-50 px-4 py-1.5 rounded-full mb-6 border border-brand-100 shadow-sm"
          >
            <span className="text-sm md:text-lg font-black text-brand-600 tracking-widest">경성전자고등학교 공식 학습 플랫폼</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight"
          >
            두껍고 딱딱한 <span className="text-brand-600">기능사 책 대신</span><br />
            고민말고 <span className="text-brand-600 font-black">두 기 고</span> 하세요!
          </motion.h1>
          <p className="text-slate-500 text-lg font-medium">단원별 해설부터 실전 기출까지, 완벽한 합격 커리큘럼입니다.</p>
        </div>

        {/* 1. 소단원 핵심 공략 Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Sparkles size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900">단원별 핵심 공략 <span className="hidden sm:inline text-sm font-bold text-slate-400 ml-2">(전 세트 해설 슬라이드 포함)</span></h2>
            </div>
            <button 
              onClick={() => setIsUnitsCollapsed(!isUnitsCollapsed)}
              className="px-6 py-2.5 bg-white/50 hover:bg-brand-600 hover:text-white rounded-xl font-black text-sm transition-all border border-brand-100 shadow-sm"
            >
              {isUnitsCollapsed ? '펼치기' : '접기'}
            </button>
          </div>

          <AnimatePresence>
            {!isUnitsCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {units.map((unit, idx) => {
                    const setSize = 30;
                    const unitSetCount = Math.ceil(unit.count / setSize);
                    const currentIndex = globalIndex++;
                    
                    return (
                      <motion.div
                        key={unit.name}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card p-6 rounded-[2.5rem] border border-white/60 hover:shadow-2xl hover:shadow-brand-500/5 transition-all group flex flex-col"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-black text-sm border-2 border-brand-100/50 shrink-0">
                            {currentIndex.toString().padStart(2, '0')}
                          </div>
                          <h4 className="text-base font-black text-slate-800 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
                            {unit.name}
                          </h4>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center">
                          <div className="grid grid-cols-3 gap-4 w-full">
                              {Array.from({ length: unitSetCount }).map((_, sIdx) => {
                                const localSetNum = sIdx + 1;
                                const displaySetNumber = runningSetCount++; // 전역 번호
                                const unitName = unit.originalName || unit.name;
                                
                                // 마지막 세트는 남은 문항수만큼만 (기본 30)
                                const setTotalCount = (sIdx === unitSetCount - 1) 
                                  ? (unit.count % setSize || setSize) 
                                  : setSize;
                                
                                const stats = getSetStats(unitName, localSetNum, setTotalCount);
                              const isMastered = stats && stats.accuracy >= 80;
                              const isStarted = stats && stats.count > 0;
                              
                              // 진도 표시 여부 결정 (학생은 항상, 교사는 설정에 따라)
                              const showProgress = userRole === 'student' || localStorage.getItem('dukigo_show_teacher_progress') !== 'false';
                              
                              return (
                                <button
                                  key={sIdx}
                                  onClick={() => {
                                    const baseParams = `unit=${encodeURIComponent(unitName)}&set=${localSetNum}&size=${setSize}`;
                                    const isHistory = subject.includes('한국사');
                                    
                                    if (isHistory) {
                                      const localStart = sIdx * setSize;
                                      const localEnd = (sIdx + 1) * setSize;
                                      router.push(`/study/${encodeURIComponent(subject)}?${baseParams}&rStart=${localStart}&rEnd=${localEnd}`);
                                    } else {
                                      const rangeParams = unit.range ? `&rStart=${unit.range[0]}&rEnd=${unit.range[1]}` : '';
                                      router.push(`/study/${encodeURIComponent(subject)}?${baseParams}${rangeParams}`);
                                    }
                                  }}
                                  className={`group/btn relative h-24 md:h-28 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden shadow-sm hover:scale-105 hover:shadow-xl active:scale-95 ${
                                    isMastered && showProgress
                                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:border-emerald-400' 
                                      : isStarted && showProgress
                                        ? 'bg-brand-50/80 border-brand-200 text-brand-700 hover:border-brand-400'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                                  }`}
                                >
                                  {/* 학습 횟수 뱃지 (우측 상단) */}
                                  {isStarted && showProgress && (
                                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-black shadow-sm ${
                                      isMastered ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white'
                                    }`}>
                                      {stats.count}회
                                    </div>
                                  )}

                                  <span className={`text-3xl font-black tracking-tighter leading-none ${isStarted && showProgress ? '' : ''}`}>{displaySetNumber}</span>
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">세트</span>
                                  
                                  {/* 시도별 정답률 세로 막대 그래프 */}
                                  {isStarted && showProgress && stats && stats.allScores && (
                                    <div className="absolute bottom-0 left-0 w-full h-10 flex items-end gap-1 px-3 pb-1.5 overflow-hidden">
                                      {stats.allScores.slice(-10).map((score, idx) => (
                                        <motion.div 
                                          key={idx}
                                          initial={{ height: 0 }}
                                          animate={{ height: `${Math.max(15, score)}%` }}
                                          className={`w-2 rounded-t-[3px] shadow-sm transition-colors ${
                                            score >= 80 ? 'bg-emerald-500' : 
                                            score >= 60 ? 'bg-brand-500' : 'bg-rose-400'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 2. 연도별 기출문제 Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Calendar size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900">연도별 기출 정복</h2>
            </div>
            <button 
              onClick={() => setIsExamsCollapsed(!isExamsCollapsed)}
              className="px-6 py-2.5 bg-white/50 hover:bg-indigo-600 hover:text-white rounded-xl font-black text-sm transition-all border border-indigo-100 shadow-sm"
            >
              {isExamsCollapsed ? '펼치기' : '접기'}
            </button>
          </div>

          <AnimatePresence>
            {!isExamsCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 pt-2">
                  {exams.map((exam, idx) => {
                    const currentIndex = globalIndex++;
                    return (
                      <motion.div
                        key={exam.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ delay: 0.1 + idx * 0.03 }}
                        onClick={() => handleSelectExam(exam)}
                        className="glass-card p-8 rounded-[2rem] cursor-pointer hover:bg-brand-50/50 hover:border-brand-300 hover:shadow-xl transition-all group flex flex-col items-center text-center gap-4 border border-white/60"
                      >
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-indigo-100/50 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                          {currentIndex.toString().padStart(2, '0')}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-slate-800 group-hover:text-brand-600 transition-colors">{exam.name}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exam.count}문항</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. 전체 랜덤 학습 Section */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Zap size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900">마지막 점검</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleRandom}
            className="glass-card p-12 rounded-[3.5rem] cursor-pointer hover:shadow-2xl hover:shadow-brand-500/10 transition-all group relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border border-white/80"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px]" />
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 font-black text-lg border-2 border-amber-100 shrink-0">
              {globalIndex.toString().padStart(2, '0')}
            </div>
            <div className="w-24 h-24 bg-amber-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <LayoutGrid size={48} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-4xl font-black text-slate-900 mb-3">전체 랜덤 모의고사</h3>
              <p className="text-slate-500 text-lg font-bold">모든 단원과 연도를 무작위로 섞어 실전 감각을 극대화합니다. <span className="text-brand-600">({totalQuestions}문항 로드됨)</span></p>
            </div>
            <div className="flex items-center gap-2 text-brand-600 font-black text-2xl group-hover:translate-x-2 transition-transform">
              지금 도전하기 <ChevronRight size={32} />
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
