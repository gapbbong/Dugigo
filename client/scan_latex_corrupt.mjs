import fs from 'fs';
import path from 'path';

const masterFile = 'src/data/승강기기능사/MASTER_DB.json';
const data = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));
const questions = Array.isArray(data) ? data : (data.questions || []);

const latexKeywords = ['cdot', 'times', 'div', 'sqrt', 'frac', 'pm', 'ohm', 'mu', 'alpha', 'beta', 'gamma'];
const corruptQuestions = [];

questions.forEach(q => {
    const text = JSON.stringify(q);
    // 백슬래시가 없는 생 키워드가 있는지 확인 (단, 영단어의 일부일 수 있으니 주의)
    const hasCorruptLatex = latexKeywords.some(key => {
        // 앞에 백슬래시가 없고, 단어 경계가 명확한 경우를 찾음
        const regex = new RegExp(`(?<!\\\\)${key}`, 'g');
        return regex.test(text);
    });

    if (hasCorruptLatex) {
        corruptQuestions.push({
            id: q.id,
            year: q.year,
            round: q.round,
            number: q.number,
            question: q.question,
            choices: q.choices
        });
    }
});

fs.writeFileSync('elevator_latex_corrupt.json', JSON.stringify(corruptQuestions, null, 2));
console.log(`🔍 스캔 완료: 총 ${corruptQuestions.length}개의 라텍스 의심 문항을 찾았습니다.`);
if (corruptQuestions.length > 0) {
    console.log(`첫 번째 의심 문항 (ID: ${corruptQuestions[0].id}): ${corruptQuestions[0].question.substring(0, 50)}...`);
}
