import fs from 'fs';

const rawPath = 'e:/Quiz-extraction/output/전기기사_mass/page_287.json';
const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
console.log("page_287 원본 데이터:");
console.log(data);
