import fs from 'fs';
import path from 'path';

const filePath = 'e:\\DugiGo\\client\\src\\data\\2017_03_questions.json';

function repair2017_03() {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    let data = JSON.parse(rawContent);

    let currentNum = 0;

    data = data.map((q, index) => {
        let question = q.question || '';
        let options = q.options || [];
        
        // 1. Extract embedded options
        const optionRegex = /①\s*(.*?)\s*②\s*(.*?)\s*③\s*(.*?)\s*④\s*(.*)/s;
        const match = question.match(optionRegex);
        if (match) {
            options = [match[1].trim(), match[2].trim(), match[3].trim(), match[4].trim()];
            question = question.replace(optionRegex, '').trim();
        }

        // 2. Extract question_num if starting with number
        const numMatch = question.match(/^(\d+)\s+(.*)/s);
        if (numMatch) {
            q.question_num = parseInt(numMatch[1]);
            question = numMatch[2].trim();
        }

        // 3. Sequential numbering if missing
        if (!q.question_num) {
            currentNum++;
            q.question_num = currentNum;
        } else {
            currentNum = q.question_num;
        }

        // 4. Fill ID
        q.id = `2017_03_${q.question_num}`;
        q.year = 2017;
        q.round = "03";
        q.question = question;
        q.options = options;
        q.level = q.level || "중";
        q.explanation = q.explanation || "";

        return q;
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Repaired 2017_03_questions.json');
}

repair2017_03();
