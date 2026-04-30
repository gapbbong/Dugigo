const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pwyflwjtafarkwbejoen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eWZsd2p0YWZhcmt3YmVqb2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNTIzMSwiZXhwIjoyMDg3MjExMjMxfQ.DWtKZHpkM9D-mR26mG1ncrVHi2vxIre3l7-9bH4IVEE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix1_3() {
    console.log("🛠️ 1학년 3반 교사 정보 업데이트 전문 시작...");

    // 1. 송원석 선생님 (담임 1-3)
    const { data: song, error: sErr } = await supabase.from('teachers').select('*').eq('email', 'sean-song@daum.net').single();
    if (sErr) console.error("송원석 조회 실패:", sErr.message);
    else {
        await supabase.from('teachers').update({
            assigned_class: '1-3',
            role: 'homeroom_teacher'
        }).eq('email', 'sean-song@daum.net');
        console.log("✅ 송원석 선생님 (1-3 담임) 업데이트 완료");
    }

    // 2. 김보윤 선생님 (부담임 1-3)
    const { data: kim, error: kErr } = await supabase.from('teachers').select('*').eq('email', 'bbo_yaa_@naver.com').single();
    if (kErr) console.error("김보윤 조회 실패:", kErr.message);
    else {
        await supabase.from('teachers').update({
            sub_grade: 1,
            sub_class: 3,
            role: 'subject_teacher'
        }).eq('email', 'bbo_yaa_@naver.com');
        console.log("✅ 김보윤 선생님 (1-3 부담임) 업데이트 완료");
    }
}

fix1_3();
