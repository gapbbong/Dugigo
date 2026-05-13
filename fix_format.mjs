import fs from 'fs';
import path from 'path';

const DATA_DIR = 'e:/DugiGo/client/src/data';
const TARGET_SUBJECTS = ['전기기능사', '정보처리기능사'];

const symbolMap = {
    '①': 1, '②': 2, '③': 3, '④': 4,
    '1': 1, '2': 2, '3': 3, '4': 4
};

function fixSubjectFormat(subject) {
    const subjectDir = path.join(DATA_DIR, subject);
    if (!fs.existsSync(subjectDir)) {
        console.warn(`Subject directory not found: ${subjectDir}`);
        return;
    }

    const files = fs.readdirSync(subjectDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
        const filePath = path.join(subjectDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            let data = JSON.parse(content);
            let modified = false;

            if (Array.isArray(data)) {
                data.forEach(q => {
                    const originalAns = q.answer;
                    if (typeof originalAns !== 'number') {
                        const fixedAns = symbolMap[String(originalAns).trim()];
                        if (fixedAns) {
                            q.answer = fixedAns;
                            modified = true;
                        }
                    }
                });

                if (modified) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
                    console.log(`✅ Fixed format in: ${subject}/${file}`);
                }
            }
        } catch (e) {
            console.error(`❌ Error processing ${file}: ${e.message}`);
        }
    });
}

console.log('--- 🛠️ Starting Format Fix (Answers to Numbers) ---');
TARGET_SUBJECTS.forEach(fixSubjectFormat);
console.log('--- ✨ Format Fix Completed ---');
