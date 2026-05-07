const fs = require('fs');
const path = require('path');

const dbPath = 'e:/DugiGo/client/src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json';
const srcImgDir = 'e:/DugiGo/client/public/summaries/컴퓨터활용능력 2급/';
const auditBaseDir = 'e:/DugiGo/IMAGE_CHECK/';

// Create audit directories
const neededDir = path.join(auditBaseDir, 'REQUIRED');
const redundantDir = path.join(auditBaseDir, 'REDUNDANT');

if (fs.existsSync(auditBaseDir)) {
    fs.rmSync(auditBaseDir, { recursive: true, force: true });
}
fs.mkdirSync(auditBaseDir, { recursive: true });
fs.mkdirSync(neededDir, { recursive: true });
fs.mkdirSync(redundantDir, { recursive: true });

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const files = fs.readdirSync(srcImgDir).filter(f => f.endsWith('.webp'));

console.log(`Analyzing ${files.length} images with ULTRA-STRICT Filter...`);

let neededCount = 0;
let redundantCount = 0;

files.forEach(file => {
    const qMatch = file.match(/q(\d+)\.webp/);
    if (!qMatch) return;
    const qNum = parseInt(qMatch[1]);

    const question = db.find(q => {
        const f = file.toLowerCase();
        const r = (q.round_info || '').toLowerCase();
        const yearRoundMatch = f.match(/(\d{4})년\s*(\d+)회/);
        if (yearRoundMatch) {
            const [_, year, round] = yearRoundMatch;
            return r.includes(year) && r.includes(round + '회') && (q.number === qNum || q.question_num === qNum);
        }
        const sangsiMatch = f.match(/(\d{4})년\s*상시\s*(\d+)/);
        if (sangsiMatch) {
            const [_, year, round] = sangsiMatch;
            return r.includes(year) && r.includes('상시') && r.includes(parseInt(round).toString()) && (q.number === qNum || q.question_num === qNum);
        }
        return false;
    });

    // ULTRA-STRICT LOGIC
    // Even if it's Subject 2 or Diagram Needed, if we suspect it's a full-page scan, mark as redundant.
    let isNeeded = false;
    
    if (question) {
        const text = (question.question || '').toLowerCase();
        const isDiagramNeeded = /차트|그래프|피벗|그림\s*참조|그림과\s*같이|표를\s*참조/.test(text);
        const isSubject2 = (question.subject || '').includes('스프레드시트') || (question.sub_unit || '').includes('2과목');
        
        // 1. 1과목은 무조건 탈락 (텍스트로 충분)
        // 2. 2과목 중에서도 '차트'나 '피벗' 같은 핵심 시각자료 단어가 없으면 탈락
        // 3. 텍스트가 이미 잘 추출되어 있으면 스캔본은 탈락
        if (isSubject2 && isDiagramNeeded) {
            isNeeded = true;
        }
        
        // 특별 예외: 텍스트가 아예 없는 '유령 문항'은 그림이라도 보여줘야 하니 생존
        if (text.length < 5 || text.includes('이미지에 지문이 없습니다')) {
            isNeeded = true;
        }
    }

    const targetDir = isNeeded ? neededDir : redundantDir;
    fs.copyFileSync(path.join(srcImgDir, file), path.join(targetDir, file));
    
    if (isNeeded) neededCount++;
    else redundantCount++;
});

console.log(`ULTRA-STRICT Audit Complete!`);
console.log(`- REQUIRED: ${neededCount} images (The elite '10 per set' candidates)`);
console.log(`- REDUNDANT: ${redundantCount} images (Scans, text-heavy items, and Subject 1)`);
