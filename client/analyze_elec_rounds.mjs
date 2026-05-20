import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'src', 'data', '전기기사');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.toLowerCase().includes('master'));

const roundSubjMap = {};

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  const questions = Array.isArray(data) ? data : (data.questions || []);
  const subjName = file.replace(/\.json$/, '');

  questions.forEach(q => {
    let y = q.year || data.year;
    let r = q.round || data.round;
    if (!r) r = q.id?.split('_')[1];

    if (r) {
      let roundStr = String(r).trim();
      if (/^\d+$/.test(roundStr)) roundStr = `${roundStr}회`;

      let examYear = String(y || '').replace(/[^0-9]/g, '').slice(0, 4);
      if (!examYear) {
        const yrMatch = roundStr.match(/(19|20)\d{2}/);
        if (yrMatch) examYear = yrMatch[0];
      }

      if (!examYear || !/(\d+\s*회|상시)/.test(roundStr)) return;

      roundStr = roundStr.replace(/(19|20)\d{2}년?\s*/g, '').replace(/\s*(기출문제|전기기사|과년도|출제문제|기출|기능사|기사)\S*/g, '').replace(/\s*\(.*?\)/g, '').trim();
      if (/^\d+$/.test(roundStr)) roundStr = `${roundStr}회`;
      if (!/(회|상시)/.test(roundStr)) return;

      const suffix = (roundStr.includes('회') || roundStr.includes('상시')) ? '' : '회';
      const key = `${examYear}년 ${roundStr}${suffix}`;

      if (!roundSubjMap[key]) roundSubjMap[key] = {};
      roundSubjMap[key][subjName] = (roundSubjMap[key][subjName] || 0) + 1;
    }
  });
});

console.log("=== 회차별 과목 문항 분포 ===");
Object.keys(roundSubjMap).sort().reverse().forEach(key => {
  const counts = roundSubjMap[key];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`[${key}] 총 ${total}문항`);
  for (const [subj, cnt] of Object.entries(counts)) {
    console.log(`  - ${subj}: ${cnt}문항`);
  }
});
