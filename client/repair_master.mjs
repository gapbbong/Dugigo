import fs from 'fs';
import path from 'path';

const MASTER_DB_PATHS = [
    'E:/Quiz-extraction/output/ElectricExam_MASTER_DB.json',
    'E:/Quiz-extraction/output/ElectricExam_MASTER_DB_2016.json'
];
const TARGET_DIR = 'e:/DugiGo/client/src/data/전기기능사';

function normalize(text) {
    if (!text) return '';
    return text.toString()
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[\s\$\{\}\[\]\(\)\-\_\+\=\.\,\|\/]/g, '')
        .trim();
}

function isDummy(opts) {
    if (!opts || opts.length < 4) return true;
    return opts.some(o => !o || o.includes('보기') || o.includes('옵션') || o.includes('Choice') || (o.length < 2 && !isNaN(o)) || o === "");
}

function repairData() {
    console.log('--- [텍스트 우선 매칭] 데이터 복구 작업 시작 ---');
    let masterData = [];
    MASTER_DB_PATHS.forEach(p => {
        if (fs.existsSync(p)) {
            const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
            masterData = masterData.concat(data);
        }
    });

    const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.json'));
    let totalRepairedCount = 0;

    files.forEach(fileName => {
        const filePath = path.join(TARGET_DIR, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let questions = JSON.parse(fileContent);
        let isModified = false;

        const match = fileName.match(/(\d{4})_(\d{2})/);
        if (!match) return;
        const fileYear = match[1];

        questions = questions.map(q => {
            const opts = q.options || q.choices || [];
            if (isDummy(opts)) {
                const qNorm = normalize(q.question);
                if (qNorm.length < 5) return q;

                // 해당 연도의 모든 마스터 데이터 중에서 텍스트로만 검색
                const yearMaster = masterData.filter(m => m.year?.toString() === fileYear);
                
                let bestMatch = null;
                let maxScore = -1;

                yearMaster.forEach(m => {
                    const mNorm = normalize(m.question);
                    let score = 0;

                    // 텍스트 포함 관계 확인
                    if (mNorm.includes(qNorm) || qNorm.includes(mNorm)) {
                        score += 100;
                    } else if (mNorm.includes(qNorm.substring(0, 15)) || qNorm.includes(mNorm.substring(0, 15))) {
                        score += 50;
                    }

                    // 번호까지 맞으면 가산점 (하지만 필수는 아님)
                    if (parseInt(m.number) === q.question_num) {
                        score += 10;
                    }

                    if (score > maxScore) {
                        maxScore = score;
                        bestMatch = m;
                    }
                });

                if (bestMatch && maxScore >= 50 && bestMatch.choices && bestMatch.choices.length === 4) {
                    q.options = bestMatch.choices.map(c => c.replace(/^[①②③④]\s*/, '').trim());
                    q.explanation = bestMatch.explanation || q.explanation;
                    isModified = true;
                    totalRepairedCount++;
                }
            }
            return q;
        });

        if (isModified) {
            fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
            console.log(`[수리 완료] ${fileName}`);
        }
    });

    console.log(`\n--- 모든 작업 완료 ---`);
    console.log(`총 수리된 문항 수: ${totalRepairedCount}개`);
}

repairData();
