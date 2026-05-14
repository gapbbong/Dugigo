import fs from 'fs';
import path from 'path';

const DATA_ROOT = 'e:/DugiGo/client/src/data';

function normalizeText(text) {
    if (!text) return '';
    // 공백, 특수문자 제거하여 순수 텍스트만 비교
    return text.replace(/\s/g, '').replace(/[^\wㄱ-ㅎ가-힣]/g, '');
}

async function analyze() {
    const subjects = fs.readdirSync(DATA_ROOT).filter(f => fs.statSync(path.join(DATA_ROOT, f)).isDirectory());
    const results = [];

    for (const subject of subjects) {
        const dirPath = path.join(DATA_ROOT, subject);
        const files = fs.readdirSync(dirPath);
        const masterFile = files.find(f => f.toLowerCase().includes('master_db') || f.toLowerCase().includes('master') || f.includes('Literacy2'));

        if (!masterFile) continue;

        const data = JSON.parse(fs.readFileSync(path.join(dirPath, masterFile), 'utf-8'));
        const questions = Array.isArray(data) ? data : (data.questions || []);
        
        const questionCounts = new Map();
        
        questions.forEach(q => {
            const key = normalizeText(q.question);
            if (!key || key.length < 5) return; // 너무 짧은 지문은 제외
            questionCounts.set(key, (questionCounts.get(key) || 0) + 1);
        });

        let duplicateCount = 0;
        let totalOccurrencesOfDuplicates = 0;
        
        for (const [key, count] of questionCounts.entries()) {
            if (count >= 2) {
                duplicateCount++;
                totalOccurrencesOfDuplicates += count;
            }
        }

        results.push({
            subject,
            uniqueDuplicateQuestions: duplicateCount, // 중복된 문제 종류 수
            totalOccurrences: totalOccurrencesOfDuplicates, // 중복된 문제들의 총 등장 횟수
            totalQuestions: questions.length
        });
    }

    console.log('\n--- 직종별 중복 출제(2회 이상) 문항 분석 결과 ---');
    console.table(results.sort((a, b) => b.uniqueDuplicateQuestions - a.uniqueDuplicateQuestions));
}

analyze().catch(console.error);
