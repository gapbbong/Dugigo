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

interface Unit {
  name: string;
  count: number;
  isPart?: boolean;
  originalName?: string;
  range?: [number, number];
}

export default function SelectUnitPage() {
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.subject as string);
  
  const [units, setUnits] = useState<Unit[]>([]);
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

  const handleSelect = (unit: Unit | null, setIdx: number = 0) => {
    if (!unit) {
      router.push(`/study/${encodeURIComponent(subject)}`);
      return;
    }

    const setSize = 30;
    // 분할된 단원이면 오리지널 이름을, 아니면 그냥 이름을 사용
    const unitName = unit.originalName || unit.name;
    let url = `/study/${encodeURIComponent(subject)}?unit=${encodeURIComponent(unitName)}`;
    
    // 세트 정보 (30문항씩)
    url += `&set=${setIdx + 1}&size=${setSize}`;

    // 분할 범위 정보가 있다면 추가
    if (unit.range) {
      url += `&rStart=${unit.range[0]}&rEnd=${unit.range[1]}`;
    }

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
            AI가 분류한 단원별 학습을 통해 효율적으로 학습하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 소단원 리스트 */}
          <div className="lg:col-span-8 order-2 lg:order-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {(() => {
                let runningSetIdx = 0;
                return units.map((unit, index) => {
                  const setSize = 30;
                  const setCount = Math.ceil(unit.count / setSize);
                  const startSetIdx = runningSetIdx + 1;
                  runningSetIdx += setCount;
                  
                  return (
                    <motion.div
                      key={unit.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card p-5 rounded-[2rem] relative overflow-hidden flex flex-col gap-4 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 font-black text-sm shrink-0 border-2 border-brand-100/50">
                          {(index + 1).toString().padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black text-slate-800 leading-snug truncate">
                            {unit.name}
                          </h4>
                        </div>
                      </div>

                      {/* 세트 선택 그리드 (연속된 세트 번호) */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {Array.from({ length: setCount }).map((_, sIdx) => {
                          const globalSetNum = startSetIdx + sIdx;
                          return (
                            <button
                              key={sIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(unit, sIdx);
                              }}
                              className="py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/50 transition-all shadow-sm"
                            >
                              {globalSetNum}세트
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </AnimatePresence>

            {units.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-[2.5rem] bg-white/20">
                <Flame className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold italic">아직 소단원 분류가 완료되지 않았습니다.<br />전체 학습을 이용해 주세요!</p>
              </div>
            )}
          </div>

          {/* 전체 학습 카드 */}
          <motion.div
            className="lg:col-span-4 order-1 lg:order-2"
            initial={{ opacity: 0, x: 20 }}
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
              <p className="text-slate-500 font-bold mb-4 leading-relaxed text-sm">
                모든 단원을 골고루 섞어서<br />실전처럼 시험을 치릅니다.
                <span className="block mt-2 text-brand-600 font-black">({totalQuestions}문항 로드됨)</span>
              </p>
              
              <div className="flex items-center gap-2 text-brand-600 font-black text-xl mt-4">
                지금 도전하기 <ChevronRight size={24} />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
