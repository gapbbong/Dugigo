import fs from 'fs';
import path from 'path';

const DATA_DIR = 'e:\\DugiGo\\client\\src\\data';

function reindexFiles() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_questions.json') && f !== '2015_03_questions.json');
    
    files.forEach(fileName => {
        const filePath = path.join(DATA_DIR, fileName);
        let rawContent = fs.readFileSync(filePath, 'utf-8');
        if (rawContent.charCodeAt(0) === 0xFEFF) rawContent = rawContent.slice(1);
        
        let data;
        try {
            data = JSON.parse(rawContent);
        } catch (e) {
            return;
        }

        if (!Array.isArray(data)) return;

        const match = fileName.match(/^(\d{4})_(\d{2})_questions\.json$/);
        const year = match ? match[1] : '';
        const round = match ? match[2] : '';

        data.forEach((q, i) => {
            const num = i + 1;
            q.question_num = num;
            if (year && round) {
                q.id = `${year}_${round}_${num}`;
                q.year = parseInt(year);
                q.round = round;
            }
        });

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Re-indexed ${fileName}`);
    });
}

reindexFiles();
