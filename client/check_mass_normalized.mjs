import fs from 'fs';
import path from 'path';

const massDir = 'e:/Quiz-extraction/output/전기기사_mass';
const files = fs.readdirSync(massDir).filter(f => f.endsWith('.json'));

let validQuestions = [];

files.forEach(f => {
  const content = fs.readFileSync(path.join(massDir, f), 'utf8');
  if (content.length < 5) return;
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      data.forEach(q => {
        if (q.question && q.question.trim()) {
          validQuestions.push({ file: f, ...q });
        }
      });
    }
  } catch(e) {}
});

const roundMap = {};
validQuestions.forEach(q => {
  let r = q.round || '';
  let match = r.match(/(202\d)년\s*(\d)회/);
  let y = '', rd = '';
  if (match) {
    y = match[1];
    rd = match[2];
  } else {
    return;
  }
  const key = `${y}년 ${rd}회`;
  roundMap[key] = (roundMap[key] || 0) + 1;
});

console.log("=== mass_extract 원본 추출물의 정규화 후 회차별 문항 수 ===");
Object.keys(roundMap).sort().reverse().forEach(k => {
  console.log(`[${k}]: ${roundMap[k]}문항`);
});
