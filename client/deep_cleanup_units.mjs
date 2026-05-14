import fs from 'fs';
import path from 'path';

const baseDir = 'src/data';
const subjects = ['컴퓨터활용능력 2급', '승강기기능사'];

const normalize = (text) => {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "")
        .replace(/[은는이가을를의에와과]/g, "")
        .replace(/\s+/g, "")
        .trim();
};

const processDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.json') && !file.includes('MASTER_DB')) {
            try {
                const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
                const questions = Array.isArray(content) ? content : (content.questions || []);
                
                const uniqueMap = new Map();
                const cleaned = [];
                
                questions.forEach(q => {
                    const key = normalize(q.question);
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, q);
                        cleaned.push(q);
                    }
                });
                
                if (questions.length !== cleaned.length) {
                    const result = Array.isArray(content) ? cleaned : { ...content, questions: cleaned };
                    fs.writeFileSync(fullPath, JSON.stringify(result, null, 2));
                    console.log(`🧹 정제 완료: ${fullPath} (${questions.length} -> ${cleaned.length})`);
                }
            } catch (e) {
                console.error(`❌ 에러 발생: ${fullPath}`, e);
            }
        }
    });
};

subjects.forEach(sub => {
    const subPath = path.join(baseDir, sub);
    if (fs.existsSync(subPath)) processDir(subPath);
});

console.log("🚀 모든 단원별 파일 정제가 끝났습니다!");
