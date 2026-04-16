import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('환경 변수 로드 실패. (.env.local 파일을 확인하세요)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('--- 슈파베이스 스키마 확인 중 ---');
    const { data, error } = await supabase
        .from('dukigo_exam_questions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('오류 발생:', error.message);
    } else {
        console.log('샘플 데이터:', JSON.stringify(data, null, 2));
    }
}

checkSchema();
