import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTop5() {
  const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10 });
  const { data: profiles } = await supabase.from('dukigo_profiles').select('*');
  const profMap = new Map((profiles || []).map(p => [p.id, p]));

  console.log("--- 상위 5명 상세 프로필 ---");
  authUsers?.users?.slice(0, 5).forEach(u => {
    const p = profMap.get(u.id);
    console.log(`Email: ${u.email}`);
    console.log(` -> profile:`, p ? { id: p.id, display_name: p.display_name, username: p.username, email: p.email } : "없음!");
  });
}

checkTop5();
