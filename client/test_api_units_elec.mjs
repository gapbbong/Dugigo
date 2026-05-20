import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기사';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let totalQuestions = 0;
const unitCounts = {};
const freqMap = new Map();

files.forEach(f => {
  if (f === 'MASTER_DB.json') return;
  const content = fs.readFileSync(path.join(dataDir, f), 'utf8');
  const data = JSON.parse(content);
  unitCounts[f] = data.length;
  totalQuestions += data.length;

  data.forEach(q => {
    const text = String(q.question || '').trim().replace(/\s+/g, '');
    freqMap.set(text, (freqMap.get(text) || 0) + 1);
  });
});

console.log(`단원별 파일 로드 결과 (총 ${totalQuestions}문항):`, unitCounts);

let freqCount = 0;
freqMap.forEach((cnt, text) => {
  if (cnt >= 2) freqCount++;
});
console.log(`중복 출제된 고유 문항 수 (frequency >= 2): ${freqCount}문항`);
