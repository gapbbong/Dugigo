import fs from 'fs';
import path from 'path';

const normalize = (text) => {
    return (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "")
        .trim();
};

const subjects = [
    { name: '컴퓨터활용능력 2급', file: 'src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json' },
    { name: '승강기기능사', file: 'src/data/승강기기능사/MASTER_DB.json' }
];

let report = "# 📋 빈출 문제 중복 감사 리포트\n\n이 리포트는 빈도 2회 이상인 문항들을 정규화(특수문자/공백 제거)하여 그룹화한 결과입니다.\n\n";

subjects.forEach(sub => {
    report += `## 📚 종목: ${sub.name}\n\n`;
    
    if (!fs.existsSync(sub.file)) {
        report += `❌ 마스터 DB 파일을 찾을 수 없습니다: ${sub.file}\n\n`;
        return;
    }

    const data = JSON.parse(fs.readFileSync(sub.file, 'utf-8'));
    const questions = Array.isArray(data) ? data : (data.questions || []);
    
    const freqQuestions = questions.filter(q => (q.frequency || 0) >= 2);
    const groups = new Map();

    freqQuestions.forEach(q => {
        const cleanQ = normalize(q.question);
        const cleanC = (q.choices || []).map(c => normalize(c)).join("|");
        const key = `${cleanQ}_${cleanC}`;
        
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(q);
    });

    // 중복이 발견된 그룹들 위주로 출력
    report += `> 전체 빈출 문항 수: ${freqQuestions.length}개 / 고유 문항 수: ${groups.size}개\n\n`;

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => groups.get(b).length - groups.get(a).length);

    sortedKeys.forEach((key, idx) => {
        const items = groups.get(key);
        report += `### [그룹 ${idx + 1}] 출제 횟수: ${items[0].frequency}회 (실제 데이터 개수: ${items.length}개)\n`;
        report += `**정규화 키:** \`${key.substring(0, 100)}${key.length > 100 ? '...' : ''}\`\n\n`;
        
        items.forEach((item, i) => {
            report += `- **인스턴스 ${i + 1}** (${item.round_info || item.year + ' ' + item.round}):\n`;
            report += `  > 문제: ${item.question.replace(/\n/g, ' ')}\n`;
            report += `  > 보기: ${item.choices?.join(' | ')}\n`;
        });
        report += `\n---\n\n`;
    });
});

fs.writeFileSync('audit_report.md', report);
console.log("✅ audit_report.md 생성 완료");
