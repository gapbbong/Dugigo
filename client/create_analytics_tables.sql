-- ==========================================
-- 📊 Learning Analytics & Gamification Tables
-- ==========================================

-- 1. 사용자 프로필 (역할 관리 및 게이미피케이션)
-- 목적: 학생/교사 역할 분리, 관리자 승인, 레벨업 호칭 및 경험치 저장
CREATE TABLE IF NOT EXISTS dukigo_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  name TEXT NOT NULL,
  school_name TEXT,
  grade INT,
  class_num INT,
  is_approved BOOLEAN DEFAULT false, -- 교사 가입 시 관리자 승인 여부
  exp_points INT DEFAULT 0, -- 누적 경험치
  level_title TEXT DEFAULT 'B3층 주차 요원', -- 승강기 레벨업 호칭
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dukigo_profiles_role ON dukigo_profiles(role);
CREATE INDEX IF NOT EXISTS idx_dukigo_profiles_school ON dukigo_profiles(school_name, grade, class_num);

-- 2. 학습 세션 테이블 (자기주도 학습 습관 및 실시간 관제)
-- 목적: 접속 유지 시간, 세션당 풀이 수, 현재 접속 중인 학생 모니터링
CREATE TABLE IF NOT EXISTS dukigo_study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ, -- NULL이면 현재 학습 중으로 간주 (실시간 관제용)
  duration_seconds INT DEFAULT 0,
  questions_attempted INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dukigo_study_sessions_user ON dukigo_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dukigo_study_sessions_active ON dukigo_study_sessions(end_time) WHERE end_time IS NULL;

-- 3. 문항 풀이 로그 (취약 파트 정밀 진단)
-- 목적: 학생 개개인 및 학급 전체의 단원별/유형별 정답률 분석
CREATE TABLE IF NOT EXISTS dukigo_study_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES dukigo_study_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  question_id TEXT NOT NULL,
  category TEXT, -- 단원명 또는 문제 유형 (취약 파트 분석용)
  is_correct BOOLEAN NOT NULL,
  user_answer TEXT,
  solved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dukigo_study_logs_user ON dukigo_study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dukigo_study_logs_category ON dukigo_study_logs(subject, category);

-- 4. 보상 및 리워드 요청 (실질적 보상 연계)
-- 목적: 발전기금 기반 목표 달성자 필터링 및 시상 상태 관리
CREATE TABLE IF NOT EXISTS dukigo_reward_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 예: '1만원 기프티콘', '치킨 교환권'
  target_criteria TEXT, -- 달성 기준 (예: '경험치 1000 달성')
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_note TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dukigo_reward_claims_status ON dukigo_reward_claims(status);

-- ==========================================
-- RLS (Row Level Security) 설정
-- ==========================================

ALTER TABLE dukigo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dukigo_reward_claims ENABLE ROW LEVEL SECURITY;

-- Profiles: 누구나 자신의 프로필 조회 가능, 수정은 제한적
CREATE POLICY "Users can view own profile" ON dukigo_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- 교사는 소속 학생들의 프로필 조회 가능하도록 추가 정책 필요

-- Sessions: 본인의 세션만 생성/수정/조회 가능
CREATE POLICY "Users can manage own sessions" ON dukigo_study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Logs: 본인의 로그만 생성/조회 가능
CREATE POLICY "Users can manage own logs" ON dukigo_study_logs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Rewards: 본인의 리워드만 조회/생성 가능
CREATE POLICY "Users can view own claims" ON dukigo_reward_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own claims" ON dukigo_reward_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin & Teacher Access (서비스 롤은 전체 접근 허용)
CREATE POLICY "Service role full access on profiles" ON dukigo_profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on sessions" ON dukigo_study_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on logs" ON dukigo_study_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on claims" ON dukigo_reward_claims FOR ALL TO service_role USING (true);
