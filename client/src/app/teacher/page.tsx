'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Target, Clock, AlertTriangle, TrendingUp, Search, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('전체');
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAccuracy: 0,
    todayActive: 0,
    suspiciousCount: 0
  });

  useEffect(() => {
    fetchData();
    fetchSubjects();
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 0. 현재 사용자 정보 확인
      const { data: { user } } = await supabase.auth.getUser();
      const ownerFlag = user?.email?.toLowerCase() === 'serv@kakao.com';
      setIsOwner(ownerFlag);

      let profileQuery = supabase.from('dukigo_profiles').select('*');
      if (!ownerFlag) {
        profileQuery = profileQuery.in('role', ['student', 'STUDENT']);
      } else {
        profileQuery = profileQuery.in('role', ['student', 'teacher', 'STUDENT', 'TEACHER']);
      }
      
      const { data: profiles, error: profileErr } = await profileQuery;
      if (profileErr) throw profileErr;

      // 1. 학습 로그(세션 기록) 가져오기
      let logQuery = supabase.from('dukigo_study_logs').select('*');
      if (selectedSubject !== '전체') {
        logQuery = logQuery.eq('subject', selectedSubject);
      }
      
      const { data: logs, error: logErr } = await logQuery;
      
      if (logErr) throw logErr;

      // 데이터 가공
      let totalCorrect = 0;
      let totalQuestions = 0;
      let todayActiveSet = new Set();

      const todayStr = new Date().toISOString().split('T')[0];

      const studentStats = profiles?.map(student => {
        const studentLogs = logs?.filter(l => l.user_id === student.id) || [];
        
        let sTotalQ = 0;
        let sCorrect = 0;
        let sDuration = 0;
        let lastActive = '기록 없음';

        studentLogs.forEach(log => {
          sTotalQ += log.total_questions || 0;
          sCorrect += log.correct_questions || 0;
          sDuration += log.duration_seconds || 0;
          
          totalQuestions += log.total_questions || 0;
          totalCorrect += log.correct_questions || 0;

          if (log.end_time?.startsWith(todayStr)) {
            todayActiveSet.add(student.id);
          }
          if (lastActive === '기록 없음' || new Date(log.end_time) > new Date(lastActive)) {
            lastActive = log.end_time?.split('T')[0] || lastActive;
          }
        });

        const accuracy = sTotalQ > 0 ? Math.round((sCorrect / sTotalQ) * 100) : 0;

        return {
          ...student,
          username: student.display_name || '이름 없음',
          totalQuestions: sTotalQ,
          accuracy,
          totalDuration: sDuration,
          lastActive,
          guessingCount: 0 // 현재 스키마에서는 세션 요약만 제공하므로 0으로 설정
        };
      }) || [];

      // 정답률 순으로 정렬 (높은 순)
      studentStats.sort((a, b) => b.accuracy - a.accuracy);

      // 종목 선택 시 해당 종목을 한 번이라도 푼 학생만 표시
      const filteredStudents = selectedSubject === '전체' 
        ? studentStats 
        : studentStats.filter(s => s.totalQuestions > 0);

      setStudents(filteredStudents);
      setStats({
        totalStudents: filteredStudents.length,
        avgAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        todayActive: todayActiveSet.size,
        suspiciousCount: 0
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="glass-card p-12 rounded-[3rem] text-center shadow-xl animate-pulse">
          <p className="text-2xl font-black text-brand-600 tracking-tight">학생 데이터 분석 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <button 
              onClick={() => window.location.href = '/select-subject'} 
              className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm shrink-0"
              title="과목 선택으로 돌아가기"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-brand-100 text-brand-700 font-black text-xs uppercase tracking-widest rounded-full">
                  {isOwner ? 'Owner' : 'Admin'}
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                  {isOwner ? '관리자 대시보드' : '교사 대시보드'}
                </h1>
              </div>
              <p className="text-slate-500 font-bold text-lg">학생들의 전체 학습 현황과 성취도를 한눈에 파악하세요.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-brand-300 transition-all shadow-sm">
              <span className="text-sm font-black text-slate-600">나의 진도 표시</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  defaultChecked={localStorage.getItem('dukigo_show_teacher_progress') !== 'false'}
                  onChange={(e) => {
                    localStorage.setItem('dukigo_show_teacher_progress', e.target.checked ? 'true' : 'false');
                  }}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </div>
            </label>
            <button onClick={fetchData} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95">
              새로고침
            </button>
          </div>
        </header>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<Users />} label="전체 등록 학생" value={`${stats.totalStudents}명`} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<Target />} label="전체 평균 정답률" value={`${stats.avgAccuracy}%`} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={<TrendingUp />} label="오늘 학습한 학생" value={`${stats.todayActive}명`} color="bg-brand-50 text-brand-600" />
          <StatCard icon={<AlertTriangle />} label="불성실(찍기) 의심 학생" value={`${stats.suspiciousCount}명`} color="bg-rose-50 text-rose-600" />
        </div>

        {/* 학생 목록 테이블 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                학생 상세 현황 <span className="text-brand-500 bg-brand-50 px-3 py-1 rounded-full text-sm">{students.length}</span>
              </h2>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-600 shadow-sm hover:border-brand-300 focus:outline-none transition-all cursor-pointer text-sm"
              >
                <option value="전체">전체 종목</option>
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="이름으로 검색..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-brand-400 focus:bg-white font-bold text-sm transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6 font-black">학생 정보</th>
                  <th className="p-6 font-black">최근 접속일</th>
                  <th className="p-6 font-black">총 푼 문제수</th>
                  <th className="p-6 font-black w-64">종합 정답률</th>
                  <th className="p-6 font-black">총 학습 시간</th>
                  <th className="p-6 font-black text-right">학습 상태 분석</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 flex items-center justify-center font-black text-xl shadow-inner border border-brand-200/50">
                          {student.username.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg mb-0.5 flex items-center gap-2">
                            {student.username}
                            {student.role?.toLowerCase() === 'teacher' && (
                              <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] rounded-md border border-brand-600 shadow-sm leading-none pt-1">교사</span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                            <Award className="w-3 h-3 text-amber-500" /> {student.level_title || 'Lv.1 초보자'} ({student.exp_points || 0} EXP)
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 font-bold text-slate-500">{student.lastActive}</td>
                    <td className="p-6 font-black text-slate-800 text-lg">{student.totalQuestions}<span className="text-sm font-bold text-slate-400 ml-1">문제</span></td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-xl w-12 ${student.accuracy >= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {student.accuracy}%
                        </span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${student.accuracy >= 60 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${student.accuracy}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-6 font-bold text-slate-500">{formatTime(student.totalDuration)}</td>
                    <td className="p-6 text-right">
                      <div className="flex gap-2 justify-end">
                        {student.accuracy >= 60 ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-xs font-black">합격 안정권</span>
                        ) : (
                          <span className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-black">집중 지도 요망</span>
                        )}
                        {student.guessingCount > 0 && (
                          <span className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-xs font-black flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 찍기 의심 ({student.guessingCount}건)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
                <div className="text-xl font-black text-slate-800 mb-2">등록된 학생이 없습니다</div>
                <div className="text-slate-400 font-bold">학생들이 학습을 시작하면 이곳에 데이터가 표시됩니다.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-lg shadow-slate-200/40 border border-white flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-default">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${color}`}>
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>
      <div>
        <div className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">{label}</div>
        <div className="text-4xl font-black text-slate-800 tracking-tight">{value}</div>
      </div>
    </div>
  );
}
