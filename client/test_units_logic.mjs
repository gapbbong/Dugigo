import fs from 'fs';
import path from 'path';

const subject = '승강기기능사';
const dataDir = path.join(process.cwd(), 'src/data', subject);

const filesToLoad = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.json') && !f.includes('_CLEAN'))
  .sort();

const questionMap = new Map();
const normalize = (text) => (text || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "").trim();

filesToLoad.forEach(file => {
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    questions.forEach(q => {
        const qId = q.id || `${q.year || ''}_${q.round || ''}_${q.number}`;
        if (!questionMap.has(qId)) {
            questionMap.set(qId, q);
        }
    });
});

const uniqueFrequentMap = new Map();
Array.from(questionMap.values()).forEach((q) => {
  if ((q.frequency || 0) >= 2) {
    const cleanQuestion = normalize(q.question);
    const cleanChoices = (q.choices || []).map((c) => normalize(c)).join("|");
    const contentKey = `${cleanQuestion}_${cleanChoices}`;
    if (!uniqueFrequentMap.has(contentKey)) {
      uniqueFrequentMap.set(contentKey, q);
    }
  }
});

const frequentQuestions = Array.from(uniqueFrequentMap.values());
const FREQ_PAGE_SIZE = 30;
const freqParts = Math.ceil(frequentQuestions.length / FREQ_PAGE_SIZE);

console.log(`📊 승강기 전체 고유 문항: ${questionMap.size}`);
console.log(`🔥 승강기 빈출 문항: ${frequentQuestions.length}`);
console.log(`📦 생성될 공략 섹션 수: ${freqParts}`);

if (freqParts < 7) {
    console.log("💡 현재 로직으로는 07, 08이 나올 수 없습니다. 캐시 문제거나 다른 파일이 개입했을 수 있습니다.");
}
