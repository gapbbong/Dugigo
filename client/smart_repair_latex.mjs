import fs from 'fs';
import path from 'path';

const masterFile = 'src/data/승강기기능사/MASTER_DB.json';
let content = fs.readFileSync(masterFile, 'utf-8');

const keywords = ['cdot', 'times', 'div', 'sqrt', 'frac', 'pm', 'ohm', 'mu', 'alpha', 'beta', 'gamma'];

let fixCount = 0;
keywords.forEach(key => {
    // 백슬래시가 없고 앞뒤로 단어 경계가 있거나 기호가 있는 경우 (단, JSON 이스케이프 상태 고려)
    // JSON 문자열 내에서 \는 \\로 표현됨. 따라서 \\가 없는 경우를 찾음
    const regex = new RegExp(`(?<!\\\\)${key}`, 'g');
    content = content.replace(regex, () => {
        fixCount++;
        return `\\\\${key}`;
    });
});

// 추가로 $[ ... ]$ 같은 비표준 달러 기호가 있으면 $ ... $ 로 교정
// 또는 수식 기호가 있는데 $로 감싸져 있지 않은 경우를 찾기는 매우 어려우므로
// 우선 백슬래시 복구에 집중

fs.writeFileSync(masterFile, content, 'utf-8');
console.log(`✅ 스마트 수리 완료! 총 ${fixCount}개의 라텍스 키워드에 백슬래시를 복구했습니다.`);

// 통합본도 업데이트
import { execSync } from 'child_process';
try {
    execSync('node merge_frequent.mjs');
    console.log("✅ 통합 빈출 문제집 업데이트 완료!");
} catch (e) {
    console.error("❌ 통합본 업데이트 중 오류 발생");
}
