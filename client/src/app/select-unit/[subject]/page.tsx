'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Layers, 
  Target, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  Flame,
  LayoutGrid
} from 'lucide-react';

export default function SelectUnitPage() {
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.subject as string);
  
  const [units, setUnits] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch(`/api/units?subject=${subject}`);
        const data = await res.json();
        const unitList = data.units || [];
        setUnits(unitList);
        
        // 전체 문항 수 계산
        const total = unitList.reduce((acc: number, cur: any) => acc + cur.count, 0);
        setTotalQuestions(total);
      } catch (err) {
        console.error('Failed to fetch units:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, [subject]);

  const handleSelect = (unit: string | null) => {
    const url = unit 
      ? `/study/${encodeURIComponent(subject)}?unit=${encodeURIComponent(unit)}`
      : `/study/${encodeURIComponent(subject)}`;
    router.push(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <div className="mesh-bg" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-[3rem] text-center"
        >
          <Loader2 className="w-16 h-16 text-brand-600 animate-spin mb-6 mx-auto" />
          <p className="text-2xl font-black text-slate-800 tracking-tight animate-pulse">단원 정보를 분석하는 중...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-slate-800 font-sans pb-20">
      <div className="mesh-bg" />

      {/* Header */}
      <nav className="max-w-6xl mx-auto px-8 py-8 flex justify-between items-center relative z-10">
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

      <main className="max-w-6xl mx-auto px-8 relative z-10">
        <div className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight"
          >
            어떤 부분을 <span className="text-gradient">집중 공략</span>할까요?
          </motion.h1>
          <p className="text-slate-500 text-lg font-medium">
            전체 랜덤 학습이나 AI가 분류한 소단원별 학습을 선택할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 전체 학습 카드 */}
          <motion.div
            className="lg:col-span-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div 
              onClick={() => handleSelect(null)}
              className="glass-card p-10 rounded-[3.5rem] cursor-pointer hover:shadow-2xl hover:shadow-brand-500/10 transition-all group relative overflow-hidden h-full flex flex-col highlight-border"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 blur-[60px] group-hover:bg-brand-500/20 transition-colors" />
              
              <div className="w-16 h-16 bg-brand-600 text-white rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg shadow-brand-500/30">
                <LayoutGrid className="w-8 h-8" />
              </div>
              
              <h3 className="text-3xl font-black mb-4 text-slate-900">전체 랜덤 학습</h3>
              <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                모든 단원을 골고루 섞어서<br />실전처럼 시험을 치릅니다.
                <span className="block mt-2 text-brand-600 font-black">({totalQuestions}문항 로드됨)</span>
              </p>
              
              <div className="mt-auto pt-4 flex items-center gap-2 text-brand-600 font-black">
                지금 도전하기 <ChevronRight size={20} />
              </div>
            </div>
          </motion.div>

          {/* 소단원 리스트 */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-1 gap-3">
            <AnimatePresence>
              {units.map((unit, index) => (
                <motion.div
                  key={unit.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(unit.name)}
                  className="glass-card p-5 rounded-[1.5rem] cursor-pointer hover:bg-white hover:border-brand-200 transition-all flex items-center gap-5 group relative overflow-hidden"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-brand-600 transition-colors leading-tight">
                      {unit.name}
                    </h4>
                    <span className="px-3 py-1 bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-700 text-[11px] font-black rounded-full transition-all">
                      {unit.count}문항
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transform group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </AnimatePresence>

            {units.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-[2.5rem] bg-white/20">
                <Flame className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold italic">아직 소단원 분류가 완료되지 않았습니다.<br />전체 학습을 이용해 주세요!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
