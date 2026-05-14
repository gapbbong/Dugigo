import fs from 'fs';
import path from 'path';

const DATA_ROOT = 'e:/DugiGo/client/src/data';

function normalizeText(text) {
    if (!text) return '';
    return text.replace(/\s/g, '').replace(/[^\wㄱ-ㅎ가-힣]/g, '');
}

async function inject() {
    const subjects = fs.readdirSync(DATA_ROOT).filter(f => fs.statSync(path.join(DATA_ROOT, f)).isDirectory());

    for (const subject of subjects) {
        const dirPath = path.join(DATA_ROOT, subject);
        const files = fs.readdirSync(dirPath);
        const masterFile = files.find(f => f.toLowerCase().includes('master_db') || f.toLowerCase().includes('master') || f.includes('Literacy2') || f.includes('history_master'));

        if (!masterFile) continue;

        const masterPath = path.join(dirPath, masterFile);
        const data = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
        const questions = Array.isArray(data) ? data : (data.questions || []);
        
        // 1. 빈도수 계산
        const freqMap = new Map();
        questions.forEach(q => {
            const key = normalizeText(q.question);
            if (key) freqMap.set(key, (freqMap.get(key) || 0) + 1);
        });

        // 2. 데이터 주입
        const updatedQuestions = questions.map(q => {
            const key = normalizeText(q.question);
            q.frequency = freqMap.get(key) || 1;
            return q;
        });

        // 3. 마스터 DB 저장 (빈도순 정렬은 하지 않음, 원본 순서 유지)
        if (Array.isArray(data)) {
            fs.writeFileSync(masterPath, JSON.stringify(updatedQuestions, null, 2));
        } else {
            if (data.questions) data.questions = updatedQuestions;
            else if (data.data) data.data = updatedQuestions;
            fs.writeFileSync(masterPath, JSON.stringify(data, null, 2));
        }

        console.log(`[DONE] ${subject}: Injected frequency info into ${questions.length} questions.`);
    }
}

inject().catch(console.error);
