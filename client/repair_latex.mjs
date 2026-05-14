import fs from 'fs';

const masterFile = 'src/data/승강기기능사/MASTER_DB.json';
let content = fs.readFileSync(masterFile, 'utf-8');

// 1. 4개 이상의 역슬래시를 2개로 (JSON 기준)
// 2. 2개 이상의 역슬래시를 1개로 (String 기준)
// 여기서는 JSON 문자열 자체를 다루므로 \\\\ -> \\ 로 변환 (이것은 실제 문자 \ 하나를 의미하게 됨)
const repairedContent = content
    .replace(/\\\\\\\\/g, "\\\\") // 4개 -> 2개
    .replace(/\\\\cdot/g, "\\\\cdot") // 이미 2개인 건 유지
    .replace(/\\\\times/g, "\\\\times")
    .replace(/\\\\div/g, "\\\\div")
    .replace(/\\\\frac/g, "\\\\frac");

fs.writeFileSync(masterFile, repairedContent, 'utf-8');
console.log("✅ 승강기 라텍스 역슬래시 중복 수리 완료!");
