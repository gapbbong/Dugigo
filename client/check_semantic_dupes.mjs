import fs from 'fs';

const normalize = (text) => {
    return (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "")
        .replace(/\s+/g, "")
        .trim();
};

const data = JSON.parse(fs.readFileSync('frequent_questions_merged.json', 'utf-8'));
const usedKeys = new Map();
const duplicates = [];

data.forEach((q, idx) => {
    const key = normalize(q.question) + "_" + (q.choices || []).map(normalize).sort().join("|");
    
    if (usedKeys.has(key)) {
        duplicates.push({
            original: usedKeys.get(key),
            duplicate: q
        });
    } else {
        usedKeys.set(key, q);
    }
});

if (duplicates.length > 0) {
    console.log(`❗ 여전히 ${duplicates.length}건의 중복이 존재합니다.`);
    duplicates.slice(0, 3).forEach((d, i) => {
        console.log(`\n[중복사례 ${i+1}]`);
        console.log(`1번: ${d.original.question}`);
        console.log(`2번: ${d.duplicate.question}`);
    });
} else {
    console.log("✅ 축하합니다! 중복이 0건입니다. 완벽하게 정제되었습니다.");
}
