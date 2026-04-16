import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기능사';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let total = 0;
let suspicious = [];

files.forEach(f => {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
        if (!Array.isArray(data)) return;
        data.forEach(q => {
            const opts = q.options || q.choices || [];
            
            let reason = null;
            if (!opts || opts.length < 4) reason = 'Count mismatch';
            else if (opts.some(o => !o || o === "")) reason = 'Empty option';
            else if (opts.some(o => typeof o === 'string' && (o.startsWith('보기') || o.startsWith('옵션') || o.startsWith('Choice')))) reason = 'Dummy text';
            const zeros = opts.filter(o => o === "0" || o === "1").length;
            if (zeros >= 3) reason = 'Repeated 0/1';

            if (reason) {
                total++;
                suspicious.push({
                    file: f,
                    num: q.question_num,
                    reason: reason,
                    opts: opts
                });
            }
        });
    } catch (e) {}
});

console.log('--- 정밀 감사 결과 ---');
console.log(`총 의심 문항: ${total}개`);
if (total > 0) {
    console.log(JSON.stringify(suspicious.slice(0, 5), null, 2));
}
