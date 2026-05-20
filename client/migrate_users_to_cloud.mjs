import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const oldUrl = "http://10.128.49.91:8000";
const oldServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";
const oldSupabase = createClient(oldUrl, oldServiceKey);

const newUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const newServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const newSupabase = createClient(newUrl, newServiceKey);

async function migrateUsers() {
  console.log("=================================================");
  console.log(" 🚀 기존 가입자(Auth + Profiles) -> 클라우드 전면 마이그레이션 ");
  console.log("=================================================\n");

  console.log("1. 기존 DB에서 Auth 회원 목록 및 프로필 로드 중...");
  const { data: oldAuth, error: authErr } = await oldSupabase.auth.admin.listUsers();
  if (authErr) {
    console.error("❌ 기존 Auth 조회 실패:", authErr.message);
    process.exit(1);
  }

  const { data: oldProfiles, error: profErr } = await oldSupabase.from('dukigo_profiles').select('*');
  if (profErr) {
    console.error("❌ 기존 Profiles 조회 실패:", profErr.message);
    process.exit(1);
  }

  const users = oldAuth?.users || [];
  const profilesMap = new Map((oldProfiles || []).map(p => [p.id, p]));

  console.log(`✅ 총 ${users.length}명의 회원 및 ${oldProfiles?.length}개 프로필 감지 완료. 클라우드 이식 시작...\n`);

  let successCount = 0;
  for (const u of users) {
    try {
      // 1. Auth 계정 생성 (기존 ID 유지, 임시 비밀번호 발급)
      const { data: createdUser, error: createErr } = await newSupabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        email_confirm: true,
        password: 'Dugigo1234!', // 임시 공통 비밀번호
        user_metadata: u.raw_user_meta_data || {}
      });

      if (createErr && !createErr.message.includes('already exists')) {
        console.error(`❌ [${u.email}] Auth 생성 실패:`, createErr.message);
        continue;
      }

      // 2. Profile 정보 복구 (경험치, 칭호, 학번 등 완벽 유지)
      const oldProf = profilesMap.get(u.id);
      if (oldProf) {
        const { error: upsertErr } = await newSupabase.from('dukigo_profiles').upsert({
          id: u.id,
          username: oldProf.username || oldProf.display_name || u.email.split('@')[0],
          display_name: oldProf.display_name || oldProf.username || u.email.split('@')[0],
          email: u.email,
          role: oldProf.role || 'STUDENT',
          name: oldProf.name || oldProf.display_name,
          school_name: oldProf.school_name,
          grade: oldProf.grade,
          class_num: oldProf.class_num,
          is_approved: oldProf.is_approved,
          exp_points: oldProf.exp_points || 0,
          level_title: oldProf.level_title || 'B3층 주차 요원',
          created_at: oldProf.created_at
        });

        if (upsertErr) {
          console.error(`❌ [${u.email}] 프로필 복구 실패:`, upsertErr.message);
        } else {
          successCount++;
          console.log(`✅ [${successCount}/${users.length}] ${u.email} (경험치: ${oldProf.exp_points || 0}점) 완벽 이식 성공!`);
        }
      } else {
        successCount++;
        console.log(`✅ [${successCount}/${users.length}] ${u.email} (Auth 단독) 이식 성공!`);
      }

    } catch (err) {
      console.error(`❌ [${u.email}] 처리 중 오류:`, err.message);
    }
  }

  console.log("\n=================================================");
  console.log(` 🎉 총 ${successCount}명의 기존 가입자 데이터베이스 마이그레이션 성공! `);
  console.log(" (안내: 기존 회원들의 비밀번호는 'Dugigo1234!'로 초기화되었습니다.)");
  console.log("=================================================");
}

migrateUsers();
