import fs from 'fs';
import path from 'path';

const subject = '승강기기능사';
const dataDir = path.join(process.cwd(), 'src/data', subject);
const masterFile = path.join(dataDir, 'MASTER_DB.json');

console.log(`📂 대상 경로: ${masterFile}`);

if (!fs.existsSync(masterFile)) {
    console.log("❌ 파일을 찾을 수 없습니다!");
} else {
    try {
        const raw = fs.readFileSync(masterFile, 'utf-8');
        const data = JSON.parse(raw);
        const questions = Array.isArray(data) ? data : (data.questions || []);
        
        console.log(`✅ 파일 로드 성공! 전체 문항 수: ${questions.length}`);
        
        const frequent = questions.filter(q => (q.frequency || 0) >= 2);
        console.log(`✅ 빈출 문항 수 (frequency >= 2): ${frequent.length}`);
        
        if (frequent.length === 0) {
            console.log("⚠️ 빈출 문항이 0개입니다. frequency 필드를 확인해야 합니다.");
            console.log("샘플 문항:", JSON.stringify(questions[0], null, 2));
        }
    } catch (e) {
        console.error("❌ JSON 파싱 에러:", e.message);
    }
}
