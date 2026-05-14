import fs from 'fs';

const masterFile = 'src/data/승강기기능사/MASTER_DB.json';
if (fs.existsSync(masterFile)) {
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
        if (uniqueMap.has(qKey)) {
            const existing = uniqueMap.get(qKey);
            const existingChoicesLen = (existing.choices || []).join("").length;
            const currentChoicesLen = (q.choices || []).join("").length;
            if (currentChoicesLen > existingChoicesLen) uniqueMap.set(qKey, q);
        } else {
            uniqueMap.set(qKey, q);
        }
    });

    uniqueMap.forEach(value => cleanedQuestions.push(value));
    fs.writeFileSync(masterFile, JSON.stringify(cleanedQuestions, null, 2));
    console.log(`✅ [승강기 DB 정제 완료] ${questions.length}개 -> ${cleanedQuestions.length}개로 압축되었습니다.`);
}
