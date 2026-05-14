import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    // Supabase에서 테이블 목록을 직접 가져오는 공식 API는 없으므로, 
    // 대표적인 테이블들에 쿼리를 날려보거나 정보를 유추합니다.
    console.log("🔍 [DB 테이블 탐색 시작]");
    
    const tables = [
        'dukigo_profiles',
        'dukigo_teacher_groups',
        'dukigo_group_members',
        'dukigo_groups',
        'students',
        'classes'
    ];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ ${table}: 존재하지 않거나 접근 불가 (${error.message})`);
        } else {
            console.log(`✅ ${table}: 존재함`);
            if (data && data.length > 0) {
                console.log(`   - 샘플 컬럼: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
}

listTables();
