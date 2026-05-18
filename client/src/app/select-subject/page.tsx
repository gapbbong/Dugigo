'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  ChevronRight,
  Loader2, 
  LogOut, 
  Zap, 
  Terminal, 
  ArrowUpDown,
  Palette,
  Monitor,
  History,
  Download,
  Share,
  PlusSquare,
  FolderPlus,
  Key,
  Lock,
  AlertCircle,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const getSubjectStyle = (name: string) => {
  if (name.includes('전기')) return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', hoverBg: 'group-hover:bg-amber-500' };
  if (name.includes('정보처리')) return { icon: Terminal, color: 'text-emerald-500', bg: 'bg-emerald-50', hoverBg: 'group-hover:bg-emerald-500' };
  if (name.includes('승강기')) return { icon: ArrowUpDown, color: 'text-violet-500', bg: 'bg-violet-50', hoverBg: 'group-hover:bg-violet-500' };
  if (name.includes('디자인')) return { icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50', hoverBg: 'group-hover:bg-pink-500' };
  if (name.includes('컴퓨터') || name.includes('컴활')) return { icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50', hoverBg: 'group-hover:bg-blue-500' };
  if (name.includes('한국사')) return { icon: History, color: 'text-rose-500', bg: 'bg-rose-50', hoverBg: 'group-hover:bg-rose-500' };
  if (name.includes('자동화설비') || name.includes('생산자동화')) return { icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', hoverBg: 'group-hover:bg-indigo-600' };
  return { icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50', hoverBg: 'group-hover:bg-brand-600' };
};

export default function SelectSubjectPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPopup, setShowIOSPopup] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [randomQuote, setRandomQuote] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [studentRank, setStudentRank] = useState<{ groupName: string, rank: number, total: number } | null>(null);

  // 비밀번호 변경 모달 상태
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ newPw: '', confirmPw: '' });
  const [pwStatus, setPwStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.newPw || pwForm.newPw.length < 6) {
      setPwStatus({ type: 'error', message: '새 비밀번호는 6글자 이상이어야 합니다.' });
      return;
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwStatus({ type: 'error', message: '새 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    setPwStatus({ type: 'loading', message: '비밀번호를 변경하고 있습니다...' });
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;

      setPwStatus({ type: 'success', message: '비밀번호가 성공적으로 변경되었습니다! 창을 닫습니다.' });
      setTimeout(() => {
        setShowPwModal(false);
        setPwForm({ newPw: '', confirmPw: '' });
        setPwStatus({ type: 'idle', message: '' });
      }, 1500);
    } catch (err: any) {
      console.error('[UPDATE_PW_ERROR]', err);
      setPwStatus({ type: 'error', message: err.message || '비밀번호 변경 중 오류가 발생했습니다.' });
    }
  };

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

    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase.from('dukigo_profiles').select('*').eq('id', currentUser.id).single();
      setUser({ ...currentUser, ...profile });

      if (profile?.role?.toLowerCase() === 'teacher' || currentUser.email === 'serv@kakao.com') {
        setIsTeacher(true);
        const { data: dbGroups } = await supabase
          .from('dukigo_teacher_groups')
          .select('*')
          .eq('teacher_id', currentUser.id);
        setGroups(dbGroups || []);
      } else {
        // 학생인 경우 소속 그룹 찾기 및 랭킹 계산
        const { data: myGroups } = await supabase
          .from('dukigo_teacher_groups')
          .select('*')
          .contains('members', [currentUser.id]);
        
        if (myGroups && myGroups.length > 0) {
          setGroups(myGroups);
          
          // 첫 번째 그룹 기준으로 랭킹 계산
          const targetGroup = myGroups[0];
          const memberIds = targetGroup.members || [];
          
          if (memberIds.length > 0) {
            const { data: membersProfiles } = await supabase
              .from('dukigo_profiles')
              .select('id, exp_points')
              .in('id', memberIds)
              .order('exp_points', { ascending: false });
            
            if (membersProfiles) {
              const myRank = membersProfiles.findIndex(p => p.id === currentUser.id) + 1;
              setStudentRank({
                groupName: targetGroup.name,
                rank: myRank,
                total: membersProfiles.length
              });
            }
          }
        }
      }

      const res = await fetch('/api/subjects');
      const data = await res.json();
      let fetchedSubjects = data.subjects || [];
      fetchedSubjects.sort((a: string, b: string) => {
        const getPriority = (name: string) => {
          if (name.includes('한국사')) return 100;
          if (name.includes('전기기사')) return 101;
          return 0;
        };
        
        const pa = getPriority(a);
        const pb = getPriority(b);
        
        if (pa !== pb) return pa - pb;
        return a.localeCompare(b, 'ko');
      });
      setSubjects(fetchedSubjects);
      setLoading(false);
    }
    init();
  }, [router]);

  const quotes = [
    "성공은 결과가 아니라 과정이다.",
    "오늘의 수고가 내일의 보석이 된다.",
    "노력은 결코 배신하지 않는다.",
    "할 수 있다고 믿는 사람은 결국 해낸다.",
    "가장 어두운 밤도 결국 지나가고 해는 뜬다.",
    "배움은 평생의 보물이다.",
    "천재는 1%의 영감과 99%의 노력으로 만들어진다.",
    "시작이 반이다. 지금 바로 시작하라.",
    "어제보다 나은 오늘을 만드는 것은 당신의 몫이다.",
    "인내는 쓰고 그 열매는 달다.",
    "포기하는 순간 시합은 종료된다.",
    "꿈을 꾸는 자만이 그 꿈을 이룰 수 있다.",
    "작은 습관이 모여 위대한 결과를 만든다.",
    "공부할 때의 고통은 잠깐이지만, 못 배운 고통은 평생이다.",
    "가장 큰 위험은 아무것도 하지 않는 것이다.",
    "실패는 성공으로 가는 과정일 뿐이다.",
    "오늘 걷지 않으면 내일은 뛰어야 한다.",
    "자신을 믿는 순간, 어떻게 살아야 할지 알게 된다.",
    "배운다는 것은 자기를 발견하는 과정이다.",
    "성공의 비결은 단 한 가지, 멈추지 않는 것이다.",
    "인생은 당신이 만드는 대로 흘러간다.",
    "배움에는 끝이 없다.",
    "최선을 다했다면 결과에 후회하지 마라.",
    "어려운 일일수록 더 큰 성취감을 준다.",
    "당신의 노력이 누군가에게는 희망이 된다.",
    "지금 흘리는 땀방울이 당신의 미래를 결정한다.",
    "두려워하지 말고 도전하라.",
    "매일매일 조금씩 성장하는 것에 집중하라.",
    "당신은 생각보다 훨씬 더 강한 사람이다.",
    "내일의 당신이 오늘의 당신에게 감사하게 하라."
  ];

  useEffect(() => {
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 text-brand-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-slate-900 pb-20">
      <div className="mesh-bg opacity-40" />
      
      {/* Header Area */}
      <header className="max-w-[1600px] mx-auto pt-6 md:pt-8 px-4 md:px-12 relative z-10">
        <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-[2rem] border border-white/60 shadow-sm relative">
          {/* Left Group */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap size={20} className="text-white" />
              </div>
              <h2 className="text-lg md:text-xl font-black tracking-tight">DugiGo</h2>
            </div>
            <div className="w-px h-4 bg-slate-200 mx-0.5 md:mx-1 opacity-50" />
            <span className="text-sm md:text-xl font-black text-brand-600 tracking-tighter whitespace-nowrap">
              경성전자고등학교
            </span>
          </div>

          {/* Right Group */}
          <div className="flex items-center gap-2 md:gap-4">
            {isTeacher && (
              <Link href="/teacher" className="text-sm md:text-base text-brand-500 hover:text-brand-700 font-black transition-all whitespace-nowrap bg-brand-50/50 hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100 shadow-sm">
                대시보드
              </Link>
            )}
            <button
              onClick={() => setShowPwModal(true)}
              className="text-xs md:text-sm text-slate-600 hover:text-brand-600 font-black transition-all px-2.5 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <Key size={15} className="text-brand-500" />
              비밀번호 변경
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1 md:mx-2" />
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
              className="text-sm md:text-base text-slate-400 hover:text-rose-500 font-black transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Slogan & Group Tags Row */}
        <div className="flex items-center justify-between gap-4 mt-6 px-2">
          <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
            <span className="text-blue-500">두</span>꺼운 <span className="text-emerald-500">기</span>능사 책 대신 <span className="text-rose-500">고</span>민말고 <span className="font-black text-slate-900">두기고</span>
          </p>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {isTeacher ? (
              groups.map(g => (
                <Link 
                  key={g.id} 
                  href="/teacher" 
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] md:text-sm font-black rounded-xl hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm whitespace-nowrap"
                >
                  {g.name}
                </Link>
              ))
            ) : (
              studentRank && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 text-[10px] md:text-sm font-black rounded-xl shadow-sm whitespace-nowrap">
                    📍 {studentRank.groupName}
                  </span>
                  <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] md:text-sm font-black rounded-xl shadow-sm whitespace-nowrap">
                    🏆 그룹 랭킹: {studentRank.rank}위 / {studentRank.total}명
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10 pt-6 md:pt-16">
        <div className="mb-10 md:mb-14 text-center md:text-left">
          <h1 className="text-3xl md:text-6xl font-black text-slate-900 italic mb-4 leading-tight tracking-tighter">"{randomQuote}"</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
            <p className="text-lg md:text-2xl font-bold text-slate-500 italic">
              환영합니다, <span className="text-brand-600 font-black">{user?.display_name || user?.email?.split('@')[0]}</span>님! 👋
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowGuide(true)}
                className="text-xs md:text-sm font-black text-brand-600 underline underline-offset-4 hover:text-brand-700 transition-all"
              >
                홈 화면에 추가 방법
              </button>
            </div>
          </div>
        </div>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {subjects.map((subject, index) => {
            const style = getSubjectStyle(subject);
            const Icon = style.icon;
            return (
              <motion.div 
                key={subject} 
                onClick={() => router.push(`/select-unit/${encodeURIComponent(subject)}`)} 
                className="group glass-card px-5 py-4 md:px-8 md:py-10 rounded-2xl md:rounded-[2.5rem] cursor-pointer relative overflow-hidden flex items-center gap-4 md:gap-6 hover:shadow-2xl transition-all border border-white/60 active:scale-[0.98]"
                whileHover={{ y: -5 }}
              >
                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all ${style.bg} ${style.color} group-hover:bg-brand-600 group-hover:text-white shadow-inner`}>
                  <Icon size={20} className="md:hidden" />
                  <Icon size={28} className="hidden md:block" />
                </div>
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                  <span className="text-slate-900 font-black italic text-base md:text-xl">{index + 1}.</span>
                  <h3 className="text-base md:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                    {subject}
                  </h3>
                </div>
                <ChevronRight className="ml-auto text-slate-200 group-hover:text-brand-400 group-hover:translate-x-2 transition-all flex-shrink-0" size={20} />
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-10 text-slate-400 text-[10px] md:text-sm font-medium border-t border-slate-100 mt-16">
        <p>© 2026 DugiGo Smart License Solution.</p>
        <p className="font-black uppercase tracking-widest text-slate-500 mt-1 text-[13px] md:text-[17px]">경성전자고등학교 전용 학습 서비스</p>
      </footer>

      {/* Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuide(false)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[3rem] p-8 md:p-12 shadow-2xl flex flex-col gap-6 text-slate-900 border-t border-brand-100 max-h-[90vh] overflow-y-auto">
              <div className="w-16 h-2 bg-slate-100 rounded-full self-center mb-4" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-3xl font-black text-brand-600">홈 화면에 추가 가이드</h3>
                <p className="text-slate-500 font-bold">앱처럼 편하게 접속해 보세요!</p>
              </div>

              <div className="space-y-8 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">1</div>
                    <h4 className="text-xl font-black">안드로이드 (크롬 브라우저)</h4>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3 font-bold text-slate-600">
                    <p>1. 브라우저 우측 상단의 <span className="text-slate-900">점 3개(⋮)</span> 메뉴를 누릅니다.</p>
                    <p>2. <span className="text-brand-600">"홈 화면에 추가"</span> 또는 <span className="text-brand-600">"앱 설치"</span>를 선택합니다.</p>
                    <p>3. 팝업창에서 '추가'를 누르면 완료!</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-black">2</div>
                    <h4 className="text-xl font-black">아이폰 (사파리 브라우저)</h4>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3 font-bold text-slate-600">
                    <p>1. 브라우저 하단 중앙의 <span className="text-slate-900">공유(Square with arrow)</span> 아이콘을 누릅니다.</p>
                    <p>2. 리스트를 아래로 내려 <span className="text-brand-600">"홈 화면에 추가"</span>를 선택합니다.</p>
                    <p>3. 우측 상단의 '추가'를 누르면 완료!</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowGuide(false)} className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl transition-all text-xl mt-6 shadow-lg shadow-brand-600/20">확인했습니다</button>
            </motion.div>
          </>
        )}

        {/* 비밀번호 변경 모달 */}
        {showPwModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowPwModal(false)} 
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[440px] bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 text-slate-900"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-black">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900">비밀번호 변경</h3>
                    <p className="text-xs font-bold text-slate-400">안전한 계정 관리를 위해 비밀번호를 재설정하세요</p>
                  </div>
                </div>
                <button onClick={() => setShowPwModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 pl-1">새 비밀번호 <span className="text-rose-500 font-bold">(6자 이상)</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                    <input
                      type="password"
                      placeholder="새로운 비밀번호 입력"
                      value={pwForm.newPw}
                      onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500/30 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 pl-1">새 비밀번호 확인</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                    <input
                      type="password"
                      placeholder="비밀번호 다시 입력"
                      value={pwForm.confirmPw}
                      onChange={e => setPwForm({ ...pwForm, confirmPw: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500/30 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                {pwStatus.type !== 'idle' && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${pwStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : pwStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'}`}>
                    <AlertCircle size={16} className="shrink-0" />
                    {pwStatus.message}
                  </motion.div>
                )}

                <button
                  disabled={pwStatus.type === 'loading'}
                  className="w-full btn-primary font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 h-14 text-sm shadow-lg shadow-brand-500/20 disabled:opacity-70"
                >
                  {pwStatus.type === 'loading' ? '변경 중...' : '비밀번호 변경 확정'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
