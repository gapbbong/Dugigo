const fs = require('fs');
const path = require('path');

const dbPath = 'e:/DugiGo/client/src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json';
const imgDir = 'e:/DugiGo/client/public/summaries/컴퓨터활용능력 2급/';

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const files = fs.readdirSync(imgDir).filter(f => f.startsWith('lit2_2020년 1회'));

const results = {
    total: files.length,
    needed: [],
    redundant: []
};

files.forEach(file => {
    // Extract question number from lit2_2020년 1회 컴_q13.webp
    const match = file.match(/q(\d+)\.webp/);
    if (!match) return;
    
    const qNum = parseInt(match[1]);
    const question = db.find(q => 
        q.round_info.includes('2020년 1회') && 
        (q.number === qNum || q.question_num === qNum)
    );

    if (!question) {
        results.redundant.push({ file, reason: 'DB에서 문제를 찾을 수 없음' });
        return;
    }

    const text = (question.question || '').toLowerCase();
    const isDiagramNeeded = /그림|표|다음과 같이|아래와 같이|화면|설정|대화 상자|차트/.test(text);
    const isSubject2 = (question.subject || '').includes('스프레드시트') || (question.sub_unit || '').includes('2과목') || (question.sub_unit || '').startsWith('2');
    const isPlaceholder = text.length < 10 || text.trim() === '' || text.includes('이미지') && (text.includes('없음') || text.includes('불가') || text.includes('지문'));

    if (isSubject2 || isDiagramNeeded || isPlaceholder) {
        results.needed.push({ 
            file, 
            qNum, 
            subject: question.subject, 
            reason: isSubject2 ? '2과목' : (isDiagramNeeded ? '그림/표 필요' : '텍스트 부족') 
        });
    } else {
        results.redundant.push({ file, qNum, reason: '1과목 중복 스캔본' });
    }
});

console.log(JSON.stringify(results, null, 2));
