import fs from 'fs';
import path from 'path';

// Mock searchParams for API test
const subject = '승강기기능사';
const dataDir = path.join(process.cwd(), 'src/data', subject);
const masterFile = path.join(dataDir, 'MASTER_DB.json');

if (fs.existsSync(masterFile)) {
    const data = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));
    const questions = Array.isArray(data) ? data : (data.questions || []);
    
    const frequentQuestions = questions.filter(q => (q.frequency || 0) >= 2);
    console.log(`📊 승강기 전체 빈출 문항 수: ${frequentQuestions.length}`);
    
    const FREQ_PAGE_SIZE = 30;
    const freqParts = Math.ceil(frequentQuestions.length / FREQ_PAGE_SIZE);
    
    console.log(`✅ 생성될 공략 수: ${freqParts}개`);
    for (let i = 0; i < freqParts; i++) {
        const start = i * FREQ_PAGE_SIZE;
        const end = Math.min((i + 1) * FREQ_PAGE_SIZE, frequentQuestions.length);
        console.log(`   - 공략 ${i+1}: ${start} ~ ${end} (${end-start}문항)`);
    }
} else {
    console.log("❌ 승강기 MASTER_DB를 찾을 수 없습니다.");
}
