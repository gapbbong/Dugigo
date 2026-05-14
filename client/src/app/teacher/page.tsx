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
  const [allStudents, setAllStudents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('전체');
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('전체');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAccuracy: 0,
    todayActive: 0,
    suspiciousCount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearch, setModalSearch] = useState('');

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
  }, [selectedSubject, selectedGroup, searchTerm, allStudents, groups, activeRole]);

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

      const { data: dbGroups, error: groupErr } = await supabase
        .from('dukigo_teacher_groups')
        .select('*')
        .eq('teacher_id', user.id);
      
      if (!groupErr) setGroups(dbGroups || []);

      let profileQuery = supabase.from('dukigo_profiles').select('*');
      if (!ownerFlag) {
        profileQuery = profileQuery.in('role', ['student', 'STUDENT']);
      } else {
        profileQuery = profileQuery.in('role', ['student', 'teacher', 'STUDENT', 'TEACHER']);
      }
      
      const { data: profiles, error: profileErr } = await profileQuery;
      if (profileErr) throw profileErr;

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
      
      const studentsOnly = processed.filter(p => p.role?.toLowerCase() === 'student');
      const teachersOnly = processed.filter(p => p.role?.toLowerCase() === 'teacher');

      setStats({
        totalStudents: ownerFlag ? (activeRole === 'student' ? studentsOnly.length : teachersOnly.length) : processed.length,
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
    
    if (isOwner) {
      filtered = filtered.filter(s => s.role?.toLowerCase() === activeRole);
    }

    if (selectedSubject !== '전체') {
      filtered = filtered.filter(s => s.subjectsStudied.includes(selectedSubject));
    }
    if (selectedGroup !== '전체') {
      const group = groups.find(g => g.name === selectedGroup);
      if (group) filtered = filtered.filter(s => group.members.includes(s.id));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.username.toLowerCase().includes(lower) || (s.id || '').toLowerCase().includes(lower));
    }
    setStudents(filtered);

    // Update stats whenever filters change to reflect the current view
    if (isOwner) {
      setStats(prev => ({
        ...prev,
        totalStudents: filtered.length
      }));
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('dukigo_teacher_groups').insert([{ name: newGroupName, members: [], teacher_id: user.id }]).select();
    if (!error) {
      setGroups([...groups, data[0]]);
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  const toggleStudentInGroup = async (studentId: string, groupName: string) => {
    const group = groups.find(g => g.name === groupName);
    if (!group) return;
    const exists = group.members.includes(studentId);
    const newMembers = exists ? group.members.filter((id: string) => id !== studentId) : [...group.members, studentId];
    const { error } = await supabase.from('dukigo_teacher_groups').update({ members: newMembers }).eq('id', group.id);
    if (!error) setGroups(groups.map(g => g.id === group.id ? { ...g, members: newMembers } : g));
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`'${name}' 그룹을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('dukigo_teacher_groups').delete().eq('id', id);
    if (!error) {
      setGroups(groups.filter(g => g.id !== id));
      if (selectedGroup === name) setSelectedGroup('전체');
    }
  };

  const deleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`'${studentName}' 학생을 정말로 탈퇴(삭제)시키겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from('dukigo_profiles').delete().eq('id', studentId);
    if (!error) {
      setAllStudents(allStudents.filter(s => s.id !== studentId));
      alert(`${studentName} 학생이 탈퇴 처리되었습니다.`);
    } else {
      alert('탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-brand-600 animate-pulse">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 md:px-10 md:py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => window.location.href = '/select-subject'} className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 transition-all"><ChevronLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">교사 대시보드 <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase">Live</span></h1>
            <p className="text-xs md:text-sm font-bold text-slate-400">환영합니다! 현재 <span className="text-brand-600">[{selectedGroup}]</span> 그룹 확인 중</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={isOwner && activeRole === 'teacher' ? "교사 검색..." : "학생 검색..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold text-sm" />
          </div>
          <button onClick={fetchData} className="p-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition-all"><TrendingUp size={18} /></button>
        </div>
      </div>

      {/* Admin Role Tabs */}

      <main className="max-w-7xl mx-auto p-4 md:p-10 space-y-6">
        {/* 요약 카드 한 줄 */}
        <div className="grid grid-cols-4 gap-2 md:gap-6">
          <StatCard label={isOwner && activeRole === 'teacher' ? "교사수" : "학생수"} value={stats.totalStudents} icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="정답률" value={`${stats.avgAccuracy}%`} icon={<Target />} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="오늘" value={stats.todayActive} icon={<Clock />} color="text-brand-600" bg="bg-brand-50" />
          <StatCard label="이상" value={stats.suspiciousCount} icon={<AlertTriangle />} color="text-rose-600" bg="bg-rose-50" />
        </div>

        {/* 종목 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black text-slate-400">종목</span></div>
          <FilterTab active={selectedSubject === '전체'} label="전체" onClick={() => setSelectedSubject('전체')} />
          {subjects.map(s => <FilterTab key={s} active={selectedSubject === s} label={s} onClick={() => setSelectedSubject(s)} />)}
        </div>

        {/* 그룹 관리 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><FolderPlus size={16} className="text-brand-600" /> 그룹 관리</h3>
            <div className="flex gap-3">
              {selectedGroup !== '전체' && (
                <button 
                  onClick={() => setIsMemberModalOpen(true)}
                  className="text-[10px] font-black text-white bg-brand-600 px-3 py-1 rounded-lg shadow-sm flex items-center gap-1"
                >
                  <UserPlus size={12} /> 학생 추가
                </button>
              )}
              <button onClick={() => setIsAddingGroup(true)} className="text-[10px] font-black text-brand-600 hover:underline flex items-center gap-1"><PlusCircle size={12} /> 새 그룹</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <GroupTag 
                active={selectedGroup === '전체' && activeRole === 'teacher'} 
                label="모든 교사" 
                count={allStudents.filter(s => s.role?.toLowerCase() === 'teacher').length} 
                onClick={() => { setActiveRole('teacher'); setSelectedGroup('전체'); }} 
              />
            )}
            <GroupTag 
              active={selectedGroup === '전체' && activeRole === 'student'} 
              label="모든 학생" 
              count={allStudents.filter(s => s.role?.toLowerCase() === 'student').length} 
              onClick={() => { setActiveRole('student'); setSelectedGroup('전체'); }} 
            />
            {groups.map(g => (
              <GroupTag 
                key={g.id} 
                active={selectedGroup === g.name} 
                label={g.name} 
                count={g.members.length} 
                onClick={() => { setActiveRole('student'); setSelectedGroup(g.name); }} 
                onDelete={() => deleteGroup(g.id, g.name)} 
              />
            ))}
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            {isOwner && activeRole === 'teacher' ? (
              <><Award className="text-brand-600" /> 교사 목록</>
            ) : (
              <><Users className="text-brand-600" /> 학생 목록</>
            )}
          </h2>
          <p className="text-sm font-bold text-slate-400">총 <span className="text-brand-600">{students.length}</span>명</p>
        </div>

        {/* 학생 카드 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {students.map((student, idx) => (
              <StudentCard 
                key={student.id || idx} 
                student={student} 
                groups={groups} 
                levelTitles={LEVEL_TITLES} 
                onToggleGroup={toggleStudentInGroup} 
                onDelete={deleteStudent}
                formatTime={formatTime} 
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isAddingGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-black mb-6">새 그룹 만들기</h3>
              <input autoFocus type="text" placeholder="그룹명을 입력하세요" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none mb-6 font-bold" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyPress={e => e.key === 'Enter' && createGroup()} />
              <div className="flex gap-3">
                <button onClick={() => setIsAddingGroup(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200">취소</button>
                <button onClick={createGroup} className="flex-1 py-4 bg-brand-600 text-white font-black rounded-xl">생성</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 학생 추가 모달 */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">[{selectedGroup}] 학생 추가</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">그룹에 포함할 학생을 선택해 주세요.</p>
                </div>
                <button onClick={() => setIsMemberModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"><PlusCircle className="rotate-45" size={20} /></button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="추가할 학생 이름 검색..." 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none font-bold"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                {allStudents
                  .filter(s => s.username.includes(modalSearch))
                  .map(s => {
                    const isIn = groups.find(g => g.name === selectedGroup)?.members.includes(s.id);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-brand-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200">{s.username.replace(/[0-9]/g, '')}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{s.username}</p>
                            <p className="text-[10px] font-bold text-slate-400">{s.id}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleStudentInGroup(s.id, selectedGroup)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isIn ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                        >
                          {isIn ? '삭제' : '추가'}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button onClick={() => setIsMemberModalOpen(false)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all">완료</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1.5 items-center md:items-start">
      <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center mb-1`}>{React.cloneElement(icon, { size: 18 })}</div>
      <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase text-center md:text-left">{label}</div>
      <div className="text-base md:text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function FilterTab({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-black transition-all border ${active ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-500 border-slate-200'}`}>
      {label}
    </button>
  );
}

function GroupTag({ active, label, count, onClick, onDelete }: any) {
  return (
    <div onClick={onClick} className={`group px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer border ${active ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100'}`}>
      <span className={`text-xs font-black ${active ? 'text-brand-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
      {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="ml-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>}
    </div>
  );
}

function StudentCard({ student, groups, levelTitles, onToggleGroup, formatTime, onDelete }: any) {
  const [showGroups, setShowGroups] = useState(false);
  const level = Math.floor((student.exp_points || 0) / 1000) + 1;
  const levelTitle = levelTitles[Math.min(11, level - 1)];

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        <button onClick={() => setShowGroups(!showGroups)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showGroups ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-brand-50'}`}><UserPlus size={16} /></button>
        <button onClick={() => onDelete(student.id, student.username)} className="w-8 h-8 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs text-center px-1">
          {student.username.replace(/[0-9]/g, '')}
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-lg leading-tight">{student.username}</h4>
          <div className="text-xs font-bold text-slate-400">Lv.{level} {levelTitle}</div>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-50 pt-2">
        {/* 행 1: [자격증 | 총 푼 문제 | 학습 시간] */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <p className="text-xs font-black text-slate-500 uppercase mb-1">학습 자격증</p>
            <div className="flex flex-wrap gap-1">
              {student.subjectsStudied.length > 0 ? student.subjectsStudied.map((s: string) => <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{s}</span>) : <span className="text-[10px] text-slate-300 italic">없음</span>}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-slate-500 uppercase mb-1">총 문제</p>
            <p className="text-base font-black text-slate-800">{student.totalQuestions}Q</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-500 uppercase mb-1">학습 시간</p>
            <p className="text-base font-black text-slate-800">{formatTime(student.totalDuration)}</p>
          </div>
        </div>

        {/* 행 2: [정답률 | 최근 접속] */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-black text-slate-500 uppercase mb-1">종합 정답률</p>
            <div className="flex items-center gap-2">
              <span className={`font-black text-base ${student.accuracy >= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>{student.accuracy}%</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${student.accuracy >= 60 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${student.accuracy}%` }} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-500 uppercase mb-1">최근 접속</p>
            <p className="text-sm font-black text-slate-600 leading-tight">{student.lastActive}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGroups && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="absolute inset-0 bg-white z-10 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4"><h5 className="font-black text-slate-900 text-sm">그룹 지정</h5><button onClick={() => setShowGroups(false)} className="text-slate-400 font-bold text-xs">닫기</button></div>
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {groups.map((g: any) => {
                const isIn = g.members.includes(student.id);
                return (
                  <button key={g.id} onClick={() => onToggleGroup(student.id, g.name)} className={`w-full p-2.5 rounded-xl flex items-center justify-between border-2 text-xs font-black transition-all ${isIn ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    <span>{g.name}</span>{isIn ? <CheckCircle2 size={14} /> : <PlusCircle size={14} className="opacity-30" />}
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
