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

    questions.forEach(q => {
        const qKey = normalize(q.question);
        if (uniqueMap.has(qKey)) {
            const existing = uniqueMap.get(qKey);
            existing.frequency = (existing.frequency || 1) + 1;
            
            // 더 정보가 풍부한 문항으로 덮어쓰기 (해설이 있거나 선택지가 더 긴 것)
            const existingScore = (existing.explanation ? 100 : 0) + (existing.choices || []).join("").length;
            const currentScore = (q.explanation ? 100 : 0) + (q.choices || []).join("").length;
            
            if (currentScore > existingScore) {
                const freq = existing.frequency;
                const newObj = { ...q, frequency: freq };
                uniqueMap.set(qKey, newObj);
            }
        } else {
            q.frequency = 1;
            uniqueMap.set(qKey, q);
        }
    });

    const cleanedQuestions = Array.from(uniqueMap.values());
    fs.writeFileSync(masterFile, JSON.stringify(cleanedQuestions, null, 2));
    
    const frequentCount = cleanedQuestions.filter(q => q.frequency >= 2).length;
    console.log(`✅ [승강기 빈도수 수리 완료] 전체: ${cleanedQuestions.length}개 / 빈출: ${frequentCount}개`);
}
