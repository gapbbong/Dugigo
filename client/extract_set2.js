const fs = require('fs');

const data = JSON.parse(fs.readFileSync('e:/DugiGo/client/src/data/승강기기능사/MASTER_DB.json', 'utf8'));
const questionsArray = Array.isArray(data) ? data : (data.questions || []);

const classifyQuestion = (sub, q) => {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
  if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|전동기|발전기|브리지|오옴|플레밍/.test(text)) return "전기이론";
  if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "기계일반";
  if (/안전관리|일상점검|정기검사|유지관리|비상벨|안전장치|보수|점검/.test(text)) return "승강기 점검 및 보수";
  return "승강기 개론";
};

const mechQuestions = questionsArray.filter(q => classifyQuestion('승강기기능사', q) === "기계일반");

const sorted = mechQuestions.sort((a, b) => {
  const textA = (a.question || '').toString();
  const textB = (b.question || '').toString();
  return textA.localeCompare(textB);
});

const set2 = sorted.slice(30, 60);

const output = set2.map((q, i) => `[${i+1}] ${q.question}\n- ${q.choices ? q.choices.join(' / ') : 'No choices'}\n- 정답: ${q.answer}\n- 해설: ${q.explanation}`).join('\n\n');

fs.writeFileSync('e:/DugiGo/client/scratch_set2.txt', output);
console.log(`Saved ${set2.length} questions to scratch_set2.txt`);
