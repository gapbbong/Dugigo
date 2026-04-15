'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, CheckCircle2, XCircle, ChevronDown, ChevronUp, Edit3, Save, X, Loader2, RefreshCw } from 'lucide-react';

const REPORT_LABELS: Record<string, string> = {
  wrong_answer: '정답 오류',
  wrong_explanation: '해설 오류',
  broken_text: '문장/수식 오류',
  other: '기타',
};

const STATUS_TABS = ['pending', 'resolved', 'ignored'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: '미처리',
  resolved: '처리 완료',
  ignored: '무시됨',
};

export default function AdminReportsPage() {
  const [tab, setTab] = useState<'pending' | 'resolved' | 'ignored'>('pending');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?status=${tab}`);
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleStatus = async (id: string, status: 'resolved' | 'ignored', note?: string) => {
    setActionLoading(id);
    await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolver_note: note }),
    });
    setActionLoading(null);
    fetchReports();
  };

  const handleLoadQuestion = async (report: any) => {
    const res = await fetch(`/api/questions?subject=${encodeURIComponent(report.subject)}`);
    const data = await res.json();
    const q = data.questions?.find((q: any) => q.id === report.question_id);
    if (q) {
      setEditQuestion({ ...q });
      setEditingId(report.id);
    } else {
      alert('문항을 찾을 수 없습니다. (question_id: ' + report.question_id + ')');
    }
  };

  const handleSaveEdit = async (report: any) => {
    setSaving(true);
    const { id, question, options, answer, explanation } = editQuestion;
    await fetch('/api/questions/edit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: report.subject,
        question_id: id,
        updates: { question, options, answer, explanation },
      }),
    });
    await handleStatus(report.id, 'resolved', '문항 내용 수정 완료');
    setEditingId(null);
    setEditQuestion(null);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center shadow">
            <Flag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">문항 오류 신고 관리</h1>
            <p className="text-xs text-slate-400 font-medium">DugiGo+ 어드민</p>
          </div>
        </div>
        <button onClick={fetchReports} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors">
          <RefreshCw className="w-4 h-4" /> 새로고침
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                tab === t
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {STATUS_LABELS[t]}
              {t === 'pending' && reports.length > 0 && tab === 'pending' && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {reports.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {tab === 'pending' ? '미처리 신고가 없습니다 👍' : '항목이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <motion.div
                key={r.id}
                layout
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* 카드 헤더 */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    r.report_type === 'wrong_answer' ? 'bg-rose-500' :
                    r.report_type === 'wrong_explanation' ? 'bg-amber-500' :
                    r.report_type === 'broken_text' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Q.{r.year}-{r.round}-{r.question_num}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{r.subject}</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        r.report_type === 'wrong_answer' ? 'bg-rose-50 text-rose-600' :
                        r.report_type === 'wrong_explanation' ? 'bg-amber-50 text-amber-600' :
                        r.report_type === 'broken_text' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {REPORT_LABELS[r.report_type]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {new Date(r.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {expandedId === r.id ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>

                {/* 확장 영역 */}
                <AnimatePresence>
                  {expandedId === r.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                        {/* 학생 코멘트 */}
                        {r.comment && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">학생 설명</p>
                            <p className="text-sm text-slate-700 font-medium">{r.comment}</p>
                          </div>
                        )}

                        {/* 문항 수정 에디터 */}
                        {editingId === r.id && editQuestion ? (
                          <div className="space-y-3 bg-brand-50 rounded-2xl p-4 border border-brand-100">
                            <p className="text-xs font-black text-brand-600 uppercase tracking-widest">문항 수정</p>
                            
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">문제</label>
                              <textarea
                                value={editQuestion.question}
                                onChange={e => setEditQuestion({ ...editQuestion, question: e.target.value })}
                                rows={3}
                                className="w-full mt-1 text-sm border-2 border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand-400 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">선택지 (줄바꿈으로 구분)</label>
                              <textarea
                                value={(editQuestion.options || editQuestion.choices || []).join('\n')}
                                onChange={e => setEditQuestion({ ...editQuestion, options: e.target.value.split('\n') })}
                                rows={4}
                                className="w-full mt-1 text-sm border-2 border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand-400 font-medium"
                              />
                            </div>

                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">정답 번호</label>
                                <input
                                  type="number" min={1} max={4}
                                  value={editQuestion.answer}
                                  onChange={e => setEditQuestion({ ...editQuestion, answer: parseInt(e.target.value) })}
                                  className="w-full mt-1 text-sm border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-400 font-black"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">해설</label>
                              <textarea
                                value={editQuestion.explanation || ''}
                                onChange={e => setEditQuestion({ ...editQuestion, explanation: e.target.value })}
                                rows={4}
                                className="w-full mt-1 text-sm border-2 border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand-400 font-medium"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingId(null); setEditQuestion(null); }}
                                className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50"
                              >
                                <X className="w-4 h-4" /> 취소
                              </button>
                              <button
                                onClick={() => handleSaveEdit(r)}
                                disabled={saving}
                                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm disabled:opacity-60"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                저장 및 처리 완료
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* 액션 버튼들 */
                          tab === 'pending' && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleLoadQuestion(r)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-xs transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> 문항 수정하기
                              </button>
                              <button
                                onClick={() => handleStatus(r.id, 'resolved', '내용 확인, 수정 불필요')}
                                disabled={actionLoading === r.id}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all disabled:opacity-50"
                              >
                                {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                처리 완료
                              </button>
                              <button
                                onClick={() => handleStatus(r.id, 'ignored', '오류 아님')}
                                disabled={actionLoading === r.id}
                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl font-black text-xs transition-all disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" /> 무시
                              </button>
                            </div>
                          )
                        )}

                        {/* 처리 완료된 경우 메모 표시 */}
                        {r.resolver_note && (
                          <p className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-xl">
                            💬 {r.resolver_note}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
