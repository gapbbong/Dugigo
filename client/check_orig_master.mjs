import fs from 'fs';

const origPath = 'e:/Quiz-extraction-raw/backups_morning/ElectricExam_MASTER_DB_orig.json';
const data = JSON.parse(fs.readFileSync(origPath, 'utf8'));
console.log("orig DB 문항 수:", data.length);

const roundMap = {};
data.forEach(q => {
  const y = q.year || '';
  const r = q.round || '';
  const key = `${y}년 ${r}회`;
  roundMap[key] = (roundMap[key] || 0) + 1;
});
console.log("orig 회차별 분포:");
console.log(roundMap);
