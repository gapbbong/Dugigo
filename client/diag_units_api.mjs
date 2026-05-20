import fs from 'fs';
import path from 'path';

// api/units/route.ts 실제 로직 그대로 시뮬레이션
const dataDir = path.resolve(process.cwd(), 'src', 'data', '전기기사');
const allFiles = fs.readdirSync(dataDir);
const filesToLoad = allFiles.filter(f => f.endsWith('.json') && !f.toLowerCase().includes('master'));

const examsMap = new Map();
const questionMap = new Map();

filesToLoad.forEach(file => {
  const fileContent = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  const data = JSON.parse(fileContent);
  const questions = Array.isArray(data) ? data : (data.questions || []);

  const fileNameUnit = file.replace(/\.json$/, '').trim();
  const isStandardUnitFile = /^\d+\./.test(fileNameUnit) || fileNameUnit.includes("족집게");

  questions.forEach(q => {
    const baseId = q.id || `${q.year || ''}_${q.round || ''}_${q.number}`;
    const qId = isStandardUnitFile ? `${fileNameUnit}__${baseId}` : baseId;

    if (questionMap.has(qId)) return;
    questionMap.set(qId, true);

    let y = q.year || data.year;
    let r = q.round || data.round;

    if (!r) r = q.id?.split('_')[1];
    if (r) {
      let roundStr = String(r).trim();
      if (/^\d+$/.test(roundStr)) roundStr = `${roundStr}회`;

      let examYear = String(y || '').replace(/[^0-9]/g, '').slice(0, 4);
      if (!examYear) {
        const yearInRound = roundStr.match(/(19|20)\d{2}/);
        if (yearInRound) examYear = yearInRound[0];
      }

      if (!examYear) return;
      const hasRound = /(\d+\s*회|상시)/.test(roundStr);
      if (!hasRound) return;

      roundStr = roundStr
        .replace(/(19|20)\d{2}년?\s*/g, '')
        .replace(/\s*(기출문제|전기기사|과년도|출제문제|기출|기능사|기사)\S*/g, '')
        .replace(/\s*\(.*?\)/g, '')
        .trim();

      if (/^\d+$/.test(roundStr)) roundStr = `${roundStr}회`;
      if (!/(회|상시)/.test(roundStr)) return;

      const suffix = (roundStr.includes('회') || roundStr.includes('상시')) ? '' : '회';
      const examKey = `${examYear}년 ${roundStr}${suffix}`;
      examsMap.set(examKey, (examsMap.get(examKey) || 0) + 1);
    }
  });
});

console.log("시뮬레이션 결과 examsMap 개수:", examsMap.size);
console.log(Array.from(examsMap.entries()));
