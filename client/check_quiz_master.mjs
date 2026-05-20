import fs from 'fs';
import path from 'path';

const file = path.resolve('e:/Quiz-extraction/output/전기기사_MASTER_DB.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const questions = Array.isArray(data) ? data : (data.questions || []);

console.log("Quiz-extraction output 전기기사_MASTER_DB.json 문항 수:", questions.length);

const roundMap = {};
questions.forEach(q => {
  const y = q.year || '2021';
  const r = q.round || '1';
  const key = `${y}년 ${r}회`;
  roundMap[key] = (roundMap[key] || 0) + 1;
});
console.log("회차별 분포:");
console.log(roundMap);
