import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixTeachers() {
  console.log("🛠️ [교사/관리자 계정 표시 이름 ID로 변경]");

  await supabase.from('dukigo_profiles').update({
    username: 'gapbbong',
    display_name: 'gapbbong',
    name: 'gapbbong'
  }).eq('id', '50e36b7f-0ff4-4105-94a2-0b3e7d96d861');

  await supabase.from('dukigo_profiles').update({
    username: 'serv',
    display_name: 'serv',
    name: 'serv'
  }).eq('id', '4ef10d31-3424-4081-bbbd-e9cdf114fa69');

  console.log("✅ gapbbong & serv 표시 이름 완벽 변경 완료!");
}

fixTeachers();
