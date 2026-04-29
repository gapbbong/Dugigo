const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://pwyflwjtafarkwbejoen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eWZsd2p0YWZhcmt3YmVqb2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNTIzMSwiZXhwIjoyMDg3MjExMjMxfQ.DWtKZHpkM9D-mR26mG1ncrVHi2vxIre3l7-9bH4IVEE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🚀 Teachers.csv 기반 교사 정보 및 부담임 일괄 업데이트 시작...");

    const csvPath = 'e:/1cl/Teachers.csv';
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n');

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        const email = parts[0]?.trim();
        const name = parts[1]?.trim();
        const mainGrade = parts[2]?.trim();
        const mainClass = parts[3]?.trim();
        const mainPhone = parts[4]?.trim();
        const subGrade = parts[5]?.trim();
        const subClass = parts[6]?.trim();
        const subPhone = parts[7]?.trim();

        if (!name) continue;

        console.log(`Processing ${name} (${email || 'No Email'})...`);

        let updates = {
            name: name,
            phone: mainPhone || subPhone || null,
            sub_grade: subGrade ? parseInt(subGrade) : null,
            sub_class: subClass ? parseInt(subClass) : null
        };

        if (mainGrade && mainClass) {
            updates.assigned_class = `${mainGrade}-${mainClass}`;
            updates.role = 'homeroom_teacher';
        }

        // 1. Email로 찾기
        if (email && email !== '0') {
            const { error } = await supabase
                .from('teachers')
                .update(updates)
                .eq('email', email);
            if (error) console.error(`❌ ${name} 업데이트 실패 (Email):`, error.message);
            else console.log(`✅ ${name} 업데이트 완료 (Email)`);
        } else {
            // 2. Name으로 찾기 (Email이 '0'이거나 없는 경우)
            const { error } = await supabase
                .from('teachers')
                .update(updates)
                .eq('name', name);
            if (error) console.error(`❌ ${name} 업데이트 실패 (Name):`, error.message);
            else console.log(`✅ ${name} 업데이트 완료 (Name)`);
        }
    }

    console.log("\n✨ 모든 교사 정보 업데이트가 완료되었습니다.");
}

run();
