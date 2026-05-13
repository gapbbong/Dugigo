'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Target, Clock, AlertTriangle, TrendingUp, Search, 
  ChevronRight, ChevronLeft, Award, PlusCircle, Filter, 
  FolderPlus, UserPlus, CheckCircle2, MoreVertical, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]); // 원본 데이터
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('전체');
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('전체');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAccuracy: 0,
    todayActive: 0,
    suspiciousCount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const LEVEL_TITLES = [
    "입문자", "초보자", "수련자", "숙련자", 
    "전문가", "달인", "명인", "현자", 
    "영웅", "전설", "신화", "초월자"
  ];

  useEffect(() => {
    fetchData();
    fetchSubjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedSubject, selectedGroup, searchTerm, allStudents, groups]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const ownerFlag = user?.email?.toLowerCase() === 'serv@kakao.com';
      setIsOwner(ownerFlag);

      // 1. 그룹 정보 가져오기 (DB에서)
      const { data: dbGroups, error: groupErr } = await supabase
        .from('dukigo_teacher_groups')
        .select('*')
        .eq('teacher_id', user.id);
      
      if (!groupErr) setGroups(dbGroups || []);

      // 2. 학생 프로필 가져오기
      let profileQuery = supabase.from('dukigo_profiles').select('*');
      if (!ownerFlag) {
        profileQuery = profileQuery.in('role', ['student', 'STUDENT']);
      } else {
        profileQuery = profileQuery.in('role', ['student', 'teacher', 'STUDENT', 'TEACHER']);
      }
      
      const { data: profiles, error: profileErr } = await profileQuery;
      if (profileErr) throw profileErr;

      // 3. 학습 로그 가져오기
      const { data: logs, error: logErr } = await supabase.from('dukigo_study_logs').select('*');
      if (logErr) throw logErr;

      const todayStr = new Date().toISOString().split('T')[0];
      let tCorrect = 0, tQuestions = 0;
      let activeSet = new Set();

      const processed = profiles?.map(student => {
        const sLogs = logs?.filter(l => l.user_id === student.id) || [];
        const sSubs = Array.from(new Set(sLogs.map(l => l.subject))).filter(Boolean);
        
        let sTotalQ = 0, sCorrect = 0, sDur = 0, lastA = '기록 없음';

        sLogs.forEach(log => {
          sTotalQ += log.total_questions || 0;
          sCorrect += log.correct_questions || 0;
          sDur += log.duration_seconds || 0;
          if (log.end_time?.startsWith(todayStr)) activeSet.add(student.id);
          if (lastA === '기록 없음' || new Date(log.end_time) > new Date(lastA)) {
            // YYYY-MM-DD HH:mm:ss 형식으로 추출
            lastA = log.end_time?.replace('T', ' ').split('.')[0] || lastA;
          }
        });

        tQuestions += sTotalQ;
        tCorrect += sCorrect;

        return {
          ...student,
          username: student.display_name || '이름 없음',
          totalQuestions: sTotalQ,
          accuracy: sTotalQ > 0 ? Math.round((sCorrect / sTotalQ) * 100) : 0,
          totalDuration: sDur,
          lastActive: lastA,
          subjectsStudied: sSubs,
          guessingCount: 0
        };
      }) || [];

      setAllStudents(processed);
      setStats({
        totalStudents: processed.length,
        avgAccuracy: tQuestions > 0 ? Math.round((tCorrect / tQuestions) * 100) : 0,
        todayActive: activeSet.size,
        suspiciousCount: 0
      });

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allStudents];

    if (selectedSubject !== '전체') {
      filtered = filtered.filter(s => s.subjectsStudied.includes(selectedSubject));
    }

    if (selectedGroup !== '전체') {
      const group = groups.find(g => g.name === selectedGroup);
      if (group) {
        filtered = filtered.filter(s => group.members.includes(s.id));
      }
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.username.toLowerCase().includes(lower) || (s.id || '').toLowerCase().includes(lower));
    }

    setStudents(filtered);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    if (groups.find(g => g.name === newGroupName)) {
      alert('이미 존재하는 그룹명입니다.');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('dukigo_teacher_groups')
      .insert([{ 
        name: newGroupName, 
        members: [], 
        teacher_id: user.id 
      }])
      .select();

    if (error) {
      alert('그룹 생성 중 오류가 발생했습니다.');
    } else {
      setGroups([...groups, data[0]]);
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  const toggleStudentInGroup = async (studentId: string, groupName: string) => {
    const group = groups.find(g => g.name === groupName);
    if (!group) return;

    const exists = group.members.includes(studentId);
    const newMembers = exists 
      ? group.members.filter((id: string) => id !== studentId) 
      : [...group.members, studentId];

    const { error } = await supabase
      .from('dukigo_teacher_groups')
      .update({ members: newMembers })
      .eq('id', group.id);

    if (error) {
      alert('상태 업데이트 실패');
    } else {
      setGroups(groups.map(g => g.id === group.id ? { ...g, members: newMembers } : g));
    }
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`'${name}' 그룹을 삭제하시겠습니까?`)) return;
    
    const { error } = await supabase
      .from('dukigo_teacher_groups')
      .delete()
      .eq('id', id);

    if (error) {
      alert('삭제 실패');
    } else {
      setGroups(groups.filter(g => g.id !== id));
      if (selectedGroup === name) setSelectedGroup('전체');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-brand-600 font-black text-xl">데이터 분석 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 md:px-10 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => window.location.href = '/select-subject'} 
            className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-600 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              교사 대시보드
              <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase">Live</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="학생 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold text-sm" 
            />
          </div>
          <button onClick={fetchData} className="p-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95">
            <TrendingUp size={18} />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
        {/* 요약 대시보드 (2x2 그리드) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <StatCard label="전체 학생" value={stats.totalStudents} sub="누적 등록" icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="평균 정답률" value={`${stats.avgAccuracy}%`} sub="전체 기준" icon={<Target />} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="오늘 접속" value={stats.todayActive} sub="학습 중" icon={<Clock />} color="text-brand-600" bg="bg-brand-50" />
          <StatCard label="이상 징후" value={stats.suspiciousCount} sub="집중 관리" icon={<AlertTriangle />} color="text-rose-600" bg="bg-rose-50" />
        </div>

        {/* 필터 섹션 (줄바꿈 대응) */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <Filter size={16} className="text-slate-400 shrink-0" />
              <span className="text-[10px] font-black text-slate-400 uppercase">종목 필터</span>
            </div>
            <FilterTab active={selectedSubject === '전체'} label="전체" onClick={() => setSelectedSubject('전체')} />
            {subjects.map(s => (
              <FilterTab key={s} active={selectedSubject === s} label={s} onClick={() => setSelectedSubject(s)} />
            ))}
          </div>
        </div>

        {/* 그룹 관리 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FolderPlus size={20} className="text-brand-600" />
              내 그룹 관리
            </h3>
            <button 
              onClick={() => setIsAddingGroup(true)}
              className="text-xs font-black text-brand-600 flex items-center gap-1 hover:underline"
            >
              <PlusCircle size={14} /> 새 그룹 추가
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 py-1">
            <GroupTag 
              active={selectedGroup === '전체'} 
              label="모든 학생" 
              count={allStudents.length} 
              onClick={() => setSelectedGroup('전체')} 
            />
            {groups.map(g => (
              <GroupTag 
                key={g.id} 
                active={selectedGroup === g.name} 
                label={g.name} 
                count={g.members.length} 
                onClick={() => setSelectedGroup(g.name)}
                onDelete={() => deleteGroup(g.id, g.name)}
              />
            ))}
          </div>
        </div>

        {/* 학생 목록 (카드형 레이아웃) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {students.map((student, idx) => (
              <StudentCard 
                key={student.id || idx} 
                student={student} 
                groups={groups}
                levelTitles={LEVEL_TITLES}
                onToggleGroup={toggleStudentInGroup}
                formatTime={formatTime}
              />
            ))}
          </AnimatePresence>
        </div>

        {students.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center text-slate-300">
            등록된 데이터가 없습니다.
          </div>
        )}
      </main>

      {/* 그룹 생성 팝업 */}
      <AnimatePresence>
        {isAddingGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-black mb-6">새로운 스터디 그룹</h3>
              <input 
                autoFocus
                type="text" 
                placeholder="그룹명을 입력하세요" 
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none mb-6 font-bold"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && createGroup()}
              />
              <div className="flex gap-3">
                <button onClick={() => setIsAddingGroup(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200">취소</button>
                <button onClick={createGroup} className="flex-1 py-4 bg-brand-600 text-white font-black rounded-xl shadow-lg shadow-brand-600/20">생성하기</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, bg }: any) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col gap-2">
      <div className={`w-8 h-8 ${bg} ${color} rounded-lg flex items-center justify-center`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <div>
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{value}</div>
        <div className="text-[9px] font-bold text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

function FilterTab({ active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition-all border ${
        active 
        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20' 
        : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
  );
}

function GroupTag({ active, label, count, onClick, onDelete }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all border ${
        active ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100'
      }`}
    >
      <span className={`text-xs font-black ${active ? 'text-brand-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
      {onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="ml-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function StudentCard({ student, groups, levelTitles, onToggleGroup, formatTime }: any) {
  const [showGroups, setShowGroups] = useState(false);
  const level = Math.floor((student.exp_points || 0) / 1000) + 1;
  const levelTitle = levelTitles[Math.min(11, level - 1)];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setShowGroups(!showGroups)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showGroups ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-brand-50'}`}
        >
          <UserPlus size={18} />
        </button>
      </div>

      {/* 이름 섹션 - 마진 축소 */}
      <div className="flex items-start gap-4 mb-2">
        <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner px-1 overflow-hidden">
          <span className="font-black text-[10px] text-center break-keep leading-tight">{student.username}</span>
        </div>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-slate-900 text-lg leading-tight">{student.username}</h4>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <Award size={12} className="text-amber-500" />
            Lv.{level} {levelTitle}
          </div>
        </div>
      </div>

      <div className="space-y-6 border-t border-slate-50 pt-4">
        {/* 학습 중인 자격증 - 최상단 */}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">학습 중인 자격증</p>
          <div className="flex flex-wrap gap-1">
            {student.subjectsStudied.length > 0 ? (
              student.subjectsStudied.map((s: string) => (
                <span key={s} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">{s}</span>
              ))
            ) : (
              <span className="text-[10px] text-slate-300 italic">기록 없음</span>
            )}
          </div>
        </div>

        {/* 문제/시간 행 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">총 푼 문제</p>
            <p className="text-xl font-black text-slate-800">{student.totalQuestions}<span className="text-xs ml-1">Q</span></p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">학습 시간</p>
            <p className="text-xl font-black text-slate-800">{formatTime(student.totalDuration)}</p>
          </div>
        </div>

        {/* 정답률/최근접속 행 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">종합 정답률</p>
            <div className="flex items-center gap-2">
              <span className={`font-black text-lg ${student.accuracy >= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>{student.accuracy}%</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                <div className={`h-full rounded-full ${student.accuracy >= 60 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${student.accuracy}%` }} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">최근 접속</p>
            <p className="text-[10px] font-black text-slate-500 leading-tight whitespace-pre-wrap">{student.lastActive}</p>
          </div>
        </div>
      </div>

      {/* 그룹 할당 오버레이 */}
      <AnimatePresence>
        {showGroups && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute inset-0 bg-white z-10 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-black text-slate-900 flex items-center gap-2 text-sm">그룹 지정</h5>
              <button onClick={() => setShowGroups(false)} className="text-slate-400 font-bold text-xs">닫기</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {groups.map((g: any) => {
                const isIn = g.members.includes(student.id);
                return (
                  <button 
                    key={g.id}
                    onClick={() => onToggleGroup(student.id, g.name)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between border-2 transition-all ${
                      isIn ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="text-xs font-black">{g.name}</span>
                    {isIn ? <CheckCircle2 size={16} /> : <PlusCircle size={16} className="opacity-30" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
