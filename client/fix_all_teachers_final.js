const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pwyflwjtafarkwbejoen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eWZsd2p0YWZhcmt3YmVqb2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNTIzMSwiZXhwIjoyMDg3MjExMjMxfQ.DWtKZHpkM9D-mR26mG1ncrVHi2vxIre3l7-9bH4IVEE';
const supabase = createClient(supabaseUrl, supabaseKey);

const subAssignments = [
    { email: "daegal96@kakao.com", g: 1, c: 1 },
    { email: "eunioioi@naver.com", g: 1, c: 2 },
    { email: "bbo_yaa_@naver.com", g: 1, c: 3 },
    { email: "assaree0306@naver.com", g: 1, c: 4 },
    { email: "slalee@kse.hs.kr", g: 1, c: 5 },
    { email: "jh850324@naver.com", g: 1, c: 6 },
    { email: "kkoma0911@kse.hs.kr", g: 2, c: 1 },
    { email: "unknown1@daum.net", g: 2, c: 2 },
    { email: "duo0083@Nate.com", g: 2, c: 3 },
    { email: "kimwh00@nate.com", g: 2, c: 4 },
    { email: "lkm9912@hanmail.net", g: 2, c: 5 },
    { email: "lsskor@nate.com", g: 2, c: 6 },
    { email: "royals@daum.net", g: 3, c: 1 },
    { email: "ssonagi0721@naver.com", g: 3, c: 2 },
    { email: "kbJseeun@naver.com", g: 3, c: 3 },
    { email: "okcosi@hanmail.net", g: 3, c: 4 },
    { email: "hamitgif@hanmail.net", g: 3, c: 5 },
    { email: "sodls2156@naver.com", g: 3, c: 6 }
];

const mainAssignments = [
    { email: "sean-song@daum.net", class: "1-3" } // 송원석 1-3 담임
];

async function run() {
    console.log("Teacher Assignment Rescue Operation starting...");

    // 1. Restore Sub Assignments
    for (const item of subAssignments) {
        const { error } = await supabase
            .from('teachers')
            .update({ sub_grade: item.g, sub_class: item.c })
            .eq('email', item.email);
        
        if (error) console.error(`Failed to update SUB for ${item.email}:`, error.message);
        else console.log(`Restored SUB ${item.g}-${item.c} for ${item.email}`);
    }

    // 2. Main Assignments
    for (const item of mainAssignments) {
        const { error } = await supabase
            .from('teachers')
            .update({ assigned_class: item.class, role: 'homeroom_teacher' })
            .eq('email', item.email);
        
        if (error) console.error(`Failed to update MAIN for ${item.email}:`, error.message);
        else console.log(`Restored MAIN ${item.class} for ${item.email}`);
    }

    console.log("Operation complete.");
}

run();
