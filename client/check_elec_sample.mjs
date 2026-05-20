import fs from 'fs';
import path from 'path';

const file = path.resolve(process.cwd(), 'src', 'data', '전기기사', '01. 전기자기학.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const qList = Array.isArray(data) ? data : (data.questions || []);

console.log("전기기사 01. 전기자기학 첫 2개 문제 샘플:");
console.log(qList.slice(0, 2));
