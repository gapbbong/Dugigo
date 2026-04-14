import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'e:/DugiGo/client/src/data/전기기능사';

function removeDeletedQuestions() {
    console.log('--- 삭제된 문항(KEC) 제거 작업 시작 ---');
    const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.json'));
    let totalRemoved = 0;

    files.forEach(fileName => {
        const filePath = path.join(TARGET_DIR, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let questions = JSON.parse(fileContent);
        if (!Array.isArray(questions)) return; // 배열이 아니면 건너뛰기
        
        const originalCount = questions.length;
        // KEC 또는 삭제 문구가 포함된 문항 필터링 (질문 필드가 없는 경우 대비)
        questions = questions.filter(q => q.question && !(q.question.includes('KEC') || q.question.includes('삭제')));
        
        const removedCount = originalCount - questions.length;
        if (removedCount > 0) {
            fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
            console.log(`[제거 완료] ${fileName}: ${removedCount}개 제거됨`);
            totalRemoved += removedCount;
        }
    });

    console.log(`\n--- 작업 완료 ---`);
    console.log(`총 제거된 문항 수: ${totalRemoved}개`);
}

removeDeletedQuestions();
