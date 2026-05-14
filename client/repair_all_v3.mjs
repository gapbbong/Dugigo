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
    const dirPath = path.join(dataDir, subject);
    const files = fs.readdirSync(dirPath);
    
    // 'master'가 포함된 파일 찾기, 없으면 MASTER_DB.json 기본값
    let masterFile = files.find(f => f.toLowerCase().includes('master') && f.endsWith('.json'));
    if (!masterFile && files.includes('MASTER_DB.json')) masterFile = 'MASTER_DB.json';
    
    if (!masterFile) {
        console.log(`⚠️ [${subject}] 마스터 파일을 찾을 수 없어 건너뜁니다.`);
        return;
    }

    const fullPath = path.join(dirPath, masterFile);
    try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const data = JSON.parse(raw);
        
        let questions = [];
        let isObjectMode = false;
        
        if (Array.isArray(data)) {
            questions = data;
        } else if (data.questions && Array.isArray(data.questions)) {
            questions = data.questions;
            isObjectMode = true;
        } else {
            console.log(`⚠️ [${subject}] 유효한 문항 구조를 찾을 수 없습니다.`);
            return;
        }

        const uniqueMap = new Map();
        questions.forEach(q => {
            const qKey = normalize(q.question);
            if (uniqueMap.has(qKey)) {
                const existing = uniqueMap.get(qKey);
                existing.frequency = (existing.frequency || 1) + 1;
                
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
        
        if (isObjectMode) {
            data.questions = cleaned;
            fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
        } else {
            fs.writeFileSync(fullPath, JSON.stringify(cleaned, null, 2));
        }
        
        const frequentCount = cleaned.filter(q => q.frequency >= 2).length;
        console.log(`✅ [${subject}] (${masterFile}) 완료: 전체 ${cleaned.length} / 빈출 ${frequentCount}`);
    } catch (e) {
        console.error(`❌ [${subject}] 에러:`, e.message);
    }
});

import { execSync } from 'child_process';
try {
    execSync('node merge_frequent.mjs');
    console.log("✅ 전 과목 통합 빈출 문제집 업데이트 완료!");
} catch (e) {
    console.error("❌ 통합본 업데이트 중 오류");
}
