import { createClient } from '@supabase/supabase-js';

const oldUrl = "http://10.128.49.91:8000";
const oldServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const oldSupabase = createClient(oldUrl, oldServiceKey);

async function checkOldUsers() {
  console.log("🔍 [기존 DB 탐색 시작] " + oldUrl);

  try {
    const { data: users, error: authErr } = await oldSupabase.auth.admin.listUsers();
    if (authErr) {
      console.log("❌ Auth Users 조회 에러:", authErr.message);
    } else {
      console.log(`✅ 기존 가입자 총 ${users?.users?.length || 0}명 감지됨!`);
      users?.users?.forEach(u => {
        console.log(`   - ${u.email} (생성일: ${new Date(u.created_at).toLocaleDateString()})`);
      });
    }

    const { data: profiles, error: profErr } = await oldSupabase.from('dukigo_profiles').select('*');
    if (profErr) {
      console.log("❌ Profiles 조회 에러:", profErr.message);
    } else {
      console.log(`✅ 기존 프로필 총 ${profiles?.length || 0}개 감지됨!`);
    }

    const { data: groups, error: grpErr } = await oldSupabase.from('dukigo_teacher_groups').select('*');
    if (grpErr) {
      console.log("❌ Teacher Groups 조회 에러:", grpErr.message);
    } else {
      console.log(`✅ 기존 교사 그룹 총 ${groups?.length || 0}개 감지됨!`);
    }

  } catch (err) {
    console.log("❌ 서버 통신 실패:", err.message);
  }
}

checkOldUsers();
