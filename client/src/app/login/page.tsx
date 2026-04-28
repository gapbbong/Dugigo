'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, AlertCircle, GraduationCap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const AUTO_LOGIN_KEY = 'dugigo_auto_login';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [autoLogin, setAutoLogin] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [findMode, setFindMode] = useState<'none' | 'id' | 'pw'>('none');
  const [findEmail, setFindEmail] = useState('');

  useEffect(() => {
    // 기존 평문 비밀번호 정리
    localStorage.removeItem('auto_login_email');
    localStorage.removeItem('auto_login_pw');

    // 자동로그인 설정 불러오기
    const savedAutoLogin = localStorage.getItem(AUTO_LOGIN_KEY) === 'true';
    setAutoLogin(savedAutoLogin);

    // 자동로그인이 켜져 있고 유효한 세션이 있으면 바로 이동
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && savedAutoLogin) {
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

      // 자동로그인 설정 저장
      if (autoLogin) {
        localStorage.setItem(AUTO_LOGIN_KEY, 'true');
      } else {
        localStorage.removeItem(AUTO_LOGIN_KEY);
      }

      setStatus({ type: 'success', message: '환영합니다! 곧 이동합니다.' });
      setTimeout(() => router.push('/select-subject'), 700);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || '로그인에 실패했습니다.' });
    }
  };

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
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">두기고<span className="text-brand-600">+</span></h1>
            <p className="text-slate-500 font-bold text-sm tracking-tight text-center"><span className="text-brand-600">두</span>꺼운 <span className="text-brand-600">기</span>능사 책 대신 <span className="text-brand-600">고</span>득점 비결</p>
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
                  className="w-full btn-primary font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 group mt-4 h-16 disabled:opacity-70"
                >
                  {status.type === 'loading' ? '확인 중...' : '로그인'} 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 자동로그인 체크박스 */}
                <label className="flex items-center gap-3 cursor-pointer px-1 group select-none">
                  <div
                    onClick={() => setAutoLogin(v => !v)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0
                      ${autoLogin 
                        ? 'bg-brand-600 border-brand-600 shadow-sm shadow-brand-500/30' 
                        : 'bg-white border-slate-300 group-hover:border-brand-400'
                      }`}
                  >
                    {autoLogin && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <span 
                    onClick={() => setAutoLogin(v => !v)}
                    className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors"
                  >
                    자동 로그인
                  </span>
                  {autoLogin && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full"
                    >
                      ON
                    </motion.span>
                  )}
                </label>
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

          <div className="mt-10 text-center pt-8 border-t border-slate-100">
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
