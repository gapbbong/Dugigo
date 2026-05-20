import fs from 'fs';
import path from 'path';

const dir = path.resolve(process.cwd(), 'src', 'data', '전기기사');
const files = fs.readdirSync(dir);

console.log("=== 전기기사 로컬 파일 문항 수 점검 ===");
let total = 0;
files.forEach(f => {
  if (f.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const qList = Array.isArray(data) ? data : (data.questions || []);
    console.log(` - ${f}: ${qList.length}문항`);
    total += qList.length;
  }
});
console.log(`총 문항 수 합계 (MASTER 포함): ${total}문항`);
