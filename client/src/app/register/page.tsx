'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User, Mail, Lock, ArrowRight, AlertCircle, KeyRound, ArrowLeft, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [teacherCode, setTeacherCode] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUsernameUnique, setIsUsernameUnique] = useState<'idle' | 'checking' | 'unique' | 'duplicate'>('idle');
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const checkUsername = async (username: string) => {
    if (role === 'teacher' && username.length < 2) return;
    if (role === 'student' && username.length < 6) return;
    setIsUsernameUnique('checking');
    try {
      const { data } = await supabase
        .from('dukigo_profiles')
        .select('username')
        .eq('username', username)
        .single();
      if (data) setIsUsernameUnique('duplicate');
      else setIsUsernameUnique('unique');
    } catch (err) {
      setIsUsernameUnique('unique');
    }
  };

  const validate = () => {
    if (role === 'teacher') {
      if (formData.username.length < 2) return '아이디는 2글자 이상이어야 합니다.';
    } else {
      if (formData.username.length < 6) return '학번이름은 6글자 이상이어야 합니다.';
    }
    if (isUsernameUnique === 'duplicate') return '이미 사용 중인 정보입니다.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return '유효한 이메일 형식이 아닙니다.';
    if (formData.password.length < 6) return '비밀번호는 6글자 이상을 권장합니다.';
    if (formData.password !== formData.confirmPassword) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkUsername(formData.username);
    const error = validate();
    if (error) {
      setStatus({ type: 'error', message: error });
      return;
    }

    if (role === 'teacher') {
      setStatus({ type: 'loading', message: '교사 인증 코드를 확인하고 있습니다...' });
      try {
        const res = await fetch('/api/verify-teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: teacherCode }),
        });
        const data = await res.json();
        if (!data.valid) {
          setStatus({ type: 'error', message: '올바른 교사 인증 코드를 입력해 주세요.' });
          return;
        }
      } catch (err) {
        setStatus({ type: 'error', message: '인증 서버 통신에 실패했습니다.' });
        return;
      }
    }

    setStatus({ type: 'loading', message: '가입 승인 절차가 시작되었습니다...' });
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;

      /* 이메일 인증 기능 (1년 뒤 유료화 시 사용 예정) - 현재는 주석 처리
      setIsVerifying(true);
      setStatus({ type: 'idle', message: '' });
      */

      // 이메일 인증 없이 바로 프로필 생성 및 가입 완료
      const { error: profileError } = await supabase
        .from('dukigo_profiles')
        .insert({
          id: authData.user?.id,
          username: formData.username,
          display_name: formData.username,
          email: formData.email,
          role: role.toUpperCase()
        });
      if (profileError) throw profileError;

      setStatus({ type: 'success', message: '가입 성공! 로그인 페이지로 이동합니다.' });
      setTimeout(() => router.push('/login'), 1500);

    } catch (err: any) {
      let errorMessage = err.message || '가입 중 오류가 발생했습니다.';
      if (errorMessage.includes('User already registered')) errorMessage = '이미 가입된 이메일입니다.';
      else if (errorMessage.includes('Password should be')) errorMessage = '비밀번호가 너무 짧거나 취약합니다.';
      else if (errorMessage.includes('not-null constraint')) errorMessage = '필수 정보(이름 등)가 누락되었습니다. 다시 시도해주세요.';
      
      setStatus({ type: 'error', message: errorMessage });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setStatus({ type: 'error', message: '6자리 인증 코드를 입력해 주세요.' });
      return;
    }

    setStatus({ type: 'loading', message: '이메일을 최종 인증하고 있습니다...' });

    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otpCode,
        type: 'signup'
      });
      if (verifyError) throw verifyError;

      const { error: profileError } = await supabase
        .from('dukigo_profiles')
        .insert({
          id: verifyData.user?.id,
          username: formData.username,
          display_name: formData.username,
          email: formData.email,
          role: role
        });
      if (profileError) throw profileError;

      setStatus({ type: 'success', message: '이메일 인증 및 가입 완료!' });
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      let errorMessage = err.message || '인증 중 오류가 발생했습니다.';
      if (errorMessage.includes('Token has expired or is invalid')) errorMessage = '인증 코드가 만료되었거나 잘못되었습니다.';
      else if (errorMessage.includes('not-null constraint')) errorMessage = '필수 정보(이름 등)가 누락되었습니다. 다시 시도해주세요.';
      setStatus({ type: 'error', message: errorMessage });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 text-slate-800 overflow-hidden font-sans">
      <div className="mesh-bg" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="glass-card rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!isVerifying ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex flex-col items-center mb-10">
                  <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6 font-sans">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-none">Create Account</h1>
                  <p className="text-slate-500 font-bold text-sm tracking-tight text-center">전기기능사 합격을 향한 첫 발걸음</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 역할 선택기 */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4">
                    <button type="button" onClick={() => setRole('student')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${role === 'student' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>학생</button>
                    <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${role === 'teacher' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>교사</button>
                  </div>

                  <div className="space-y-3">
                    <InputGroup 
                      icon={<User className="w-5 h-5" />} 
                      type="text" 
                      placeholder={role === 'teacher' ? "아이디 (2자 이상)" : "학번이름 (예: 20405홍길동, 6자 이상)"} 
                      value={formData.username}
                      onChange={(e: any) => setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })}
                    />
                    {role === 'teacher' && (
                      <InputGroup 
                        icon={<KeyRound className="w-5 h-5" />} 
                        type="password" 
                        placeholder="사전에 안내받은 교사 인증 코드" 
                        value={teacherCode}
                        onChange={(e: any) => setTeacherCode(e.target.value)}
                      />
                    )}
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
                      placeholder="비밀번호 (6자 이상)" 
                      value={formData.password}
                      onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <InputGroup 
                      icon={<Lock className="w-5 h-5" />} 
                      type="password" 
                      placeholder="비밀번호 재입력" 
                      value={formData.confirmPassword}
                      onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>

                  <StatusDisplay status={status} />

                  <button
                    disabled={status.type === 'loading'}
                    className="w-full btn-primary font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 group mt-6 h-16"
                  >
                    {status.type === 'loading' ? '처리 중...' : '계정 생성'} 
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-brand-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <KeyRound className="w-10 h-10 text-brand-600" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Email Verification</h1>
                  <p className="text-slate-500 font-bold mb-1 leading-snug">
                    <span className="text-brand-600 underline underline-offset-4 decoration-2">{formData.email}</span>로<br />
                    전송된 6자리 인증 코드를 입력하세요.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500/30 rounded-3xl py-6 text-center text-5xl font-black tracking-[0.8rem] placeholder:text-slate-200 focus:outline-none transition-all text-brand-600 shadow-sm"
                    />
                  </div>

                  <StatusDisplay status={status} />

                  <button
                    disabled={status.type === 'loading'}
                    className="w-full btn-primary font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 h-16"
                  >
                    {status.type === 'loading' ? '인증 확인 중...' : '인증 완료'}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setIsVerifying(false)}
                    className="w-full text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-brand-600 transition-all pt-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> 정보 다시 입력하기
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 text-center pt-8 border-t border-slate-100">
             <p className="text-slate-400 text-sm font-bold">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-black border-b-2 border-brand-100 hover:border-brand-600 transition-all ml-1">
                로그인하기
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
      className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold mt-4 ${
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
    <div className="relative group text-slate-900">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500/30 rounded-2xl py-5 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-bold shadow-sm lg:py-4 lg:pl-12"
      />
    </div>
  );
}
