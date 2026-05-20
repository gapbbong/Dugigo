import fs from 'fs';
import path from 'path';

const massDir = 'e:/Quiz-extraction/output/전기기사_mass';
const files = fs.readdirSync(massDir).filter(f => f.endsWith('.json')).sort();

console.log("=== 첫 15개 페이지의 파일명, 추출된 round, 문항 번호 범위 ===");
files.slice(0, 20).forEach(f => {
  const content = fs.readFileSync(path.join(massDir, f), 'utf8');
  if (content.length < 5) return;
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data) && data.length > 0) {
      const r = data[0].round;
      const nums = data.map(q => q.number);
      console.log(`${f} [${r}]: 문항 번호 ${nums.join(', ')}`);
    }
  } catch(e) {}
});
