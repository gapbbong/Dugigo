import fs from 'fs';
import path from 'path';

const subject = '전기공사산업기사';
const dbPath = `e:/DugiGo/client/src/data/${subject}/Electric_Construction_MASTER_DB.json`;

if (!fs.existsSync(dbPath)) {
    console.error('Master DB not found');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// 날짜별 회차 매핑 (기능사/산업기사 통상 기준)
// 1회: 1~3월, 2회: 4~6월, 3회: 7~9월, 4회: 10~12월 (시험일에 따라 다를 수 있으나 패턴 기반 추출)
const getRoundFromDate = (dateStr) => {
    const month = parseInt(dateStr.substring(4, 6));
    if (month <= 3) return 1;
    if (month <= 6) return 2;
    if (month <= 9) return 3;
    return 4;
};

let updatedCount = 0;
const updatedData = data.map(q => {
    if (q.pdf) {
        const match = q.pdf.match(/(\d{4})(\d{4})/);
        if (match) {
            const year = parseInt(match[1]);
            const round = getRoundFromDate(match[1] + match[2]);
            
            q.year = year;
            q.round = round;
            q.id = `${year}_${String(round).padStart(2, '0')}_${String(q.number).padStart(3, '0')}`;
            updatedCount++;
        }
    }
    return q;
});

fs.writeFileSync(dbPath, JSON.stringify(updatedData, null, 2));
console.log(`Updated ${updatedCount} questions with year/round info.`);
