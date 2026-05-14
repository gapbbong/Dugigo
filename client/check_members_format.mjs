import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMembers() {
    const { data, error } = await supabase.from('dukigo_teacher_groups').select('*').limit(3);
    if (error) {
        console.error("❌ 에러:", error.message);
    } else {
        data.forEach(g => {
            console.log(`📌 그룹명: ${g.name}`);
            console.log(`👥 멤버 데이터 타입: ${typeof g.members}`);
            console.log(`📝 멤버 데이터 내용:`, g.members);
            console.log("-------------------");
        });
    }
}

checkMembers();
