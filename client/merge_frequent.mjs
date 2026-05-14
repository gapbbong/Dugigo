import fs from 'fs';

const masterNormalize = (text) => {
    if (!text) return "";
    return text.toLowerCase()
        // 1. 부연 설명 괄호 완전 제거
        .replace(/\(.*\)/g, "")
        .replace(/\[.*\]/g, "")
        .replace(/<.*>/g, "")
        // 2. 동의어 및 표현 통일
        .replace(/년도/g, "연도")
        .replace(/키/g, "")
        .replace(/버튼/g, "")
        .replace(/합니다/g, "")
        .replace(/한다/g, "")
        .replace(/이다/g, "")
        .replace(/입니다/g, "")
        .replace(/선택/g, "")
        .replace(/누름/g, "")
        .replace(/누른다/g, "")
        // 3. 조사 제거 (뼈대 단어만 남김)
        .replace(/[은는이가을를의에와과]/g, "")
        // 4. 한글/영문/숫자 외 모든 특수문자/문장부호 제거
        .replace(/[^a-z0-9가-힣]/g, "")
        // 5. 공백 제거
        .replace(/\s+/g, "")
        .trim();
};

const subjects = [
    { name: '컴퓨터활용능력 2급', file: 'src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json' },
    { name: '승강기기능사', file: 'src/data/승강기기능사/MASTER_DB.json' }
];

const mergedData = [];
const usedKeys = new Set();

subjects.forEach(sub => {
    if (!fs.existsSync(sub.file)) return;
    const data = JSON.parse(fs.readFileSync(sub.file, 'utf-8'));
    const questions = Array.isArray(data) ? data : (data.questions || []);
    
    questions.forEach(q => {
        if ((q.frequency || 0) >= 2) {
            const cleanQ = masterNormalize(q.question);
            // 선택지 하나하나를 '마스터 노멀라이즈' 한 뒤 정렬하여 병합
            const cleanChoices = (q.choices || []).map(masterNormalize).sort().join("|");
            
            const key = `${cleanQ}_${cleanChoices}`;
            
            if (!usedKeys.has(key)) {
                usedKeys.add(key);
                mergedData.push({ subject: sub.name, ...q });
            }
        }
    });
});

fs.writeFileSync('frequent_questions_merged.json', JSON.stringify(mergedData, null, 2));
console.log(`💎 [마스터 병합] 완료: 최종 ${mergedData.length}개의 정수만 남았습니다.`);
