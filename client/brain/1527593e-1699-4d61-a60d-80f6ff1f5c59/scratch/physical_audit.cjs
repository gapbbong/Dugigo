const fs = require('fs');
const path = require('path');

const dbPath = 'e:/DugiGo/client/src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json';
const srcImgDir = 'e:/DugiGo/client/public/summaries/컴퓨터활용능력 2급/';
const auditBaseDir = 'e:/DugiGo/IMAGE_CHECK/';

// Create audit directories
const neededDir = path.join(auditBaseDir, 'REQUIRED');
const redundantDir = path.join(auditBaseDir, 'REDUNDANT');

if (!fs.existsSync(auditBaseDir)) fs.mkdirSync(auditBaseDir, { recursive: true });
if (!fs.existsSync(neededDir)) fs.mkdirSync(neededDir, { recursive: true });
if (!fs.existsSync(redundantDir)) fs.mkdirSync(redundantDir, { recursive: true });

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const files = fs.readdirSync(srcImgDir).filter(f => f.endsWith('.webp'));

console.log(`Analyzing ${files.length} images...`);

let neededCount = 0;
let redundantCount = 0;

files.forEach(file => {
    // Extract question info from filename pattern: lit2_2020년 1회 컴_q13.webp
    // OR lit2_2021년상시01__q28.webp
    const qMatch = file.match(/q(\d+)\.webp/);
    if (!qMatch) return;
    const qNum = parseInt(qMatch[1]);

    // Find the question in DB
    // Simple heuristic to match filename to round_info
    const question = db.find(q => {
        const textToMatch = file.toLowerCase().replace(/_/g, '');
        const roundToMatch = (q.round_info || '').toLowerCase().replace(/ /g, '');
        return textToMatch.includes(roundToMatch.slice(0, 10)) && (q.number === qNum || q.question_num === qNum);
    });

    if (!question) {
        // If not found in DB, put in REDUNDANT to be safe or maybe keep? 
        // For audit, if we can't find it, it's suspicious.
        fs.copyFileSync(path.join(srcImgDir, file), path.join(redundantDir, file));
        redundantCount++;
        return;
    }

    const text = (question.question || '').toLowerCase();
    const isDiagramNeeded = /그림|표|다음과 같이|아래와 같이|화면|설정|대화 상자|차트|그래프/.test(text);
    const isSubject2 = (question.subject || '').includes('스프레드시트') || (question.sub_unit || '').includes('2과목');
    const isPlaceholder = text.length < 10 || text.trim() === '' || text.includes('이미지') && (text.includes('없음') || text.includes('불가') || text.includes('지문'));
    const hasChoicesInText = question.choices && question.choices.length > 0;

    // Pro Filter Logic
    let isNeeded = true;
    if (!isDiagramNeeded && !isPlaceholder) {
        if (!isSubject2) {
            isNeeded = false; // Subject 1 scan
        } else if (hasChoicesInText) {
            isNeeded = false; // Subject 2 full page scan
        }
    }

    const targetDir = isNeeded ? neededDir : redundantDir;
    fs.copyFileSync(path.join(srcImgDir, file), path.join(targetDir, file));
    
    if (isNeeded) neededCount++;
    else redundantCount++;
});

console.log(`Audit Complete!`);
console.log(`- REQUIRED: ${neededCount} images (Copied to e:\\DugiGo\\IMAGE_CHECK\\REQUIRED)`);
console.log(`- REDUNDANT: ${redundantCount} images (Copied to e:\\DugiGo\\IMAGE_CHECK\\REDUNDANT)`);
