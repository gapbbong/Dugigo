'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  LayoutGrid,
  Calendar,
  Zap
} from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/units?subject=${subject}`);
        const data = await res.json();
        setUnits(data.units || []);
        setExams(data.exams || []);
        
        // 문항수 집계 로직 수정: 모든 단원의 문항수를 합산
        const total = (data.units || []).reduce((acc: number, cur: Unit) => acc + cur.count, 0);
        setTotalQuestions(total);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subject]);

  const handleSelectUnit = (unit: Unit, setIdx: number) => {
    const setSize = 30;
    const unitName = unit.originalName || unit.name;
    let url = `/study/${encodeURIComponent(subject)}?unit=${encodeURIComponent(unitName)}&set=${setIdx + 1}&size=${setSize}`;
    if (unit.range) url += `&rStart=${unit.range[0]}&rEnd=${unit.range[1]}`;
    router.push(url);
  };

  const handleSelectExam = (exam: Exam) => {
    const match = exam.name.match(/(\d+)년\s+(\d+)회/);
    if (match) {
      const year = match[1];
      const round = match[2];
      router.push(`/study/${encodeURIComponent(subject)}?year=${year}&round=${round}`);
    }
  };

  const handleRandom = () => {
    router.push(`/study/${encodeURIComponent(subject)}`);
  };

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

  return (
    <div className="min-h-screen relative text-slate-800 font-sans pb-32">
      <div className="mesh-bg" />

      {/* Header */}
      <nav className="max-w-[1400px] mx-auto px-8 py-8 flex justify-between items-center relative z-10">
        <button 
          onClick={() => router.push('/select-subject')}
          className="w-12 h-12 flex items-center justify-center bg-white/50 hover:bg-white rounded-2xl transition-all shadow-sm border border-white/40"
        >
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-black tracking-[0.2em] text-brand-600 uppercase">Step 02</span>
          <span className="text-lg font-black text-slate-900">{subject}</span>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 relative z-10">
        <div className="mb-16 text-center md:text-left">
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
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Sparkles size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900">단원별 핵심 공략 <span className="text-sm font-bold text-slate-400 ml-2">(매 세트별 해설 슬라이드 포함)</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {units.map((unit, idx) => {
                const setSize = 30;
                const setCount = Math.ceil(unit.count / setSize);
                const currentIndex = globalIndex++;
                
                return (
                  <motion.div
                    key={unit.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card p-8 rounded-[2.5rem] border border-white/60 hover:shadow-2xl hover:shadow-brand-500/5 transition-all group flex flex-col h-full"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-black text-sm border-2 border-brand-100/50 shrink-0">
                        {currentIndex.toString().padStart(2, '0')}
                      </div>
                      <h4 className="text-xl font-black text-slate-800 leading-snug line-clamp-2">
                        {unit.name}
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-auto">
                      {Array.from({ length: setCount }).map((_, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSelectUnit(unit, sIdx)}
                          className="py-2 bg-white border-2 border-slate-50 rounded-2xl text-slate-500 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/50 transition-all shadow-sm flex flex-col items-center justify-center leading-none gap-0.5"
                        >
                          <span className="text-xl font-black">{sIdx + 1}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">세트</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* 2. 연도별 기출문제 Section */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Calendar size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900">연도별 기출 정복</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {exams.map((exam, idx) => {
              const currentIndex = globalIndex++;
              return (
                <motion.div
                  key={exam.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + idx * 0.03 }}
                  onClick={() => handleSelectExam(exam)}
                  className="glass-card p-8 rounded-[2.5rem] cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 hover:shadow-xl transition-all group flex flex-col items-center text-center gap-4 border border-white/60"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-indigo-100/50">
                    {currentIndex.toString().padStart(2, '0')}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-800">{exam.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exam.count}문항</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
