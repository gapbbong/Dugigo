import fs from 'fs';

const masterFile = 'src/data/승강기기능사/MASTER_DB.json';
let content = fs.readFileSync(masterFile, 'utf-8');

// 4개 연속된 역슬래시를 2개로 변환
const repairedContent = content.replace(/\\\\\\\\/g, "\\\\");

fs.writeFileSync(masterFile, repairedContent, 'utf-8');
console.log("✅ 승강기 과다 역슬래시(4개->2개) 수리 완료!");

// 통합본 갱신
import { execSync } from 'child_process';
execSync('node merge_frequent.mjs');
console.log("✅ 통합 빈출 문제집 업데이트 완료!");
