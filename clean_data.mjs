import fs from 'fs';
import path from 'path';

const DATA_DIR = 'e:\\DugiGo\\client\\src\\data';

function cleanOptions(options) {
    if (!Array.isArray(options)) return options;
    return options.map(opt => {
        if (typeof opt !== 'string') return opt;
        // Strip prefixes only if they are [1-4] or symbols followed by a separator
        // Separators: . ) 번 s
        // Symbols: ① ② ③ ④ ㉮ ㉯ ㉰ ㉱ (1) (2) (3) (4)
        return opt.replace(/^([1-4]|①|②|③|④|㉮|㉯|㉰|㉱|\([1-4]\))[\.\)\s번]+\s*/, '').trim();
    });
}

function deduplicate(data) {
    const seen = new Set();
    return data.filter(q => {
        const text = (q.question || '').trim();
        if (seen.has(text)) return false;
        seen.add(text);
        return true;
    });
}

function fixLatex(text) {
    if (typeof text !== 'string') return text;
    const dollars = (text.match(/\$/g) || []).length;
    if (dollars % 2 !== 0) {
        return text + '$';
    }
    return text;
}

function processFiles() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_questions.json') && f !== '2015_03_questions.json');
    
    files.forEach(fileName => {
        const filePath = path.join(DATA_DIR, fileName);
        let rawContent = fs.readFileSync(filePath, 'utf-8');
        
        if (rawContent.charCodeAt(0) === 0xFEFF) {
            rawContent = rawContent.slice(1);
        }

        let data;
        try {
            data = JSON.parse(rawContent);
        } catch (e) {
            return;
        }

        if (!Array.isArray(data)) return;

        let cleanedData = data.map(q => {
            q.options = cleanOptions(q.options);
            q.question = fixLatex(q.question);
            q.explanation = fixLatex(q.explanation);
            if (typeof q.answer === 'string') {
                q.answer = parseInt(q.answer);
            }
            // Ensure 4 options exist
            if (!Array.isArray(q.options) || q.options.length === 0) {
                q.options = ["보기 1", "보기 2", "보기 3", "보기 4"];
            }
            while (q.options.length < 4) {
                q.options.push(`보기 ${q.options.length + 1}`);
            }
            return q;
        });

        cleanedData = deduplicate(cleanedData);

        // Re-index
        const match = fileName.match(/^(\d{4})_(\d{2})_questions\.json$/);
        const year = match ? match[1] : '';
        const round = match ? match[2] : '';

        cleanedData.forEach((q, i) => {
            const num = i + 1;
            q.question_num = num;
            if (year && round) {
                q.id = `${year}_${round}_${num}`;
                q.year = parseInt(year);
                q.round = round;
            }
        });

        fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2), 'utf-8');
        console.log(`Final processed ${fileName}`);
    });
}

processFiles();
