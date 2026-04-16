-- question_reports 테이블
CREATE TABLE IF NOT EXISTS dukigo_question_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  year INT,
  round TEXT,
  question_num INT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('wrong_answer', 'wrong_explanation', 'broken_text', 'other')),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolver_note TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dukigo_question_reports_status ON dukigo_question_reports(status);
CREATE INDEX IF NOT EXISTS idx_dukigo_question_reports_question_id ON dukigo_question_reports(question_id);

-- RLS 정책 초기화 (기존 정책이 있으면 삭제 후 재발행)
ALTER TABLE dukigo_question_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON dukigo_question_reports;
DROP POLICY IF EXISTS "Anyone can insert reports" ON dukigo_question_reports;
-- 제보 등록 (권한 제한 없이 가능하도록 public 오픈)
CREATE POLICY "Anyone can insert reports" ON dukigo_question_reports
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own reports" ON dukigo_question_reports;
-- 본인 제보만 조회 가능 (학생)
CREATE POLICY "Users can view own reports" ON dukigo_question_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON dukigo_question_reports;
-- service_role은 전체 접근 (서버에서 처리)
CREATE POLICY "Service role full access" ON dukigo_question_reports
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow anon select" ON dukigo_question_reports;
-- 익명 사용자(anon)도 목록 조회 가능 (어드민 페이지에서 anon 키를 쓸 경우 대비)
CREATE POLICY "Allow anon select" ON dukigo_question_reports
  FOR SELECT TO public USING (true);
