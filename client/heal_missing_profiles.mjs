import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function healProfiles() {
  console.log("🛠️ [클라우드 DB 누락 프로필 완벽 탐색 및 복구 시작]");

  const { data: authUsers, error: aErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (aErr) {
    console.error("❌ Auth Users 조회 에러:", aErr.message);
    return;
  }

  const { data: profiles, error: pErr } = await supabase.from('dukigo_profiles').select('id');
  const existingIds = new Set((profiles || []).map(p => p.id));

  console.log(`감지된 총 Auth 회원 수: ${authUsers?.users?.length}명 | 기존 프로필 수: ${profiles?.length}개`);

  let healCount = 0;

  for (const u of (authUsers?.users || [])) {
    if (!existingIds.has(u.id)) {
      const prefix = u.email ? u.email.split('@')[0] : 'user';
      const role = u.email?.includes('serv') || u.email?.includes('gapbbong') ? 'TEACHER' : 'STUDENT';
      const name = role === 'TEACHER' ? prefix : prefix;

      console.log(`⚠️ 프로필 누락 감지: ${u.email} -> 프로필 생성 중...`);
      const { error: insErr } = await supabase.from('dukigo_profiles').insert({
        id: u.id,
        username: prefix,
        display_name: name,
        email: u.email,
        role: role,
        name: name,
        exp_points: role === 'TEACHER' ? 9999 : 0,
        level_title: role === 'TEACHER' ? '👑 두기고 마스터' : 'B3층 주차 요원'
      });

      if (insErr) {
        console.error(` ❌ 생성 에러 (${u.email}):`, insErr.message);
      } else {
        healCount++;
        console.log(` ✅ 복구 완료! (${u.email})`);
      }
    }
  }

  console.log(`\n🎉 총 ${healCount}개의 누락된 프로필 완벽 복구 완료!`);
}

healProfiles();
