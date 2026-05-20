import fs from 'fs';
import path from 'path';

const massDir = 'e:/Quiz-extraction/output/전기기사_mass';
const files = fs.readdirSync(massDir).filter(f => f.endsWith('.json')).sort();

let runningYear = '2021';
let runningRound = '1';

const roundCounts = {};
let totalValid = 0;

files.forEach(f => {
  const content = fs.readFileSync(path.join(massDir, f), 'utf8');
  if (content.length < 5) return;
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data) || data.length === 0) return;

    // 페이지 내에서 유효한 연도/회차를 찾기 (가장 명확한 것)
    let foundYear = null;
    let foundRound = null;

    for (const q of data) {
      const rStr = String(q.round || '').trim();
      const match = rStr.match(/(202\d)년\s*(\d)회/);
      if (match) {
        foundYear = match[1];
        foundRound = match[2];
        break;
      }
    }

    if (foundYear && foundRound) {
      runningYear = foundYear;
      runningRound = foundRound;
    }

    const currentKey = `${runningYear}년 ${runningRound}회`;
    if (!roundCounts[currentKey]) roundCounts[currentKey] = 0;

    data.forEach(q => {
      if (q.question && q.question.trim()) {
        roundCounts[currentKey]++;
        totalValid++;
      }
    });

  } catch(e) {}
});

console.log(`=== Running Round 상속 시뮬레이션 결과 (총 ${totalValid}문항) ===`);
Object.keys(roundCounts).sort().reverse().forEach(k => {
  console.log(`[${k}]: ${roundCounts[k]}문항`);
});
