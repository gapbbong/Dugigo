const fs = require('fs');
const path = require('path');

const dbPath = 'e:/DugiGo/client/src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json';
const srcImgDir = 'e:/DugiGo/client/public/summaries/컴퓨터활용능력 2급/';
const auditBaseDir = 'e:/DugiGo/IMAGE_CHECK/';

// Create audit directories
const neededDir = path.join(auditBaseDir, 'REQUIRED');
const redundantDir = path.join(auditBaseDir, 'REDUNDANT');

if (fs.existsSync(auditBaseDir)) {
    // Clear existing audit to avoid confusion
    fs.rmSync(auditBaseDir, { recursive: true, force: true });
}
fs.mkdirSync(auditBaseDir, { recursive: true });
fs.mkdirSync(neededDir, { recursive: true });
fs.mkdirSync(redundantDir, { recursive: true });

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const files = fs.readdirSync(srcImgDir).filter(f => f.endsWith('.webp'));

console.log(`Analyzing ${files.length} images with Improved Matcher...`);

let neededCount = 0;
let redundantCount = 0;
let notFoundCount = 0;

files.forEach(file => {
    const qMatch = file.match(/q(\d+)\.webp/);
    if (!qMatch) return;
    const qNum = parseInt(qMatch[1]);

    // Improved Matcher: Try to find any keyword from the filename in round_info
    const question = db.find(q => {
        const f = file.toLowerCase();
        const r = (q.round_info || '').toLowerCase();
        
        // Extract year and round: 2020년 1회
        const yearRoundMatch = f.match(/(\d{4})년\s*(\d+)회/);
        if (yearRoundMatch) {
            const [_, year, round] = yearRoundMatch;
            const matchesYearRound = r.includes(year) && r.includes(round + '회');
            return matchesYearRound && (q.number === qNum || q.question_num === qNum);
        }
        
        // Fallback for "상시": lit2_2021년상시01__q28.webp
        const sangsiMatch = f.match(/(\d{4})년\s*상시\s*(\d+)/);
        if (sangsiMatch) {
            const [_, year, round] = sangsiMatch;
            const matchesSangsi = r.includes(year) && r.includes('상시') && r.includes(parseInt(round).toString());
            return matchesSangsi && (q.number === qNum || q.question_num === qNum);
        }

        return false;
    });

    if (!question) {
        // If still not found, copy to redundant but mark as Not Found for report
        fs.copyFileSync(path.join(srcImgDir, file), path.join(redundantDir, file));
        redundantCount++;
        notFoundCount++;
        return;
    }

    const text = (question.question || '').toLowerCase();
    const isDiagramNeeded = /그림|표|다음과 같이|아래와 같이|화면|설정|대화 상자|차트|그래프/.test(text);
    const isSubject2 = (question.subject || '').includes('스프레드시트') || (question.sub_unit || '').includes('2과목');
    const isPlaceholder = text.length < 10 || text.trim() === '' || text.includes('이미지') && (text.includes('없음') || text.includes('불가') || text.includes('지문'));
    const hasChoicesInText = question.choices && question.choices.length > 0;

    let isNeeded = true;
    if (!isDiagramNeeded && !isPlaceholder) {
        if (!isSubject2) {
            isNeeded = false; 
        } else if (hasChoicesInText) {
            isNeeded = false; // Subject 2 scan with choices
        }
    }

    const targetDir = isNeeded ? neededDir : redundantDir;
    fs.copyFileSync(path.join(srcImgDir, file), path.join(targetDir, file));
    
    if (isNeeded) neededCount++;
    else redundantCount++;
});

console.log(`Improved Audit Complete!`);
console.log(`- REQUIRED: ${neededCount} images`);
console.log(`- REDUNDANT: ${redundantCount} images (Includes ${notFoundCount} items that couldn't be matched)`);
console.log(`Check folders at: e:\\DugiGo\\IMAGE_CHECK\\`);
