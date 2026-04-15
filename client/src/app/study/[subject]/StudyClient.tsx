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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{questionId: string, isCorrect: boolean}[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

  // 신고 모달 상태
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle'|'sending'|'done'>('idle');

  // 파라미터 상태 관리
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [setNum, setSetNum] = useState<string | null>(null);
  const [setSize, setSetSize] = useState<string | null>(null);
  const [rStart, setRStart] = useState<string | null>(null);
  const [rEnd, setREnd] = useState<string | null>(null);
  const [paramsReady, setParamsReady] = useState(false);

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
  const isAnswered = selectedIndex !== null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCurrentCorrect = currentQuestion && isAnswered && (selectedIndex + 1 === parseInt(currentQuestion.answer));

  // 답 선택 — 자동 넘김 없음, 결과만 표시
  const handleAnswer = (choiceIndex: number) => {
    if (selectedIndex !== null) return;

    setSelectedIndex(choiceIndex);
    const isCorrect = choiceIndex + 1 === parseInt(currentQuestion.answer);
    setAnswers(prev => [...prev, { 
      questionId: currentQuestion.id || currentIndex.toString(), 
      isCorrect 
    }]);
  };
  
  // 키보드 단축키 추가
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 숫자 키 1-4: 선택지 선택
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (!isAnswered && currentQuestion?.choices?.[idx] !== "") {
          handleAnswer(idx);
        }
      }
      // 오른쪽 방향키: 다음 문제
      if (e.key === 'ArrowRight') {
        if (isAnswered) {
          handleNext();
        }
      }
      // 왼쪽 방향키: 이전 문제
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, currentIndex, questions, currentQuestion]);

  // 문항 오류 신고
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
    setSelectedIndex(null);
    setElapsedSeconds(0);
    setIsFinished(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setSelectedIndex(null);
    }
  };

  const handleNextSet = () => {
    if (!setNum) return;
    const nextSet = parseInt(setNum) + 1;
    // URL 구성을 props와 일치시킴
    router.push(`/study/${params.subject}?unit=${unitFilter || ''}&set=${nextSet}&size=${setSize || '30'}`);
  };

  // 다음 버튼 핸들러
  const handleNext = () => {
    if (!isAnswered) return; // 선택하지 않으면 다음으로 못 감
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setSelectedIndex(null);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
            <button 
              onClick={handleRetry}
              className="py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> 다시 풀기
            </button>
            
            {setNum && (
              <button 
                onClick={handleNextSet}
                className="py-5 rounded-2xl bg-brand-600 text-white font-black text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
              >
                다음 세트 <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={() => router.push('/select-subject')}
              className={`py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 ${!setNum ? 'col-span-1' : 'md:col-span-2'}`}
            >
              <Home className="w-5 h-5" /> 메인으로
            </button>
          </div>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="min-h-screen relative flex flex-col text-slate-800">
      <div className="mesh-bg" />

      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 px-4 py-2 glass-card border-none bg-white/40 backdrop-blur-md flex justify-between items-center h-12 md:h-20 md:px-8 md:py-4">
        <button 
          onClick={() => currentIndex > 0 ? handlePrev() : router.back()} 
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/50 rounded-xl hover:bg-white transition-all text-slate-600 shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-4 md:gap-10">
          <span className="text-xs md:text-lg font-black tracking-[0.05em] text-brand-600 uppercase">
            {unitFilter ? `${unitFilter}${setNum ? ` · 세트 ${setNum}` : ''}` : `${subject} 기출학습`}
          </span>
          <div className="hidden md:block w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 text-base md:text-2xl font-black text-slate-900">
              <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-brand-500" /> {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-brand-50 rounded-xl text-brand-600 font-black text-[10px] md:text-xs shadow-sm">
          {Math.round(((currentIndex + 1) / questions.length) * 100)}%
        </div>
      </nav>

      {/* 진행 바 */}
      <div className="w-full h-1 bg-white/20">
        <motion.div 
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-brand-600 to-cyan-400 shadow-[0_0_10px_rgba(99,91,255,0.4)]"
        />
      </div>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-2 pb-32 md:px-8 md:py-8 md:pb-8 flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col gap-2 md:gap-6"
          >
            {/* 문제 */}
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 md:px-4 md:py-1.5 bg-brand-50 text-brand-600 text-[10px] md:text-base font-black tracking-widest rounded-full uppercase">
                  Q. {currentQuestion.year}-{currentQuestion.round}-{currentQuestion.question_num}
                </span>
                <div className="h-px flex-1 bg-brand-100/50" />
              </div>
              <h2 className="text-lg md:text-4xl font-bold text-slate-900 leading-[1.4] md:leading-[1.3] tracking-tight">
                {renderMath(currentQuestion.question)}
              </h2>
            </div>

              {currentQuestion.image && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/50 p-4 md:p-6 rounded-[2rem] border border-white/60 shadow-sm flex justify-center"
                >
                  <img 
                    src={currentQuestion.image} 
                    alt="Question Diagram" 
                    className="max-h-[200px] md:max-h-[300px] object-contain rounded-xl"
                  />
                </motion.div>
              )}

            {/* 선택지 */}
            <div className="grid grid-cols-1 gap-2 md:gap-4">
              {(currentQuestion.choices || currentQuestion.options) && (currentQuestion.choices || currentQuestion.options).map((choice: string, idx: number) => {
                const isCorrect = idx + 1 === parseInt(currentQuestion.answer);
                const isSelected = selectedIndex === idx;
                
                if (choice === "" && idx > 0) return null;

                let styleStr = "glass-card bg-white/50 hover:bg-white text-slate-700 hover:text-brand-600 cursor-pointer";
                if (isAnswered) {
                  if (isCorrect) styleStr = "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400 scale-[1.01]";
                  else if (isSelected) styleStr = "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-400 opacity-80";
                  else styleStr = "opacity-35 grayscale pointer-events-none";
                }

                return (
                  <motion.button
                    key={idx}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    disabled={isAnswered}
                    onClick={() => handleAnswer(idx)}
                    className={`group w-full px-3 py-2 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] border-2 flex items-center gap-3 md:gap-6 transition-all duration-300 text-left relative overflow-hidden ${styleStr}`}
                  >
                    <div className={`w-7 h-7 md:w-10 md:h-10 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base transition-all shadow-sm ${
                      isAnswered
                        ? (isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400')
                        : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'
                    }`}>
                      {isAnswered && isCorrect ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : 
                       isAnswered && isSelected && !isCorrect ? <XCircle className="w-4 h-4 md:w-5 md:h-5" /> : 
                       idx + 1}
                    </div>
                    <span className="text-sm md:text-xl font-bold flex-1 leading-snug">{renderMath(choice)}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* 정오 결과 + 해설 배너 (답 선택 후 표시) */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl overflow-hidden border ${
                    isCurrentCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  {/* 결과 헤더 */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${
                    isCurrentCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {isCurrentCorrect
                      ? <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      : <XCircle className="w-4 h-4 text-white shrink-0" />
                    }
                    <span className="text-white font-black text-sm flex-1 flex items-center gap-1">
                      {isCurrentCorrect 
                        ? '정답입니다! 🎉' 
                        : <>정답은 {renderMath(currentQuestion.choices?.[parseInt(currentQuestion.answer)-1] || currentQuestion.options?.[parseInt(currentQuestion.answer)-1])}</>}
                    </span>
                  </div>

                  {/* 해설 본문 */}
                  {currentQuestion.explanation && (
                    <div className={`px-4 py-3 md:px-5 md:py-4 font-medium leading-relaxed text-slate-700 ${
                      isCurrentCorrect ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                      <p className="text-xs md:text-base font-black uppercase tracking-widest text-slate-900 mb-1.5">해설</p>
                      <div className="space-y-0.5">
                        {currentQuestion.explanation.split('\n').map((line: string, i: number) => (
                          <p key={i} className="leading-relaxed text-sm md:text-xl font-bold">{renderMath(line)}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 신고 링크 */}
                  <div className={`px-4 py-2 flex justify-end ${
                    isCurrentCorrect ? 'bg-emerald-50' : 'bg-rose-50'
                  } border-t ${
                    isCurrentCorrect ? 'border-emerald-100' : 'border-rose-100'
                  }`}>
                    <button
                      onClick={() => setReportOpen(true)}
                      className="flex items-center gap-1.5 text-xs md:text-base font-black text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5 md:w-4 h-4" /> 문항 오류 신고
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
      </main>

      {/* 플로팅 이동 버튼 */}
      <AnimatePresence>
        {isAnswered && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="fixed right-4 md:right-12 bottom-8 md:top-1/2 md:-translate-y-1/2 z-50 w-14 h-14 md:w-20 md:h-20 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-500/40 border-4 border-white transition-colors"
          >
            <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            className="fixed left-4 md:left-12 bottom-8 md:top-1/2 md:-translate-y-1/2 z-50 w-14 h-14 md:w-20 md:h-20 bg-white hover:bg-slate-50 text-slate-400 hover:text-brand-600 rounded-full flex items-center justify-center shadow-2xl shadow-black/5 border-4 border-slate-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 오류 신고 모달 */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setReportOpen(false); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  <h3 className="font-black text-slate-800 text-sm">문항 오류 신고</h3>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    Q.{currentQuestion.year}-{currentQuestion.round}-{currentQuestion.question_num}
                  </span>
                </div>
                <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportStatus === 'done' ? (
                <div className="px-6 py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-black text-slate-800">신고가 접수되었습니다!</p>
                  <p className="text-xs text-slate-400 mt-1">검토 후 수정하겠습니다.</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  {/* 오류 유형 */}
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">오류 유형</p>
                    {[
                      { value: 'wrong_answer', label: '정답이 틀린 것 같아요' },
                      { value: 'wrong_explanation', label: '해설이 이상해요' },
                      { value: 'broken_text', label: '문제 문장/수식이 깨졌어요' },
                      { value: 'other', label: '기타' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                        style={{ borderColor: reportType === opt.value ? '#7c3aed' : '#e2e8f0',
                                 background: reportType === opt.value ? '#f5f3ff' : 'white' }}
                      >
                        <input type="radio" name="reportType" value={opt.value}
                          checked={reportType === opt.value}
                          onChange={() => setReportType(opt.value)}
                          className="accent-brand-600"
                        />
                        <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* 추가 설명 */}
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">추가 설명 (선택)</p>
                    <textarea
                      value={reportComment}
                      onChange={e => setReportComment(e.target.value)}
                      placeholder="구체적으로 어떤 부분이 문제인지 적어주세요."
                      rows={3}
                      className="w-full text-sm border-2 border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand-400 font-medium text-slate-700 placeholder:text-slate-300"
                    />
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setReportOpen(false)}
                      className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={!reportType || reportStatus === 'sending'}
                      className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {reportStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                      {reportStatus === 'sending' ? '신고 중...' : '신고하기'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
