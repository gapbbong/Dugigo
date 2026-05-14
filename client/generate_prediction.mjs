import fs from 'fs';
import path from 'path';

const subject = '컴퓨터활용능력 2급';
const dataDir = path.join('src', 'data', subject);
const masterFile = path.join(dataDir, 'Literacy2_MASTER_DB.json');

console.log(`🔮 [AI Prediction Engine] Analyzing ${subject}...`);

if (!fs.existsSync(masterFile)) {
    console.error('Master DB not found');
    process.exit(1);
}

const masterData = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));

// 과목별 분리
const sub1 = masterData.filter(q => q.subject?.includes('1과목') || q.sub_unit === '01. 컴퓨터 일반');
const sub2 = masterData.filter(q => q.subject?.includes('2과목') || q.sub_unit === '02. 스프레드시트 일반');

const pickQuestions = (pool, count) => {
    // 1. 빈도수 높은 순으로 정렬
    const sorted = [...pool].sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    
    // 2. 전략적 배분
    const selected = [];
    const usedIds = new Set();

    // A. 초고빈도 (TOP 8) - 무조건 나오는 문제
    const highFreq = sorted.slice(0, 8);
    highFreq.forEach(q => {
        selected.push(q);
        usedIds.add(q.id);
    });

    // B. 최신 경향 (2023~2024) - 최근 핫한 문제 7개
    const recent = sorted.filter(q => !usedIds.has(q.id) && (q.round_info?.includes('2023') || q.round_info?.includes('2024')))
                         .slice(0, 7);
    recent.forEach(q => {
        selected.push(q);
        usedIds.add(q.id);
    });

    // C. 변별력/패턴 (빈도 2 이상 중 랜덤) - 함정용 5개
    const patterns = sorted.filter(q => !usedIds.has(q.id) && (q.frequency || 0) >= 2)
                           .sort(() => Math.random() - 0.5)
                           .slice(0, 5);
    patterns.forEach(q => {
        selected.push(q);
        usedIds.add(q.id);
    });

    return selected;
};

const finalQuestions = [
    ...pickQuestions(sub1, 20),
    ...pickQuestions(sub2, 20)
].map((q, idx) => ({
    ...q,
    number: idx + 1,
    id: `ai_pred_2025_${idx + 1}`,
    round_info: "2025년 AI 족집게 예상문제"
}));

const outputFile = path.join(dataDir, '2025년 AI 족집게 예상문제.json');
fs.writeFileSync(outputFile, JSON.stringify(finalQuestions, null, 2));

console.log(`✅ [AI Prediction Engine] Generated 40 predicted questions: ${outputFile}`);
