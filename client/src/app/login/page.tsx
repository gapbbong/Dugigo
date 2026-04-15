'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, AlertCircle, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    // 기존에 평문으로 저장된 비밀번호 제거 (보안 정리)
    localStorage.removeItem('auto_login_email');
    localStorage.removeItem('auto_login_pw');

    // 이미 세션이 있으면 바로 이동
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/select-subject');
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) return;

    setStatus({ type: 'loading', message: '접속 권한을 확인하고 있습니다...' });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus({ type: 'success', message: '환영합니다! 곧 대시보드로 이동합니다.' });
      // 세션 저장 후 이동 (supabase가 세션을 LocalStorage에 쓸 시간 확보)
      setTimeout(() => router.push('/select-subject'), 800);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || '로그인에 실패했습니다.' });
    }
  };

  const [findMode, setFindMode] = useState<'none' | 'id' | 'pw'>('none');
  const [findEmail, setFindEmail] = useState('');

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 text-slate-800 overflow-hidden font-sans">
      <div className="mesh-bg" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass-card rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">DugiGo<span className="text-brand-600">+</span></h1>
            <p className="text-slate-500 font-bold text-sm tracking-tight text-center">전기기능사 합격의 지름길, 두기고 플러스</p>
          </div>

          <AnimatePresence mode="wait">
            {findMode === 'none' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin} 
                className="space-y-5"
              >
                <div className="space-y-4">
                  <InputGroup 
                    icon={<Mail className="w-5 h-5" />} 
                    type="email" 
                    placeholder="이메일 주소" 
                    value={formData.email}
                    onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <InputGroup 
                    icon={<Lock className="w-5 h-5" />} 
                    type="password" 
                    placeholder="비밀번호" 
                    value={formData.password}
                    onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="flex justify-between items-center text-xs px-2">
                  <button type="button" onClick={() => setFindMode('id')} className="text-slate-400 font-bold hover:text-brand-600 transition-colors">아이디 찾기</button>
                  <button type="button" onClick={() => setFindMode('pw')} className="text-slate-400 font-bold hover:text-brand-600 transition-colors">비밀번호 찾기</button>
                </div>

                <StatusDisplay status={status} />

                <button
                  disabled={status.type === 'loading'}
                  className="w-full btn-primary font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 group mt-4 h-16"
                >
                  {status.type === 'loading' ? '확인 중...' : '로그인'} 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="find"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    {findMode === 'id' ? '아이디 찾기' : '비밀번호 재설정'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">등록된 이메일 주소를 입력해 주세요.</p>
                </div>

                <InputGroup 
                  icon={<Mail className="w-5 h-5" />} 
                  type="email" 
                  placeholder="이메일 주소" 
                  value={findEmail}
                  onChange={(e: any) => setFindEmail(e.target.value)}
                />

                <StatusDisplay status={status} />

                <div className="flex gap-4">
                  <button
                    onClick={() => { setFindMode('none'); setStatus({ type: 'idle', message: '' }); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-bold transition-all"
                  >
                    뒤로가기
                  </button>
                  <button
                    className="flex-1 btn-primary py-4 rounded-xl font-bold"
                  >
                    확인
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 text-center pt-8 border-t border-slate-100">
            <p className="text-slate-400 text-sm font-bold">
              아직 회원이 아니신가요?{' '}
              <Link href="/register" className="text-brand-600 hover:text-brand-700 font-black border-b-2 border-brand-100 hover:border-brand-600 transition-all ml-1">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusDisplay({ status }: any) {
  if (status.type === 'idle') return <div className="h-0" />;
  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
        status.type === 'error' ? 'bg-rose-50 text-rose-600' : 
        status.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
        'bg-brand-50 text-brand-600'
      }`}
    >
      <AlertCircle className="w-5 h-5 shrink-0" />
      {status.message}
    </motion.div>
  );
}

function InputGroup({ icon, ...props }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500/30 rounded-2xl py-5 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-bold shadow-sm"
      />
    </div>
  );
}
