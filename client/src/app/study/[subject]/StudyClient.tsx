'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Trophy,
  Loader2,
  Home
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath as _InlineMath } from 'react-katex';

const InlineMath = _InlineMath as any;

export function StudyContent({ searchParamsProps }: { searchParamsProps: any }) {
  const params = useParams();
  const router = useRouter();

  const subject = decodeURIComponent(params.subject as string);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{questionId: string, isCorrect: boolean}[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 파라미터 상태 관리
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [setNum, setSetNum] = useState<string | null>(null);
  const [setSize, setSetSize] = useState<string | null>(null);
  const [rStart, setRStart] = useState<string | null>(null);
  const [rEnd, setREnd] = useState<string | null>(null);
  const [paramsReady, setParamsReady] = useState(false);

  // URL 파라미터 추출 (마운트 시 한 번만 실행)
  useEffect(() => {
    const s = searchParamsProps || {};
    setUnitFilter(s.unit || null);
    setSetNum(s.set || null);
    setSetSize(s.size || null);
    setRStart(s.rStart || null);
    setREnd(s.rEnd || null);
    setParamsReady(true);
  }, [searchParamsProps]);

  // 타이머 작동
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinished) setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isFinished]);

  // 문제 데이터 가져오기
  useEffect(() => {
    if (!paramsReady) return;

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questions?subject=${subject}`);
        const data = await res.json();
        if (data.questions) {
          let filtered = data.questions;
          
          if (unitFilter) {
            filtered = data.questions.filter((q: any) => q.sub_unit === unitFilter);
          }

          if (rStart !== null && rEnd !== null) {
            filtered = filtered.slice(parseInt(rStart), parseInt(rEnd));
          }

          if (setNum && setSize) {
            const startIdx = (parseInt(setNum) - 1) * parseInt(setSize);
            const endIdx = startIdx + parseInt(setSize);
            filtered = filtered.slice(startIdx, endIdx);
          }

          setQuestions(filtered.sort(() => Math.random() - 0.5));
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [subject, unitFilter, rStart, rEnd, setNum, setSize, paramsReady]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (choiceIndex: number) => {
    if (selectedIndex !== null) return;

    setSelectedIndex(choiceIndex);
    const isCorrect = choiceIndex + 1 === parseInt(currentQuestion.answer);
    
    setAnswers(prev => [...prev, { 
      questionId: currentQuestion.id || currentIndex.toString(), 
      isCorrect 
    }]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIndex(null);
      } else {
        handleFinish();
      }
    }, 1200);
  };

  const handleFinish = async () => {
    setIsFinished(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const correctCount = answers.filter(a => a.isCorrect).length + (selectedIndex !== null && (selectedIndex + 1 === parseInt(currentQuestion.answer)) ? 1 : 0);
        await supabase.from('dukigo_study_logs').insert({
          user_id: userData.user.id,
          subject: subject,
          total_questions: questions.length,
          correct_questions: correctCount,
          end_time: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to save study log:', err);
    }
  };

  const renderMath = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={i} math={part.slice(1, -1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
          <p className="text-2xl font-black text-slate-800 tracking-tight animate-pulse">{subject} 문제를 불러오는 중...</p>
        </motion.div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <div className="mesh-bg" />
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-xl w-full glass-card p-12 text-center rounded-[3.5rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] -z-10" />
          
          <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Trophy className="w-12 h-12 text-brand-600" />
          </div>
          
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">학습 완료!</h2>
          <p className="text-slate-500 font-bold mb-10 text-lg">새로운 지식이 완전히 머릿속에 저장되었습니다. 🌳</p>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-white/40 p-10 rounded-[2.5rem] border border-white/60 shadow-sm">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">정답률</p>
              <p className="text-5xl font-black text-brand-600 tracking-tighter">{score}<span className="text-2xl">%</span></p>
            </div>
            <div className="bg-white/40 p-10 rounded-[2.5rem] border border-white/60 shadow-sm">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">소요 시간</p>
              <p className="text-5xl font-black text-slate-800 tracking-tighter">{formatTime(elapsedSeconds)}</p>
            </div>
          </div>

          <button 
            onClick={() => router.push('/select-subject')}
            className="w-full btn-primary font-black py-6 rounded-3xl flex items-center justify-center gap-2"
          >
            <Home className="w-6 h-6" /> 메인으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-slate-800">
      <div className="mesh-bg" />

      <nav className="sticky top-0 z-50 px-8 py-4 glass-card border-none bg-white/40 backdrop-blur-md flex justify-between items-center h-20">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white/50 rounded-xl hover:bg-white transition-all text-slate-600 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.2em] text-brand-600 uppercase">{subject} 기출학습</span>
          <div className="flex items-center gap-4 mt-0.5">
            <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
              <Timer className="w-4 h-4 text-brand-500" /> {formatTime(elapsedSeconds)}
            </div>
            <div className="w-px h-3 bg-slate-300" />
            <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
              <BarChart3 className="w-4 h-4 text-brand-500" /> {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="w-10 h-10 flex items-center justify-center bg-brand-50 rounded-xl text-brand-600 font-black text-xs shadow-sm">
          {Math.round(((currentIndex + 1) / questions.length) * 100)}%
        </div>
      </nav>

      <div className="w-full h-1 bg-white/20">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-brand-600 to-cyan-400 shadow-[0_0_10px_rgba(99,91,255,0.4)]"
        />
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-16 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col gap-12"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-black tracking-widest rounded-full uppercase">
                  Q. {currentQuestion.year}-{currentQuestion.round}-{currentQuestion.question_num}
                </span>
                <div className="h-px flex-1 bg-brand-100/50" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-[1.3] tracking-tight decoration-brand-100 underline-offset-8">
                {renderMath(currentQuestion.question)}
              </h2>

              {currentQuestion.image && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/50 p-6 rounded-[2.5rem] border border-white/60 shadow-sm flex justify-center"
                >
                  <img 
                    src={currentQuestion.image} 
                    alt="Question Diagram" 
                    className="max-h-[300px] object-contain rounded-xl"
                  />
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(currentQuestion.choices || currentQuestion.options) && (currentQuestion.choices || currentQuestion.options).map((choice: string, idx: number) => {
                const isCorrect = idx + 1 === parseInt(currentQuestion.answer);
                const isSelected = selectedIndex === idx;
                
                if (choice === "" && idx > 0) return null; 

                let styleStr = "glass-card bg-white/50 hover:bg-white text-slate-700 hover:text-brand-600";
                if (selectedIndex !== null) {
                  if (isCorrect) styleStr = "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500 scale-[1.02]";
                  else if (isSelected) styleStr = "bg-rose-50 text-rose-600 border-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)] ring-1 ring-rose-500 grayscale-[0.5]";
                  else styleStr = "opacity-40 grayscale pointer-events-none";
                }

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    disabled={selectedIndex !== null}
                    onClick={() => handleAnswer(idx)}
                    className={`group w-full p-8 rounded-[2rem] border-2 flex items-center gap-6 transition-all duration-300 text-left relative overflow-hidden ${styleStr}`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      isSelected || (selectedIndex !== null && isCorrect) 
                        ? (isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                        : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'
                    }`}>
                      {selectedIndex !== null && isCorrect ? <CheckCircle2 className="w-6 h-6" /> : 
                       selectedIndex !== null && isSelected && !isCorrect ? <XCircle className="w-6 h-6" /> : 
                       idx + 1}
                    </div>
                    <span className="text-xl font-bold flex-1 leading-snug">{renderMath(choice)}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="w-full py-8 px-8 flex justify-center">
        <div className="glass-card bg-white/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-sm border-none">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <p className="text-[11px] font-bold text-slate-500 tracking-tight">
            정답을 선택하면 다음 문제로 매끄럽게 넘어갑니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
