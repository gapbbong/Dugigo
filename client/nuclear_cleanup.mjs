import fs from 'fs';

const masterFile = 'src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json';
const data = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));
const questions = Array.isArray(data) ? data : (data.questions || []);

const normalize = (text) => {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "")
        .replace(/[은는이가을를의에와과]/g, "")
        .replace(/\s+/g, "")
        .trim();
};

const uniqueMap = new Map();
const cleanedQuestions = [];

questions.forEach(q => {
    const qKey = normalize(q.question);
    
    // 만약 질문이 이미 존재한다면, 보기(choices)까지 비교해서 가장 긴 보기를 가진 놈을 남김 (정보량이 많을 확률이 높음)
    if (uniqueMap.has(qKey)) {
        const existing = uniqueMap.get(qKey);
        const existingChoicesLen = (existing.choices || []).join("").length;
        const currentChoicesLen = (q.choices || []).join("").length;
        
        if (currentChoicesLen > existingChoicesLen) {
            uniqueMap.set(qKey, q);
        }
    } else {
        uniqueMap.set(qKey, q);
    }
});

uniqueMap.forEach(value => cleanedQuestions.push(value));

fs.writeFileSync(masterFile, JSON.stringify(cleanedQuestions, null, 2));
console.log(`✅ [DB 원본 정제 완료] ${questions.length}개 -> ${cleanedQuestions.length}개로 압축되었습니다.`);
