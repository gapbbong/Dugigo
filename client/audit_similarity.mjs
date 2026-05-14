import fs from 'fs';

const data = JSON.parse(fs.readFileSync('frequent_questions_merged.json', 'utf-8'));

// 자카드 유사도 계산 함수 (두 문장이 얼마나 비슷한지 0~1 사이 값 반환)
function getSimilarity(s1, s2) {
    const set1 = new Set(s1.split(''));
    const set2 = new Set(s2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

const normalizeSimple = (text) => {
    return (text || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "").trim();
};

console.log("🧐 776개 문항에 대해 전수 유사도 검사를 시작합니다 (시간이 조금 걸릴 수 있습니다)...");

const similarPairs = [];
for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
        const q1 = normalizeSimple(data[i].question);
        const q2 = normalizeSimple(data[j].question);
        
        const sim = getSimilarity(q1, q2);
        
        if (sim > 0.85) { // 85% 이상 비슷하면 보고
            // 보기 유사도도 확인
            const c1 = (data[i].choices || []).map(normalizeSimple).sort().join("");
            const c2 = (data[j].choices || []).map(normalizeSimple).sort().join("");
            const choiceSim = getSimilarity(c1, c2);
            
            if (choiceSim > 0.85) {
                similarPairs.push({
                    sim: Math.round(sim * 100),
                    q1: data[i],
                    q2: data[j]
                });
            }
        }
    }
}

let report = "# 🔍 최종 유사 문항 전수 조사 리포트\n\n이 리포트는 AI가 아닌 '사람의 눈'으로 보기에 중복일 가능성이 높은(유사도 85% 이상) 문항들을 나열한 것입니다.\n\n";

if (similarPairs.length === 0) {
    report += "✅ 놀랍게도 85% 이상 유사한 문항이 단 한 건도 발견되지 않았습니다! 완벽하게 정제되었습니다.\n";
} else {
    report += `❗ 총 ${similarPairs.length}쌍의 유사 문항이 발견되었습니다. 직접 검토 부탁드립니다.\n\n`;
    similarPairs.forEach((p, idx) => {
        report += `### [유사도 ${p.sim}%] 사례 ${idx + 1}\n`;
        report += `- **1번 (${p.q1.subject})**: ${p.q1.question}\n`;
        report += `  > 보기: ${p.q1.choices?.join(' | ')}\n`;
        report += `- **2번 (${p.q2.subject})**: ${p.q2.question}\n`;
        report += `  > 보기: ${p.q2.choices?.join(' | ')}\n\n`;
        report += "---\n\n";
    });
}

fs.writeFileSync('final_similarity_report.md', report);
console.log(`✅ 검사 완료! 유사 문항 ${similarPairs.length}쌍을 발견하여 'final_similarity_report.md'에 저장했습니다.`);
