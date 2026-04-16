import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
    console.log('--- 슈파베이스 삭제 진단 시작 ---');

    // 1. 현재 개수 확인
    const { count: beforeCount, error: countError1 } = await supabase
        .from('dukigo_exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', 'ELECTRICITY');
    
    if (countError1) {
        console.error('조회 오류 1:', countError1.message);
        return;
    }
    console.log(`삭제 전 ELECTRICAL 문항 수: ${beforeCount}`);

    // 2. 삭제 시도
    const { error: deleteError } = await supabase
        .from('dukigo_exam_questions')
        .delete()
        .eq('subject_id', 'ELECTRICITY');

    if (deleteError) {
        console.error('삭제 명령 오류!', deleteError.message);
    } else {
        console.log('삭제 명령 성공 (서버 응답 받음)');
    }

    // 3. 다시 개수 확인
    const { count: afterCount, error: countError2 } = await supabase
        .from('dukigo_exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', 'ELECTRICITY');
    
    if (countError2) {
        console.error('조회 오류 2:', countError2.message);
        return;
    }
    console.log(`삭제 후 ELECTRICAL 문항 수: ${afterCount}`);

    if (beforeCount > 0 && afterCount > 0 && beforeCount === afterCount) {
        console.error('⚠️ 경고: 삭제 명령은 성공했으나 데이터가 지워지지 않았습니다! (RLS 또는 권한 정책 때문일 수 있습니다)');
    }
}

diagnostic();
