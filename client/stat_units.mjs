import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기능사';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let theory = 0;      // 1-20
let machinery = 0;   // 21-40
let installation = 0;// 41-60
let others = 0;

const uniqueKeys = new Set();

files.forEach(f => {
    try {
        const filePath = path.join(dataDir, f);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!Array.isArray(data)) return;

        data.forEach(q => {
            const key = `${q.year}-${q.round}-${q.question_num}`;
            if (uniqueKeys.has(key)) return;
            uniqueKeys.add(key);

            const n = q.question_num;
            if (n >= 1 && n <= 20) theory++;
            else if (n >= 21 && n <= 40) machinery++;
            else if (n >= 41 && n <= 60) installation++;
            else others++;
        });
    } catch (e) {}
});

console.log('\n======================================');
console.log('   ⚡ 전기기능사 단원별 문항 통계 ⚡');
console.log('======================================');
console.log(`1단원: 전기이론 (01~20번) ➔  ${theory.toLocaleString()} 문항`);
console.log(`2단원: 전기기기 (21~40번) ➔  ${machinery.toLocaleString()} 문항`);
console.log(`3단원: 전기설비 (41~60번) ➔  ${installation.toLocaleString()} 문항`);

if (others > 0) {
    console.log(`기타 범위 외 문항        ➔  ${others.toLocaleString()} 문항`);
}

console.log('--------------------------------------');
console.log(`🎯 총 합계 (중복 제거)   ➔  ${(theory + machinery + installation + others).toLocaleString()} 문항`);
console.log('======================================\n');
