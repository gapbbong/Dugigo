import fs from 'fs';
import path from 'path';

const dataDir = 'src/data';
const subjects = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)).isDirectory());

const normalize = (text) => {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "")
        .replace(/[은는이가을를의에와과]/g, "")
        .replace(/\s+/g, "")
        .trim();
};

subjects.forEach(subject => {
    const masterFile = path.join(dataDir, subject, 'MASTER_DB.json');
    if (!fs.existsSync(masterFile)) {
        console.log(`⚠️ [${subject}] MASTER_DB.json이 없어 건너뜁니다.`);
        return;
    }

    try {
        const raw = fs.readFileSync(masterFile, 'utf-8');
        const questions = JSON.parse(raw);
        const uniqueMap = new Map();

        questions.forEach(q => {
            const qKey = normalize(q.question);
            if (uniqueMap.has(qKey)) {
                const existing = uniqueMap.get(qKey);
                existing.frequency = (existing.frequency || 1) + 1;
                
                // 더 정보가 풍부한 문항 보존
                const existingScore = (existing.explanation ? 100 : 0) + (existing.choices || []).join("").length;
                const currentScore = (q.explanation ? 100 : 0) + (q.choices || []).join("").length;
                
                if (currentScore > existingScore) {
                    const freq = existing.frequency;
                    const newObj = { ...q, frequency: freq };
                    uniqueMap.set(qKey, newObj);
                }
            } else {
                q.frequency = q.frequency || 1;
                uniqueMap.set(qKey, q);
            }
        });

        const cleaned = Array.from(uniqueMap.values());
        fs.writeFileSync(masterFile, JSON.stringify(cleaned, null, 2));
        
        const frequentCount = cleaned.filter(q => q.frequency >= 2).length;
        console.log(`✅ [${subject}] 처리 완료: 전체 ${cleaned.length}개 / 빈출 ${frequentCount}개`);
    } catch (e) {
        console.error(`❌ [${subject}] 에러 발생:`, e.message);
    }
});

// 통합본 갱신
import { execSync } from 'child_process';
try {
    execSync('node merge_frequent.mjs');
    console.log("✅ 전 과목 통합 빈출 문제집 업데이트 완료!");
} catch (e) {
    console.error("❌ 통합본 업데이트 중 오류");
}
