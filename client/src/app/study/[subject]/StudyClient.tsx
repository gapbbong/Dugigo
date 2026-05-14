'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RotateCcw,
  BookOpen,
  Sparkles,
  Zap,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath as _InlineMath } from 'react-katex';

const InlineMath = _InlineMath as any;

const LEVEL_TITLES = [
  "입문자", "초보자", "수련자", "숙련자", 
  "전문가", "달인", "명인", "현자", 
  "영웅", "전설", "신화", "초월자"
];

export function StudyContent({ searchParamsProps }: { searchParamsProps: any }) {
  const params = useParams();
  const router = useRouter();

  const subject = decodeURIComponent(params.subject as string);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{questionId: string, isCorrect: boolean}[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false); // 초기값은 false
  const [currentSlide, setCurrentSlide] = useState(0);

  // 처음 입장 시 '더 이상 보지 않기' 설정 확인 후 자동 표시
  useEffect(() => {
    const dontShow = localStorage.getItem(`dontShowSummary_${subject}`);
    if (dontShow !== 'true') {
      setShowSummary(true);
    }
  }, [subject]);

  const toggleDontShow = (checked: boolean) => {
    if (checked) {
      localStorage.setItem(`dontShowSummary_${subject}`, 'true');
    } else {
      localStorage.removeItem(`dontShowSummary_${subject}`);
    }
  };
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
  const [showResultModal, setShowResultModal] = useState(false); // 결과 모달
  const [showLevelUp, setShowLevelUp] = useState(false); // 레벨업 모달
  const [lastGainedExp, setLastGainedExp] = useState(0);
  const [praiseMessage, setPraiseMessage] = useState('');
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [prevLevel, setPrevLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [paramsReady, setParamsReady] = useState(false);

  const [aiSliderOpen, setAiSliderOpen] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hideAutoSummary, setHideAutoSummary] = useState(false);
  const [slideData, setSlideData] = useState<any[] | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isSummaryError, setIsSummaryError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [currentCombo, setCurrentCombo] = useState(0);
  const [nextConfettiThreshold, setNextConfettiThreshold] = useState(3);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('dukigo_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) setUserProfile(profile);
      }
    };
    fetchProfile();
  }, []);

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
      if (!subject || !unitFilter || !setNum) return;
      
      setIsGenerating(true);
      setIsSummaryError(false);
      setSummaryProgress(0);
      
      // 가상 프로그래스 시작
      const progressInterval = setInterval(() => {
        setSummaryProgress(prev => {
          if (prev >= 95) return 95;
          return prev + (95 - prev) * 0.1;
        });
      }, 1000);

      try {
        const fetchUnit = unitFilter;
        const sizeParam = setSize ? `&size=${setSize}` : '';
        const res = await fetch(`/api/summaries?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(fetchUnit)}&set=${setNum}${sizeParam}`);
        
        if (res.ok) {
          const data = await res.json();
          if (data.slides && data.slides.length > 0) {
            setSlideData(data.slides);
            setSummaryProgress(100);
            
            const hideKey = `dugigo_hide_summary_${subject}_${unitFilter}_${setNum}`;
            const isHidden = localStorage.getItem(hideKey) === 'true';
            setHideAutoSummary(isHidden);

            if (!isHidden) setAiSliderOpen(true);
          } else {
            throw new Error('No slides generated');
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (e) {
        console.error('Summary generation failed:', e);
        setIsSummaryError(true);
      } finally {
        clearInterval(progressInterval);
        setIsGenerating(false);
      }
    };

    fetchSummary();
  }, [subject, unitFilter, setNum, paramsReady, searchParamsProps, retryCount]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinished) setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isFinished]);

  const fetchQuestions = useCallback(async (startIdx: number, limitCount: number, isPrefetch = false) => {
    try {
      const yearFilter = searchParamsProps?.year || '';
      const roundFilter = searchParamsProps?.round || '';
      const unit = unitFilter || '';
      
      const url = `/api/questions?subject=${subject}&start=${startIdx}&limit=${limitCount}&unit=${encodeURIComponent(unit)}&year=${yearFilter}&round=${roundFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.questions) {
        const questionsWithChoices = data.questions.map((q: any) => {
          const originalOptions = q.options || q.choices || [];
          const originalChoiceImgs = q.choice_imgs || [];
          
          const parseAnswer = (ans: any) => {
            if (typeof ans === 'number') return ans;
            const s = String(ans || '').trim();
            if (/^\d+$/.test(s)) return parseInt(s);
            const circled = { '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5, '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9 };
            return (circled as any)[s] || parseInt(s) || 0;
          };
          const correctIdx = parseAnswer(q.answer) - 1;
          
          const optionsWithIndex = originalOptions.map((opt: string, i: number) => ({ 
            opt, 
            originalIdx: i,
            choiceImg: originalChoiceImgs[i] || null
          }));

          for (let i = optionsWithIndex.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
          }
          
          return {
            ...q,
            shuffledOptions: optionsWithIndex.map((item: any) => item.opt),
            shuffledOptionsIdx: optionsWithIndex.map((item: any) => item.originalIdx),
            shuffledChoiceImgs: optionsWithIndex.map((item: any) => item.choiceImg),
            correctShuffledIndex: optionsWithIndex.findIndex((item: any) => item.originalIdx === correctIdx),
            selectedIndex: null,
            isCurrentCorrect: null
          };
        });

        if (isPrefetch) {
          setQuestions(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = questionsWithChoices.filter((q: any) => !existingIds.has(q.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setQuestions(questionsWithChoices);
          setTotalQuestions(data.total || questionsWithChoices.length);
        }
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      if (!isPrefetch) setLoading(false);
    }
  }, [subject, unitFilter, searchParamsProps]);

  useEffect(() => {
    if (!paramsReady) return;
    const isYearMode = !!searchParamsProps?.year;
    const initialStart = (parseInt(setNum || '1') - 1) * parseInt(setSize || '30');
    const initialLimit = isYearMode ? 1000 : parseInt(setSize || '30');
    setLoading(true);
    fetchQuestions(initialStart, initialLimit);
  }, [paramsReady, setNum, setSize, fetchQuestions, searchParamsProps]);

  // 백그라운드 프리페칭 로직
  useEffect(() => {
    if (questions.length > 0 && currentIndex > questions.length - 8 && !loading) {
      // 다음 세트 번호 계산
      const currentLoadedCount = questions.length;
      const totalAvailable = totalQuestions;
      
      if (currentLoadedCount < totalAvailable) {
        const nextStart = currentLoadedCount;
        const limit = parseInt(setSize || '30');
        fetchQuestions(nextStart, limit, true);
      }
    }
  }, [currentIndex, questions.length, totalQuestions, loading, setSize, fetchQuestions]);

  const remapExplanation = (text: string, mapping: number[]) => {
    if (!text || !mapping) return text;
    
    // originalIndex -> newIndex 매핑 생성
    const origToNew: { [key: number]: number } = {};
    mapping.forEach((origIdx, newIdx) => {
      origToNew[origIdx] = newIdx;
    });

    const circledNumbers = ['①', '②', '③', '④', '⑤'];
    let result = text;

    // ① -> __NEW__0__ 형태로 임시 치환 (중복 치환 방지)
    circledNumbers.forEach((char, origIdx) => {
      const newIdx = origToNew[origIdx];
      if (newIdx !== undefined) {
        result = result.replace(new RegExp(char, 'g'), `__NEW__${newIdx}__`);
      }
    });

    // 1번 -> __NEWNUM__1__ 형태로 임시 치환
    [1, 2, 3, 4, 5].forEach((num, idx) => {
      const origIdx = idx;
      const newIdx = origToNew[origIdx];
      if (newIdx !== undefined) {
        result = result.replace(new RegExp(`${num}번`, 'g'), `__NEWNUM__${newIdx + 1}__`);
      }
    });

    // 정답: 1 -> __ANSWER__1__ 형태로 임시 치환
    [1, 2, 3, 4, 5].forEach((num, idx) => {
      const origIdx = idx;
      const newIdx = origToNew[origIdx];
      if (newIdx !== undefined) {
        result = result.replace(new RegExp(`정답\\s*:\\s*${num}`, 'g'), `__ANSWER__${newIdx + 1}__`);
      }
    });

    // 최종적으로 새 번호로 확정
    circledNumbers.forEach((char, newIdx) => {
      result = result.replace(new RegExp(`__NEW__${newIdx}__`, 'g'), char);
      result = result.replace(new RegExp(`__NEWNUM__${newIdx + 1}__`, 'g'), `${newIdx + 1}번`);
    });
    [1, 2, 3, 4, 5].forEach((num) => {
      result = result.replace(new RegExp(`__ANSWER__${num}__`, 'g'), `정답: ${num}`);
    });

    return result;
  };

  const currentQuestion = questions[currentIndex];
  const isAnswered = currentQuestion?.selectedIndex !== null && currentQuestion?.selectedIndex !== undefined;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (choiceIndex: number) => {
    // 이미 답을 선택한 경우(최초 응답)에는 어떤 동작도 하지 않음 (수정 불가)
    if (currentQuestion?.selectedIndex !== null && currentQuestion?.selectedIndex !== undefined) return;
    
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
    setLastActionTime(Date.now());

    // 콤보 및 점진적 축포 로직 (도파민 제어)
    if (isCorrect) {
      const newCombo = currentCombo + 1;
      setCurrentCombo(newCombo);
      if (newCombo >= nextConfettiThreshold) {
        triggerConfetti(true); // 미니 폭죽 모드
        // 임계값 상향: 3 -> 7 -> 12 -> 20 -> 30 ...
        setNextConfettiThreshold(prev => {
          if (prev === 3) return 7;
          if (prev === 7) return 12;
          if (prev === 12) return 20;
          return prev + 10;
        });
      }
    } else {
      setCurrentCombo(0); // 틀리면 콤보 리셋
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (!isAnswered && currentQuestion?.shuffledOptions?.[idx]) {
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
      setLastActionTime(Date.now());
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNextSet = () => {
    if (!setNum) return;
    const nextSet = parseInt(setNum) + 1;
    // URL 변경 후 강제 새로고침으로 데이터 리로드 보장
    const nextUrl = `/study/${params.subject}?unit=${encodeURIComponent(unitFilter || '')}&set=${nextSet}&size=${setSize || '30'}`;
    window.location.href = nextUrl;
  };

  const handleNext = () => {
    if (!isAnswered) return;
    setLastActionTime(Date.now());
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  // 축포 효과 (도파민 유도)
  const triggerConfetti = (isCombo = false) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      const confetti = (window as any).confetti;
      const count = isCombo ? 150 : 500; // 콤보일 때는 가볍게, 완료 시엔 화려하게
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      if (isCombo) {
        // 콤보용 심플 폭죽
        fire(0.25, { spread: 40, startVelocity: 35 });
        fire(0.2, { spread: 80 });
      } else {
        // 세트 완료용 화려한 폭죽
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      }
    };
    document.head.appendChild(script);
  };

  const handleFinish = async () => {
    setIsFinished(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const correctCount = answers.filter(a => a.isCorrect).length;
        const accuracy = Math.round((correctCount / questions.length) * 100);
        
        // 1. 가변적 보상 멘트 선정 (도파민 유도)
        const praises = [
          "와우! 뇌가 실시간으로 섹시해지고 있어요! 🔥",
          "당신은 천재인가요? 이 기세면 무조건 합격입니다! 🏆",
          "합격의 기운이 여기까지 느껴집니다! 웅장해지네요... ✨",
          "이건 사람이 아니라 AI 아닌가요? 완벽합니다! 🤖",
          "오늘 공부량 실화인가요? 역사에 기록될 열정입니다! 📚",
          "전설적인 집중력입니다! 집중력의 화신이시네요! 🧘",
          "미친 속도! 미친 정답률! 당신이 바로 듀기고의 주인공! 🌟"
        ];
        const discouragements = [
          "아까워요! 하지만 이 실패가 당신을 더 강하게 만들 거예요! 💪",
          "함정에 살짝 빠졌을 뿐입니다. 실제 시험에선 절대 안 틀리겠네요! 🛡️",
          "오답은 '지식의 비료'입니다. 지금 당신의 뇌가 무럭무럭 자라는 중! 🌱",
          "괜찮아요! 에디슨도 수만 번 틀렸답니다. 한 걸음 더 전진! 🚶",
          "오히려 좋아! 이 문제를 정복하면 당신의 실력은 2배가 됩니다! ⚡"
        ];

        const isGoodJob = accuracy >= 60;
        const randomPraise = isGoodJob 
          ? praises[Math.floor(Math.random() * praises.length)]
          : discouragements[Math.floor(Math.random() * discouragements.length)];
        
        // 2. 경험치 계산 (문제당 10XP + 틀려도 3XP 보상)
        const wrongCount = questions.length - correctCount;
        const gainedExp = (correctCount * 10) + (wrongCount * 3) + (accuracy >= 80 ? 100 : 50);
        
        // 3. 레벨 계산용 이전 정보
        const currentExp = userProfile?.exp_points || 0;
        const oldLevel = Math.floor(currentExp / 1000) + 1;
        const newLevel = Math.floor((currentExp + gainedExp) / 1000) + 1;
        
        // 4. DB 업데이트 (로그 저장 & 경험치 추가 & 오답 저장)
        const wrongQuestions = answers.filter(a => !a.isCorrect).map(a => ({
          user_id: userData.user.id,
          question_id: a.questionId,
          subject: subject,
          unit: unitFilter,
          set_num: setNum ? parseInt(setNum) : null,
          created_at: new Date().toISOString()
        }));

        await Promise.all([
          supabase.from('dukigo_study_logs').insert({
            user_id: userData.user.id,
            action_type: 'set_complete',
            subject: subject,
            unit: unitFilter,
            set_num: setNum ? parseInt(setNum) : null,
            total_questions: questions.length,
            correct_questions: correctCount,
            duration_seconds: Math.max(1, Math.floor((lastActionTime - startTime) / 1000)),
            end_time: new Date().toISOString()
          }).then(({ error }) => {
            if (error) console.error('Study log insert error:', error.message);
          }),
          // 오답 저장
          wrongQuestions.length > 0 ? supabase.from('dukigo_wrong_answers').upsert(wrongQuestions) : Promise.resolve(),
          // 경험치 누적
          supabase.rpc('increment_exp', { user_id: userData.user.id, amount: gainedExp })
            .then(({ error }) => {
              if (error) {
                return supabase.from('dukigo_profiles')
                  .update({ exp_points: currentExp + gainedExp })
                  .eq('id', userData.user.id);
              }
            })
        ]);

        // 5. 모달 상태 설정
        setLastGainedExp(gainedExp);
        setPraiseMessage(randomPraise);
        setAccuracyScore(accuracy);
        setPrevLevel(oldLevel);
        setCurrentLevel(newLevel);
        
        if (accuracy >= 60) {
          triggerConfetti();
        }

        // 레벨업 여부에 따라 순차적으로 모달 표시
        setIsFinished(true);
        if (newLevel > oldLevel) {
          setShowLevelUp(true);
        } else {
          setShowResultModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to save study log:', err);
    }
  };

  const renderMath = (text: string) => {
    if (!text) return '';
    // 선택지 번호(1., ①, (1)) 제거를 위한 정규식 추가
    const cleanText = text.replace(/^(\d+\.|①|②|③|④|⑤|\(\d+\))\s*/, '').replace(/\*\*/g, '');
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
        <div className="text-lg md:text-2xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">
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
        <div className="text-lg md:text-2xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">
          <span>{renderMath(questionPart)}</span>
          {codePart && (
            <div className="my-6 p-5 md:p-8 bg-[#f8fafc] border-2 border-slate-200 rounded-3xl text-left overflow-x-auto shadow-inner">
              <pre className="font-mono text-sm md:text-xl text-slate-800 whitespace-pre-wrap leading-relaxed">{codePart}</pre>
            </div>
          )}
        </div>
      );
    }
    
    return <h2 className="text-lg md:text-2xl font-bold text-slate-900 leading-[1.6] md:leading-[1.4] word-break-keep-all">{renderMath(text)}</h2>;
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
            {answers.filter(a => !a.isCorrect).length > 0 && (
              <button 
                onClick={() => {
                  const wrongIds = new Set(answers.filter(a => !a.isCorrect).map(a => a.questionId));
                  const wrongQuestions = questions.filter(q => wrongIds.has(q.id || ''));
                  if (wrongQuestions.length === 0) return;
                  setQuestions(wrongQuestions.map(q => ({ ...q, selectedIndex: null, isCurrentCorrect: undefined })));
                  setAnswers([]);
                  setCurrentIndex(0);
                  setIsFinished(false);
                  setLastActionTime(Date.now());
                }} 
                className="py-5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 font-black text-lg hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> 틀린 문제 다시 풀기 ({answers.filter(a => !a.isCorrect).length}문제)
              </button>
            )}
            {setNum && <button onClick={handleNextSet} className="py-5 rounded-2xl bg-brand-600 text-white font-black text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2">다음 세트 <ChevronRight className="w-5 h-5" /></button>}
            <button onClick={() => router.push(`/select-unit/${encodeURIComponent(subject)}`)} className={`py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 ${!setNum ? 'col-span-1' : 'md:col-span-2'}`}><Home className="w-5 h-5" /> 단원 선택으로</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-slate-800">
      <div className="mesh-bg" />
      <nav className="sticky top-0 z-50 px-4 py-2 glass-card border-none bg-white/40 backdrop-blur-md flex justify-between items-center h-12 md:h-20 md:px-8 md:py-4">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button 
            onClick={() => router.push(`/select-unit/${params.subject}`)} 
            className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white/40 backdrop-blur-md rounded-2xl hover:bg-white hover:text-brand-600 active:scale-90 transition-all text-slate-600 shadow-sm border border-white/40"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          {(unitFilter && setNum && !isSummaryError) && (
            <button 
              onClick={() => {
                if (slideData && slideData.length > 0) {
                  setCurrentSlideIdx(0);
                  setAiSliderOpen(true);
                } else if (isSummaryError) {
                  setRetryCount(prev => prev + 1);
                } else if (isGenerating) {
                  alert('AI 선생님이 30문항을 꼼꼼히 분석 중입니다. 잠시만 더 기다려 주세요! ✨');
                }
              }} 
              className={`group relative px-3 py-1.5 md:px-6 md:py-2.5 rounded-2xl text-xs md:text-base font-black transition-all flex items-center gap-2 shadow-lg backdrop-blur-xl border border-white/40 overflow-hidden ${
                slideData && slideData.length > 0 
                ? 'bg-white/30 text-brand-700 hover:bg-white/50 hover:scale-105 active:scale-95' 
                : 'bg-slate-100/50 text-slate-400 cursor-wait'
              }`}
            >
              {isGenerating && !slideData && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${summaryProgress}%` }}
                  className="absolute inset-0 bg-brand-500/20"
                  transition={{ ease: "linear" }}
                />
              )}
              <Sparkles className={`w-3.5 h-3.5 md:w-5 md:h-5 ${slideData && slideData.length > 0 ? 'text-brand-600 animate-pulse' : 'text-slate-400'}`} />
              <span className="relative z-10">
                {slideData && slideData.length > 0 
                  ? '학습' 
                  : isSummaryError
                    ? '재시도'
                    : isGenerating 
                      ? `${Math.round(summaryProgress)}%` 
                      : '준비중'}
              </span>
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center px-4">
          <span className="text-[10px] md:text-xl font-black tracking-tight text-slate-800 uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-none">
            {unitFilter ? `${unitFilter}${setNum ? ` · 세트 ${setNum}` : ''}` : `${subject} 기출학습`}
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-8 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-2xl font-black text-slate-900 bg-white/30 px-4 py-2 rounded-2xl border border-white/40 backdrop-blur-md">
            <BarChart3 className="w-6 h-6 text-brand-500" /> {currentIndex + 1} / {questions.length}
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-xl border border-white/40 shadow-sm">
              <ShieldCheck className="w-3 h-3 md:w-5 md:h-5 text-brand-600" />
              <span className="text-[10px] md:text-sm font-black text-slate-800">
                {userProfile ? (LEVEL_TITLES[Math.min(11, Math.floor((userProfile.exp_points || 0) / 1000))] || "입문자") : "입문자"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-xl border border-white/40 shadow-sm">
              <Thermometer className="w-3 h-3 md:w-5 md:h-5 text-rose-500" />
              <span className="text-[10px] md:text-sm font-black text-slate-800">
                {userProfile ? Math.min(100, (userProfile.current_temp || 0) + 36.5).toFixed(1) : "36.5"}°C
              </span>
            </div>
          </div>
        </div>
      </nav>
      <div className="w-full h-1 bg-white/20">
        <motion.div animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-brand-600 to-cyan-400 shadow-[0_0_10px_rgba(99,91,255,0.4)]" />
      </div>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-[15%] py-2 pb-32 md:py-8 md:pb-8 flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          {!currentQuestion ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center glass-card rounded-[3rem]">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6"><X className="w-10 h-10 text-slate-400" /></div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">문제를 찾을 수 없습니다</h2>
              <p className="text-slate-500 mb-8">해당 단원에 등록된 문제가 없거나 분류 중입니다.</p>
              <button onClick={() => router.push('/select-subject')} className="px-8 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">과목 선택으로 돌아가기</button>
            </motion.div>
          ) : (
            <motion.div key={currentIndex} custom={direction} initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="flex-1 flex flex-col gap-4 md:gap-6">
              <div className="space-y-4 md:space-y-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 md:px-4 md:py-1.5 bg-brand-50 text-brand-600 text-[10px] md:text-base font-black tracking-widest rounded-full uppercase">
                    Q. {currentQuestion.year || '0000'}-{currentQuestion.round || '00'}-{currentQuestion.question_num || currentQuestion.number || '0'}
                  </span>
                  {currentQuestion.frequency > 1 && (
                    <motion.span 
                      initial={{ scale: 0, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }}
                      className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-sm font-black flex items-center gap-1.5 shadow-sm border ${
                        currentQuestion.frequency >= 5 
                          ? 'bg-amber-500 text-white border-amber-400' 
                          : currentQuestion.frequency >= 3 
                            ? 'bg-slate-600 text-white border-slate-500' 
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                      }`}
                    >
                      <Zap className={`w-3 h-3 md:w-4 md:h-4 ${currentQuestion.frequency >= 5 ? 'animate-pulse' : ''}`} />
                      {currentQuestion.frequency}회 출제
                    </motion.span>
                  )}
                  <div className="h-px flex-1 bg-brand-100/50" />
                </div>
                {renderQuestionText(currentQuestion.question)}
              </div>

              {(() => {
                const imgName = currentQuestion.image || currentQuestion.question_img;
                if (!imgName) return null;
                
                let imgSrc = imgName;
                if (!imgName.startsWith('/') && !imgName.startsWith('http')) {
                  if (imgName.startsWith('history_')) {
                    imgSrc = `/summaries/한국사검정시험/${imgName}`;
                  } else if (imgName.startsWith('lit2_')) {
                    imgSrc = `/summaries/컴퓨터활용능력 2급/${imgName}`;
                  } else if (imgName.startsWith('vis_') || subject.includes('시각디자인') || subject.includes('색채학')) {
                    imgSrc = `/summaries/시각디자인산업기사/${imgName}`;
                  } else if (imgName.startsWith('ae_') || subject.includes('자동화설비') || subject.includes('생산자동화')) {
                    imgSrc = `/images/subjects/자동화설비(생산자동화)기능사/${imgName}`;
                  } else {
                    // 정보처리기능사 모의고사(2026년) 및 Mock 폴더 처리
                    const year = currentQuestion.year;
                    const round = currentQuestion.round;
                    
                    if (year === 2026 || imgName.includes('_Mock_')) {
                      const mockRound = round || (imgName.match(/Mock_(\d+)/) || [])[1] || '01';
                      imgSrc = `/images/exams/Mock_${mockRound}/${imgName}`;
                    } else if (year && round) {
                      imgSrc = `/images/exams/${year}_${round}/${imgName}`;
                    } else {
                      // 연도/회차 정보가 없는 경우 이미지 이름에서 유추 시도
                      const match = imgName.match(/(\d{4})_(\d{2})/) || imgName.match(/Mock_(\d+)/);
                      if (match) {
                        const folder = match[0].includes('Mock') ? match[0] : `${match[1]}_${match[2]}`;
                        imgSrc = `/images/exams/${folder}/${imgName}`;
                      }
                    }
                  }
                }

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-white/50 p-4 md:p-6 rounded-[2rem] border border-white/60 shadow-sm flex justify-center empty:hidden"
                    id={`img-container-${currentIndex}`}
                  >
                    <img 
                      src={imgSrc} 
                      alt="Question Diagram" 
                      className="max-h-[200px] md:max-h-[300px] object-contain rounded-xl"
                      onError={(e) => { 
                        (e.target as HTMLElement).style.display = 'none'; 
                        const container = document.getElementById(`img-container-${currentIndex}`);
                        if (container) container.style.display = 'none';
                      }}
                    />
                  </motion.div>
                );
              })()}

              {/* 선택지 */}
              <div className="grid grid-cols-1 gap-4 md:gap-8 mt-8">
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
                      <span className="text-base md:text-xl font-bold flex-1 leading-relaxed flex flex-col gap-3">
                        {choice.endsWith('.webp') ? (
                          <div className="flex justify-center py-2">
                            <img 
                              src={choice.startsWith('/') ? choice : (choice.startsWith('history_') ? `/summaries/한국사검정시험/${choice}` : (choice.startsWith('lit2_') ? `/summaries/컴퓨터활용능력 2급/${choice}` : choice))} 
                              alt={`Choice ${idx + 1}`}
                              className="max-h-[140px] md:max-h-[250px] object-contain rounded-xl"
                              onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {currentQuestion.shuffledChoiceImgs?.[idx] && (
                              <div className="flex justify-center py-1">
                                <img 
                                  src={`/images/subjects/자동화설비(생산자동화)기능사/${currentQuestion.shuffledChoiceImgs[idx]}`}
                                  alt={`Choice Image ${idx + 1}`}
                                  className="max-h-[120px] md:max-h-[200px] object-contain rounded-lg border border-slate-100 p-1 bg-white"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              </div>
                            )}
                            {renderMath(choice)}
                          </div>
                        )}
                        {choice.includes('그림') && (
                          <img 
                            src={`/images/exams/${currentQuestion.year}_${currentQuestion.round}/${currentQuestion.year}_${currentQuestion.round}_${currentQuestion.number || currentQuestion.question_num}_choice${(currentQuestion.shuffledOptionsIdx?.[idx] ?? idx) + 1}.webp`} 
                            alt={`Choice ${idx + 1}`}
                            className="max-h-[140px] md:max-h-[180px] object-contain rounded-xl border border-slate-200/60 p-2 bg-white/80 shadow-sm"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                      </span>
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
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 md:mt-4 rounded-3xl overflow-hidden border-2 ${currentQuestion.isCurrentCorrect ? 'border-emerald-200' : 'border-rose-200'} bg-white shadow-xl shadow-black/5`}>
                    <div className={`px-6 py-4 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${currentQuestion.isCurrentCorrect ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
                      <div className="flex items-center gap-4">
                        {currentQuestion.isCurrentCorrect && (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
                          </div>
                        )}
                        <div>
                          {currentQuestion.isCurrentCorrect ? (
                            (() => {
                              const praises = [
                                "완벽하게 이해하셨네요 👏",
                                "대단해요! 아주 정확합니다 🎯",
                                "훌륭합니다! 💯",
                                "정확해요! 이 기세로 계속 가봐요 🚀",
                                "정말 잘하셨어요! 🌟",
                                "완벽해요! 핵심을 찌르셨네요 ✨",
                                "대정답! 찰떡같이 맞추셨네요 🎉",
                                "아주 좋아요! 개념이 꽉 잡혀있네요 👍",
                                "최고예요! 폼 미쳤다 🤩",
                                "정답입니다! 승강기 마스터가 눈앞에 🏆"
                              ];
                              const praiseText = praises[currentIndex % praises.length];
                              return (
                                <>
                                  <h4 className="text-xl md:text-2xl font-black mb-1 text-emerald-700">정답입니다!</h4>
                                  <p className="text-sm md:text-base font-bold text-emerald-600">{praiseText}</p>
                                </>
                              );
                            })()
                          ) : (
                            <p className="text-xl md:text-3xl font-black text-rose-700 py-1 md:py-2 leading-relaxed word-break-keep-all">
                              정답은 [ {currentQuestion.correctShuffledIndex !== -1 ? `${currentQuestion.correctShuffledIndex + 1}번. ${currentQuestion.shuffledOptions[currentQuestion.correctShuffledIndex]}` : '데이터 오류'} ] 입니다. 💪
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentQuestion.explanation && (
                      <div className="p-6 md:p-8 bg-white border-t border-slate-100">
                        <p className="text-xs md:text-base font-black uppercase tracking-widest text-slate-900 mb-1.5">해설</p>
                        <div className="space-y-0.5 explanation-table">
                          {currentQuestion.explanation.includes('<table') ? (
                            <div dangerouslySetInnerHTML={{ __html: remapExplanation(currentQuestion.explanation, currentQuestion.shuffledOptionsIdx) }} />
                          ) : (
                            remapExplanation(currentQuestion.explanation, currentQuestion.shuffledOptionsIdx)
                              .split('\n')
                              .map((line: string, i: number) => (
                                <p key={i} className="leading-relaxed text-sm md:text-xl font-bold">{renderMath(line)}</p>
                              ))
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
          )}
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
              className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh] relative border border-white/20"
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
              <div className="flex-1 overflow-y-auto px-6 md:px-20 py-4 md:py-8 relative select-none">
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
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center w-full max-w-5xl min-h-full"
                  >
                    {/* 좌측: 거대한 비주얼 영역 */}
                    <div className="md:col-span-5 flex justify-center items-center relative h-48 md:h-80 w-full">
                      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 rounded-full blur-3xl" />
                      <div 
                        style={{ animation: 'float 3s ease-in-out infinite' }} 
                        className="flex justify-center items-center drop-shadow-2xl select-none w-full h-full"
                      >
                        {slideData[currentSlideIdx].image ? (
                          <img 
                            src={slideData[currentSlideIdx].image} 
                            alt={slideData[currentSlideIdx].title}
                            onError={(e) => {
                              // 이미지 로드 실패 시 이미지 필드를 제거하여 이모지가 나오도록 함
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const emojiSpan = document.createElement('span');
                                emojiSpan.className = "text-8xl md:text-[10rem]";
                                emojiSpan.innerText = slideData[currentSlideIdx].emoji || "✨";
                                parent.appendChild(emojiSpan);
                              }
                            }}
                            className="max-h-[180px] md:max-h-[300px] max-w-full object-cover rounded-[2rem] shadow-2xl border-4 border-white/80"
                          />
                        ) : (
                          <span className="text-8xl md:text-[10rem]">{slideData[currentSlideIdx].emoji || "✨"}</span>
                        )}
                      </div>
                    </div>

                    {/* 우측: 핵심 텍스트 영역 */}
                    <div className="md:col-span-7 flex flex-col justify-center text-center md:text-left space-y-4 md:space-y-6">
                      <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug word-break-keep-all">
                        {slideData[currentSlideIdx].title}
                      </h2>
                      <p className="text-base md:text-xl font-bold text-slate-600 leading-relaxed md:leading-loose word-break-keep-all">
                        {slideData[currentSlideIdx].content?.replaceAll('**', '')}
                      </p>
                      {slideData[currentSlideIdx].exam_point && (
                        <div className="p-4 md:p-5 bg-amber-50/80 rounded-[1.5rem] border-2 border-amber-200/50 text-amber-950 self-center md:self-start w-full shadow-sm flex flex-col gap-1 md:gap-2 text-left">
                          <span className="text-xs md:text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                            📌 기출 공략 포인트 (시험 출제 기준)
                          </span>
                        <div className="text-base md:text-xl font-bold leading-relaxed word-break-keep-all space-y-2">
                          {slideData[currentSlideIdx].exam_point?.split('\n').map((line: string, i: number) => {
                            if (line.trim().startsWith('- ')) {
                              return <div key={i} className="flex gap-2 pl-2"><span className="text-amber-500">•</span><span>{line.trim().slice(2).replaceAll('**', '')}</span></div>;
                            }
                            return <p key={i}>{line.replaceAll('**', '')}</p>;
                          })}
                        </div>
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

                {slideData && currentSlideIdx < slideData.length - 1 && (
                  <button 
                    onClick={() => setCurrentSlideIdx(prev => prev + 1)}
                    className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-all shadow-lg shadow-brand-500/30"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}
              </div>

              {/* 하단 페이지네이션 인디케이터 */}
              <div className="px-6 py-4 md:px-10 md:py-8 border-t border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex gap-1.5 md:gap-2">
                    {slideData.map((_, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCurrentSlideIdx(i)}
                        className={`h-1.5 md:h-2 rounded-full transition-all cursor-pointer ${i === currentSlideIdx ? 'w-6 md:w-10 bg-brand-600' : 'w-1.5 md:w-2 bg-slate-200 hover:bg-slate-300'}`}
                      />
                    ))}
                  </div>
                  <div className="hidden md:block text-xs font-bold text-slate-400">
                    <span className="text-slate-900 font-black">{currentSlideIdx + 1}</span> / {slideData.length}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      checked={hideAutoSummary}
                      onChange={(e) => {
                        const hideKey = `dugigo_hide_summary_${subject}_${unitFilter}_${setNum}`;
                        localStorage.setItem(hideKey, e.target.checked ? 'true' : 'false');
                        setHideAutoSummary(e.target.checked);
                      }}
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">공부 시작 시 자동으로 열지 않기</span>
                  </label>
                  <button 
                    onClick={() => setAiSliderOpen(false)}
                    className="px-6 py-3 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 transition-all active:scale-95 text-sm"
                  >
                    공부 시작하기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
