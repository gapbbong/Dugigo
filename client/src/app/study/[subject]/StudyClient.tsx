'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  ChevronRight,
  Timer, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Trophy,
  Loader2,
  Home,
  Flag,
  X,
  RotateCcw
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
  const [answers, setAnswers] = useState<{questionId: string, isCorrect: boolean}[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle'|'sending'|'done'>('idle');

  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [setNum, setSetNum] = useState<string | null>(null);
  const [setSize, setSetSize] = useState<string | null>(null);
  const [rStart, setRStart] = useState<string | null>(null);
  const [rEnd, setREnd] = useState<string | null>(null);
  const [paramsReady, setParamsReady] = useState(false);

  const [aiSliderOpen, setAiSliderOpen] = useState(false);
  const [slideData, setSlideData] = useState<any[] | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  useEffect(() => {
    const s = searchParamsProps || {};
    setUnitFilter(s.unit || null);
    setSetNum(s.set || null);
    setSetSize(s.size || null);
    setRStart(s.rStart || null);
    setREnd(s.rEnd || null);
    setParamsReady(true);
  }, [searchParamsProps]);

  useEffect(() => {
    if (!paramsReady || !subject || !unitFilter || !setNum) return;
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/summaries?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(unitFilter)}&set=${setNum}`);
        if (res.ok) {
          const data = await res.json();
          setSlideData(data.slides || null);
          
          const s = searchParamsProps || {};
          if (s.autoOpenSummary === 'true' && data.slides && data.slides.length > 0) {
            setAiSliderOpen(true);
          }
        } else {
          setSlideData(null);
        }
      } catch (e) {
        console.error('Failed to load summary slides:', e);
      }
    };
    fetchSummary();
  }, [subject, unitFilter, setNum, paramsReady, searchParamsProps]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinished) setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isFinished]);

  useEffect(() => {
    if (!paramsReady) return;

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questions?subject=${subject}`);
        const data = await res.json();
        if (data.questions) {
          let filtered = data.questions;
          if (unitFilter) filtered = data.questions.filter((q: any) => q.sub_unit === unitFilter);
          if (rStart !== null && rEnd !== null) filtered = filtered.slice(parseInt(rStart), parseInt(rEnd));
          if (setNum && setSize) {
            const startIdx = (parseInt(setNum) - 1) * parseInt(setSize);
            filtered = filtered.slice(startIdx, startIdx + parseInt(setSize));
          }
          // 문제 자체를 섞음 (세트 내 랜덤화)
          const shuffledQuestions = filtered.sort(() => Math.random() - 0.5);
          
          // 각 문제의 선택지를 한 번만 섞어서 고정
          const questionsWithChoices = shuffledQuestions.map((q: any) => {
            const originalOptions = q.options || q.choices || [];
            const correctIdx = parseInt(q.answer) - 1;
            
            const optionsWithIndex = originalOptions.map((opt: string, i: number) => ({ opt, originalIdx: i }));
            for (let i = optionsWithIndex.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
            }
            
            return {
              ...q,
              shuffledOptions: optionsWithIndex.map((item: any) => item.opt),
              correctShuffledIndex: optionsWithIndex.findIndex((item: any) => item.originalIdx === correctIdx),
              selectedIndex: null,
              isCurrentCorrect: null
            };
          });

          setQuestions(questionsWithChoices);
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
  const isAnswered = currentQuestion?.selectedIndex !== null && currentQuestion?.selectedIndex !== undefined;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (choiceIndex: number) => {
    if (currentQuestion?.selectedIndex !== null) return;
    
    const isCorrect = choiceIndex === currentQuestion.correctShuffledIndex;
    
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[currentIndex] = {
        ...newQuestions[currentIndex],
        selectedIndex: choiceIndex,
        isCurrentCorrect: isCorrect
      };
      return newQuestions;
    });
    
    setAnswers(prev => {
      const qId = currentQuestion.id || currentIndex.toString();
      const filtered = prev.filter(a => a.questionId !== qId);
      return [...filtered, { questionId: qId, isCorrect }];
    });
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (!isAnswered && currentQuestion?.choices?.[idx] !== "") {
          handleAnswer(idx);
        }
      }
      if (e.key === 'ArrowRight' && isAnswered) handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, currentIndex, questions, currentQuestion]);

  const handleReport = async () => {
    if (!reportType) return;
    setReportStatus('sending');
    try {
      const { data: userData } = await supabase.auth.getUser();
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          subject,
          year: currentQuestion.year,
          round: currentQuestion.round,
          question_num: currentQuestion.question_num,
          user_id: userData.user?.id,
          report_type: reportType,
          comment: reportComment,
        }),
      });
      setReportStatus('done');
      setTimeout(() => {
        setReportOpen(false);
        setReportType('');
        setReportComment('');
        setReportStatus('idle');
      }, 1500);
    } catch {
      setReportStatus('idle');
    }
  };

  const handleRetry = () => {
    setDirection(0);
    setCurrentIndex(0);
    setAnswers([]);
    setQuestions(prev => prev.map(q => ({
      ...q,
      selectedIndex: null,
      isCurrentCorrect: null
    })));
    setElapsedSeconds(0);
    setIsFinished(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNextSet = () => {
    if (!setNum) return;
    const nextSet = parseInt(setNum) + 1;
    router.push(`/study/${params.subject}?unit=${unitFilter || ''}&set=${nextSet}&size=${setSize || '30'}`);
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const correctCount = answers.filter(a => a.isCorrect).length;
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
    // 선택지 번호(1., ①, (1)) 제거를 위한 정규식 추가
    const cleanText = text.replace(/^(\d+\.|①|②|③|④|⑤|\(\d+\))\s*/, '');
    const regex = /(\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\text\{.*?\}|\\\w+(\{.*?\})?)/g;
    const parts = cleanText.split(regex);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('$') && part.endsWith('$')) return <InlineMath key={i} math={part.slice(1, -1)} />;
      if (part.startsWith('\\(') && part.endsWith('\\)')) return <InlineMath key={i} math={part.slice(2, -2)} />;
      if (part.startsWith('\\[') && part.endsWith('\\]')) return <InlineMath key={i} math={part.slice(2, -2)} />;
      if (part.startsWith('\\')) return <InlineMath key={i} math={part} />;
      return <span key={i}>{part}</span>;
    }).filter(Boolean);
  };

  const renderQuestionText = (text: string) => {
    if (!text) return null;
    
    if (text.includes('<pre>') && text.includes('</pre>')) {
      const parts = text.split(/(<pre>[\s\S]*?<\/pre>)/g);
      return (
        <div className="text-xl md:text-4xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">
          {parts.map((part, i) => {
            if (part.startsWith('<pre>') && part.endsWith('</pre>')) {
              const codeContent = part.slice(5, -6).trim();
              return (
                <div key={i} className="my-6 p-5 md:p-8 bg-[#f8fafc] border-2 border-slate-200 rounded-3xl text-left overflow-x-auto shadow-inner">
                  <pre className="font-mono text-sm md:text-xl text-slate-800 whitespace-pre-wrap leading-relaxed">{codeContent}</pre>
                </div>
              );
            }
            return <span key={i}>{renderMath(part)}</span>;
          })}
        </div>
      );
    }

    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return (
        <div className="text-xl md:text-4xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">
          {parts.map((part, i) => {
            if (part.startsWith('```') && part.endsWith('```')) {
              const codeContent = part.slice(3, -3).replace(/^[a-z]*\n/i, '').trim();
              return (
                <div key={i} className="my-6 p-5 md:p-8 bg-[#f8fafc] border-2 border-slate-200 rounded-3xl text-left overflow-x-auto shadow-inner">
                  <pre className="font-mono text-sm md:text-xl text-slate-800 whitespace-pre-wrap leading-relaxed">{codeContent}</pre>
                </div>
              );
            }
            return <span key={i}>{renderMath(part)}</span>;
          })}
        </div>
      );
    }
    
    if (text.includes('\n\n')) {
      const firstDoubleNewline = text.indexOf('\n\n');
      const questionPart = text.slice(0, firstDoubleNewline);
      const codePart = text.slice(firstDoubleNewline + 2).trim();
      
      return (
        <div className="text-xl md:text-4xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">
          <span>{renderMath(questionPart)}</span>
          {codePart && (
            <div className="my-6 p-5 md:p-8 bg-[#f8fafc] border-2 border-slate-200 rounded-3xl text-left overflow-x-auto shadow-inner">
              <pre className="font-mono text-sm md:text-xl text-slate-800 whitespace-pre-wrap leading-relaxed">{codePart}</pre>
            </div>
          )}
        </div>
      );
    }
    
    return <h2 className="text-xl md:text-4xl md:text-5xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">{renderMath(text)}</h2>;
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
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 rounded-[3rem] text-center">
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
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-w-xl w-full glass-card p-12 text-center rounded-[3.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] -z-10" />
          <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><Trophy className="w-12 h-12 text-brand-600" /></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
            <button onClick={handleRetry} className="py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /> 다시 풀기</button>
            {setNum && <button onClick={handleNextSet} className="py-5 rounded-2xl bg-brand-600 text-white font-black text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2">다음 세트 <ChevronRight className="w-5 h-5" /></button>}
            <button onClick={() => router.push('/select-subject')} className={`py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 ${!setNum ? 'col-span-1' : 'md:col-span-2'}`}><Home className="w-5 h-5" /> 메인으로</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-slate-800">
      <div className="mesh-bg" />
      <nav className="sticky top-0 z-50 px-4 py-2 glass-card border-none bg-white/40 backdrop-blur-md flex justify-between items-center h-12 md:h-20 md:px-8 md:py-4">
        <button onClick={() => router.push(`/select-unit/${params.subject}`)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/50 rounded-xl hover:bg-white transition-all text-slate-600 shadow-sm"><ChevronLeft size={16} /></button>
        <div className="flex items-center gap-4 md:gap-10">
          <span className="text-xs md:text-lg font-black tracking-[0.05em] text-brand-600 uppercase">{unitFilter ? `${unitFilter}${setNum ? ` · 세트 ${setNum}` : ''}` : `${subject} 기출학습`}</span>
          <div className="hidden md:block w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 text-base md:text-2xl font-black text-slate-900">
              <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-brand-500" /> {currentIndex + 1} / {questions.length}
            </div>
            {slideData && slideData.length > 0 && (
              <button 
                onClick={() => {
                  setCurrentSlideIdx(0);
                  setAiSliderOpen(true);
                }} 
                className="px-3 py-1 md:px-5 md:py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[10px] md:text-sm font-black rounded-full shadow-lg shadow-brand-500/20 hover:scale-105 transition-all flex items-center gap-1.5 shrink-0"
              >
                ✨ 요약
              </button>
            )}
          </div>
        </div>
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-brand-50 rounded-xl text-brand-600 font-black text-[10px] md:text-xs shadow-sm">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</div>
      </nav>
      <div className="w-full h-1 bg-white/20">
        <motion.div animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-brand-600 to-cyan-400 shadow-[0_0_10px_rgba(99,91,255,0.4)]" />
      </div>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-[15%] py-2 pb-32 md:py-8 md:pb-8 flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentIndex} custom={direction} initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="flex-1 flex flex-col gap-8 md:gap-16">
            <div className="space-y-4 md:space-y-8">
              <div className="flex items-center gap-3"><span className="px-3 py-1 md:px-4 md:py-1.5 bg-brand-50 text-brand-600 text-[10px] md:text-base font-black tracking-widest rounded-full uppercase">Q. {currentQuestion.year}-{currentQuestion.round}-{currentQuestion.question_num || currentQuestion.number}</span><div className="h-px flex-1 bg-brand-100/50" /></div>
              {renderQuestionText(currentQuestion.question)}
            </div>

            {currentQuestion.image && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/50 p-4 md:p-6 rounded-[2rem] border border-white/60 shadow-sm flex justify-center"><img src={currentQuestion.image} alt="Question Diagram" className="max-h-[200px] md:max-h-[300px] object-contain rounded-xl"/></motion.div>
            )}

            {/* 선택지 */}
            <div className="grid grid-cols-1 gap-4 md:gap-8">
              {currentQuestion.shuffledOptions.map((choice: string, idx: number) => {
                const isSelected = currentQuestion.selectedIndex === idx;
                const isCorrect = idx === currentQuestion.correctShuffledIndex;
                const isAnswered = currentQuestion.selectedIndex !== null;
                if (choice === "" && idx > 0) return null;
                let styleStr = "glass-card bg-white/50 hover:bg-white text-slate-700 hover:text-brand-600 cursor-pointer";
                if (isAnswered) {
                  if (isCorrect) styleStr = "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400 scale-[1.01]";
                  else if (isSelected) styleStr = "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-400 opacity-80";
                  else styleStr = "opacity-35 grayscale pointer-events-none";
                }
                return (
                  <motion.button key={idx} whileTap={!isAnswered ? { scale: 0.98 } : {}} disabled={isAnswered} onClick={() => handleAnswer(idx)} className={`group w-full px-3 py-2 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] border-2 flex items-center gap-3 md:gap-6 transition-all duration-300 text-left relative overflow-hidden ${styleStr}`}>
                    <div className={`w-7 h-7 md:w-10 md:h-10 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base transition-all shadow-sm ${isAnswered ? (isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400') : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'}`}>
                      {isAnswered && isCorrect ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : isAnswered && isSelected && !isCorrect ? <XCircle className="w-4 h-4 md:w-5 md:h-5" /> : idx + 1}
                    </div>
                    <span className="text-base md:text-xl font-bold flex-1 leading-relaxed">{renderMath(choice)}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* 모바일 하단 이동 버튼 (선택지 바로 밑) */}
            <div className="flex md:hidden items-center justify-between gap-4 mt-3 px-2">
              {currentIndex > 0 ? (
                <button 
                  onClick={handlePrev} 
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-white border-2 border-slate-200 text-slate-400 active:scale-90 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : <div className="w-14 h-14" />}
              <AnimatePresence>
                {currentQuestion.selectedIndex !== null && (
                  <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} onClick={handleNext} className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-95 transition-all">
                    <ChevronRight className="w-7 h-7" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* 정오 결과 + 해설 배너 */}
            <AnimatePresence>
              {currentQuestion.selectedIndex !== null && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 md:mt-12 rounded-3xl overflow-hidden border-2 ${currentQuestion.isCurrentCorrect ? 'border-emerald-200' : 'border-rose-200'} bg-white shadow-xl shadow-black/5`}>
                  <div className={`px-6 py-4 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${currentQuestion.isCurrentCorrect ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 ${currentQuestion.isCurrentCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {currentQuestion.isCurrentCorrect ? <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" /> : <XCircle className="w-8 h-8 md:w-10 md:h-10" />}
                      </div>
                      <div>
                        <h4 className={`text-xl md:text-2xl font-black mb-1 ${currentQuestion.isCurrentCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {currentQuestion.isCurrentCorrect ? '정답입니다!' : '틀렸습니다!'}
                        </h4>
                        <p className={`text-sm md:text-base font-bold ${currentQuestion.isCurrentCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {currentQuestion.isCurrentCorrect ? '완벽하게 이해하셨네요 👏' : '해설을 읽고 확실히 짚고 넘어가세요 💪'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {currentQuestion.explanation && (
                    <div className="p-6 md:p-8 bg-white border-t border-slate-100">
                      <p className="text-xs md:text-base font-black uppercase tracking-widest text-slate-900 mb-1.5">해설</p>
                      <div className="space-y-0.5 explanation-table">
                        {currentQuestion.explanation.includes('<table') ? (<div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />) : (
                          currentQuestion.explanation.split('\n').map((line: string, i: number) => (<p key={i} className="leading-relaxed text-sm md:text-xl font-bold">{renderMath(line)}</p>))
                        )}
                      </div>
                    </div>
                  )}
                  <div className={`px-4 py-2 flex justify-end ${currentQuestion.isCurrentCorrect ? 'bg-emerald-50' : 'bg-rose-50'} border-t ${currentQuestion.isCurrentCorrect ? 'border-emerald-100' : 'border-rose-100'}`}>
                    <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 text-xs md:text-base font-black text-slate-500 hover:text-rose-500 transition-colors"><Flag className="w-3.5 h-3.5 md:w-4 h-4" /> 문항 오류 신고</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 데스크탑 전용 플로팅 이동 버튼 */}
      <div className="hidden md:block">
        <AnimatePresence>
          {isAnswered && (
            <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleNext} className="fixed right-6 md:right-[7.5%] md:translate-x-1/2 bottom-12 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-50 w-16 h-16 md:w-20 md:h-20 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-500/40 border-4 border-white transition-colors">
              <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {currentIndex > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePrev} className="fixed left-6 md:left-[7.5%] md:-translate-x-1/2 bottom-12 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-50 w-16 h-16 md:w-20 md:h-20 bg-white hover:bg-slate-50 text-slate-400 hover:text-brand-600 rounded-full flex items-center justify-center shadow-2xl shadow-black/5 border-4 border-slate-100 transition-colors">
              <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 오류 신고 모달 */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setReportOpen(false); }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-rose-500" /><h3 className="font-black text-slate-800 text-sm">문항 오류 신고</h3><span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Q.{currentQuestion.year}-{currentQuestion.round}-{currentQuestion.question_num || currentQuestion.number}</span></div>
                <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              {reportStatus === 'done' ? (
                <div className="px-6 py-10 text-center"><CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" /><p className="font-black text-slate-800">신고가 접수되었습니다!</p><p className="text-xs text-slate-400 mt-1">검토 후 수정하겠습니다.</p></div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-2"><p className="text-xs font-black text-slate-500 uppercase tracking-widest">오류 유형</p>{[{ value: 'wrong_answer', label: '정답이 틀린 것 같아요' }, { value: 'wrong_explanation', label: '해설이 이상해요' }, { value: 'broken_text', label: '문제 문장/수식이 깨졌어요' }, { value: 'other', label: '기타' }].map(opt => (<label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: reportType === opt.value ? '#7c3aed' : '#e2e8f0', background: reportType === opt.value ? '#f5f3ff' : 'white' }}><input type="radio" name="reportType" value={opt.value} checked={reportType === opt.value} onChange={() => setReportType(opt.value)} className="accent-brand-600" /><span className="text-sm font-bold text-slate-700">{opt.label}</span></label>))}</div>
                  <div><p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">추가 설명 (선택)</p><textarea value={reportComment} onChange={e => setReportComment(e.target.value)} placeholder="구체적으로 어떤 부분이 문제인지 적어주세요." rows={3} className="w-full text-sm border-2 border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand-400 font-medium text-slate-700 placeholder:text-slate-300" /></div>
                  <div className="flex gap-3 pt-1"><button onClick={() => setReportOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all">취소</button><button onClick={handleReport} disabled={!reportType || reportStatus === 'sending'} className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">{reportStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}{reportStatus === 'sending' ? '신고 중...' : '신고하기'}</button></div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI 요약 슬라이더 모달 */}
      <AnimatePresence>
        {aiSliderOpen && slideData && slideData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setAiSliderOpen(false); }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] md:h-[70vh] relative border border-white/20"
            >
              {/* 상단바 */}
              <div className="flex items-center justify-between px-6 py-4 md:px-10 md:py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">✨</span>
                  <h3 className="font-black text-slate-800 text-sm md:text-xl">핵심 개념 요약</h3>
                  <span className="text-[10px] md:text-xs text-brand-600 font-black bg-brand-50 px-3 py-1 rounded-full uppercase">
                    {subject} · {unitFilter}
                  </span>
                </div>
                <button 
                  onClick={() => setAiSliderOpen(false)} 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-slate-200/50 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
                >
                  <X className="w-4 h-4 md:w-6 md:h-6" />
                </button>
              </div>

              {/* 슬라이드 본문 */}
              <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-20 py-8 relative overflow-hidden select-none">
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                  }
                `}</style>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentSlideIdx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center w-full max-w-5xl"
                  >
                    {/* 좌측: 거대한 비주얼 영역 */}
                    <div className="md:col-span-5 flex justify-center items-center relative h-40 md:h-80">
                      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 rounded-full blur-3xl" />
                      <div 
                        style={{ animation: 'float 3s ease-in-out infinite' }} 
                        className="flex justify-center items-center drop-shadow-2xl select-none w-full h-full"
                      >
                        {slideData[currentSlideIdx].image ? (
                          <img 
                            src={slideData[currentSlideIdx].image} 
                            alt={slideData[currentSlideIdx].title}
                            className="max-h-[180px] md:max-h-[300px] max-w-full object-cover rounded-[2rem] shadow-2xl border-4 border-white/80"
                          />
                        ) : (
                          <span className="text-8xl md:text-[10rem]">{slideData[currentSlideIdx].emoji}</span>
                        )}
                      </div>
                    </div>

                    {/* 우측: 핵심 텍스트 영역 */}
                    <div className="md:col-span-7 flex flex-col justify-center text-center md:text-left space-y-4 md:space-y-6">
                      <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug word-break-keep-all">
                        {slideData[currentSlideIdx].title}
                      </h2>
                      <p className="text-base md:text-xl font-bold text-slate-600 leading-relaxed md:leading-loose word-break-keep-all">
                        {slideData[currentSlideIdx].content}
                      </p>
                      {slideData[currentSlideIdx].exam_point && (
                        <div className="p-4 md:p-5 bg-amber-50/80 rounded-[1.5rem] border-2 border-amber-200/50 text-amber-950 self-center md:self-start w-full shadow-sm flex flex-col gap-1 md:gap-2 text-left">
                          <span className="text-xs md:text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                            📌 기출 공략 포인트 (시험 출제 기준)
                          </span>
                          <span className="text-sm md:text-base font-bold leading-relaxed word-break-keep-all">
                            {slideData[currentSlideIdx].exam_point}
                          </span>
                        </div>
                      )}

                      {slideData[currentSlideIdx].visual && (
                        <div className="inline-flex px-5 py-2.5 bg-brand-50 rounded-2xl border border-brand-100 text-brand-700 font-black text-xs md:text-base shadow-inner self-center md:self-start items-center gap-1.5">
                          {slideData[currentSlideIdx].visual}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* 슬라이드 넘김 화살표 */}
                {currentSlideIdx > 0 && (
                  <button 
                    onClick={() => setCurrentSlideIdx(prev => prev - 1)}
                    className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}
                {currentSlideIdx < slideData.length - 1 && (
                  <button 
                    onClick={() => setCurrentSlideIdx(prev => prev + 1)}
                    className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all shadow-lg shadow-slate-900/20"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}
              </div>

              {/* 하단 페이지네이션 인디케이터 */}
              <div className="px-6 py-4 md:px-10 md:py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-2">
                {slideData.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlideIdx ? 'w-8 bg-brand-600 shadow-[0_0_10px_rgba(99,91,255,0.3)]' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
