-- =========================================================
-- 🚀 DugiGo 마스터 스키마 초기화 SQL (Supabase SQL Editor용)
-- =========================================================

-- 1. 시험 문항 마스터 테이블 (Exam Questions)
CREATE TABLE IF NOT EXISTS dukigo_exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id TEXT NOT NULL, -- 예: 'ELECTRICITY', 'ELEVATOR', 'INFOPRO'
  exam_year INT NOT NULL,
  exam_round INT NOT NULL,
  question_no INT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, exam_year, exam_round, question_no)
);

CREATE INDEX IF NOT EXISTS idx_dukigo_questions_lookup ON dukigo_exam_questions(subject_id, exam_year, exam_round);

-- 2. 문항 오류 제보 테이블 (Reports)
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

CREATE INDEX IF NOT EXISTS idx_dukigo_reports_status ON dukigo_question_reports(status);

-- 3. 사용자 프로필 및 게이미피케이션 (Profiles)
CREATE TABLE IF NOT EXISTS dukigo_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'student',
  username TEXT,
  display_name TEXT,
  email TEXT,
  name TEXT,
  school_name TEXT,
  grade INT,
  class_num INT,
  is_approved BOOLEAN DEFAULT false,
  exp_points INT DEFAULT 0,
  level_title TEXT DEFAULT 'B3층 주차 요원',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dukigo_profiles_role ON dukigo_profiles(role);

-- 4. 학습 세션 관제 (Study Sessions)
CREATE TABLE IF NOT EXISTS dukigo_study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  questions_attempted INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dukigo_sessions_active ON dukigo_study_sessions(end_time) WHERE end_time IS NULL;

-- 5. 문항 풀이 상세 로그 (Study Logs)
CREATE TABLE IF NOT EXISTS dukigo_study_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES dukigo_study_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  question_id TEXT, -- Nullable로 변경
  category TEXT,
  is_correct BOOLEAN, -- Nullable로 변경
  user_answer TEXT,
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT,
  unit TEXT,
  set_num INT,
  total_questions INT,
  correct_questions INT,
  duration_seconds INT,
  end_time TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dukigo_logs_user ON dukigo_study_logs(user_id);

-- 6. 교사 그룹 관리 테이블 (Teacher Groups)
CREATE TABLE IF NOT EXISTS dukigo_teacher_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  members TEXT[] DEFAULT '{}'::text[],
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 학생 오답 노트 테이블 (Wrong Answers)
CREATE TABLE IF NOT EXISTS dukigo_wrong_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT,
  set_num INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 8. 발전기금 리워드 신청 (Reward Claims)
CREATE TABLE IF NOT EXISTS dukigo_reward_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  target_criteria TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_note TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ==========================================
-- 🔒 Row Level Security (RLS) 및 권한 정책
-- ==========================================
ALTER TABLE dukigo_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_teacher_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_wrong_answers ENABLE ROW LEVEL SECURITY;

-- [공통] 누구나 문항 조회 가능 (익명 및 로그인 사용자)
CREATE POLICY "Anyone can view exam questions" ON dukigo_exam_questions FOR SELECT USING (true);
CREATE POLICY "Service role full access questions" ON dukigo_exam_questions FOR ALL TO service_role USING (true);

-- [제보] 누구나 오류 제보 등록 가능, 본인 제보 조회 가능
CREATE POLICY "Anyone can insert reports" ON dukigo_question_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can select reports" ON dukigo_question_reports FOR SELECT USING (true);
CREATE POLICY "Service role full access reports" ON dukigo_question_reports FOR ALL TO service_role USING (true);

-- [프로필/학습/리워드] 본인 데이터 접근 및 서비스 롤 전체 허용
CREATE POLICY "Anyone can view profiles" ON dukigo_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON dukigo_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON dukigo_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON dukigo_profiles FOR ALL TO service_role USING (true);

CREATE POLICY "Users can manage own sessions" ON dukigo_study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access sessions" ON dukigo_study_sessions FOR ALL TO service_role USING (true);

CREATE POLICY "Users can manage own logs" ON dukigo_study_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access logs" ON dukigo_study_logs FOR ALL TO service_role USING (true);

CREATE POLICY "Users can manage own teacher groups" ON dukigo_teacher_groups FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Anyone can view teacher groups" ON dukigo_teacher_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access on teacher groups" ON dukigo_teacher_groups FOR ALL TO service_role USING (true);

CREATE POLICY "Users can manage own wrong answers" ON dukigo_wrong_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on wrong answers" ON dukigo_wrong_answers FOR ALL TO service_role USING (true);

CREATE POLICY "Users can view and insert own claims" ON dukigo_reward_claims FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access claims" ON dukigo_reward_claims FOR ALL TO service_role USING (true);

-- 7. Auth 유저 가입 시 자동 프로필 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_dukigo_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.dukigo_profiles (id, username, display_name, email, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 6)), COALESCE(new.raw_user_meta_data->>'display_name', '수험생'), new.email, 'STUDENT')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_dukigo_auth_user_created ON auth.users;
CREATE TRIGGER on_dukigo_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_dukigo_user();
