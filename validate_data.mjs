import fs from 'fs';
import path from 'path';

const DATA_DIR = 'e:\\DugiGo\\client\\src\\data';

function validateJsonFiles() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_questions.json'));
    const report = [];

    files.forEach(fileName => {
        const filePath = path.join(DATA_DIR, fileName);
        let data;
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            data = JSON.parse(content);
        } catch (e) {
            report.push(`[ERROR] ${fileName}: Invalid JSON format - ${e.message}`);
            return;
        }

        if (!Array.isArray(data)) {
            report.push(`[ERROR] ${fileName}: Root is not a list`);
            return;
        }

        const qNums = [];
        const qTexts = new Set();
        
        data.forEach((q, i) => {
            const qNum = q.question_num;
            const qId = q.id;
            const qText = q.question || '';
            const options = q.options || [];
            const answer = q.answer;
            const explanation = q.explanation || '';

            // Basic checks
            if (qNum === undefined) {
                report.push(`[ERROR] ${fileName} Index ${i}: Missing question_num`);
            } else {
                qNums.push(qNum);
            }

            if (!qId) {
                report.push(`[WARNING] ${fileName} Q${qNum}: Missing id`);
            }

            if (!qText) {
                report.push(`[ERROR] ${fileName} Q${qNum}: Empty question text`);
            }
            
            if (qTexts.has(qText)) {
                report.push(`[WARNING] ${fileName} Q${qNum}: Duplicate question text found`);
            }
            qTexts.add(qText);

            if (options.length !== 4) {
                report.push(`[ERROR] ${fileName} Q${qNum}: Expected 4 options, got ${options.length}`);
            }
            
            if (typeof answer !== 'number' || answer < 1 || answer > 4) {
                report.push(`[ERROR] ${fileName} Q${qNum}: Invalid answer value: ${answer}`);
            }

            if (!explanation) {
                report.push(`[WARNING] ${fileName} Q${qNum}: Empty explanation`);
            }

            // Option prefix check (1., 2., etc)
            const prefixes = [];
            options.forEach((opt, j) => {
                const match = String(opt).match(/^(\d)[\.번\s]/);
                if (match) {
                    prefixes.push(parseInt(match[1]));
                }
            });
            
            if (prefixes.length > 0) {
                if (prefixes.length !== 4) {
                    report.push(`[WARNING] ${fileName} Q${qNum}: Inconsistent option prefixes: ${prefixes.join(', ')}`);
                } else if (JSON.stringify(prefixes) !== JSON.stringify([1, 2, 3, 4])) {
                    report.push(`[ERROR] ${fileName} Q${qNum}: Option prefixes are out of order: ${prefixes.join(', ')}`);
                }
            }

            // LaTeX check (basic)
            if (qText.includes('$')) {
                const dollars = (qText.match(/\$/g) || []).length;
                if (dollars % 2 !== 0) {
                    report.push(`[WARNING] ${fileName} Q${qNum}: Mismatched LaTeX dollars ($) in question`);
                }
            }
            
            if (explanation.includes('$')) {
                const dollars = (explanation.match(/\$/g) || []).length;
                if (dollars % 2 !== 0) {
                    report.push(`[WARNING] ${fileName} Q${qNum}: Mismatched LaTeX dollars ($) in explanation`);
                }
            }
        });

        // Sequence check
        if (qNums.length > 0) {
            const sortedNums = [...qNums].sort((a, b) => a - b);
            const expectedNums = Array.from({ length: qNums.length }, (_, i) => i + 1);
            if (JSON.stringify(sortedNums) !== JSON.stringify(expectedNums)) {
                report.push(`[ERROR] ${fileName}: Sequence mismatch. Count: ${qNums.length}`);
                const missing = expectedNums.filter(n => !qNums.includes(n));
                const extra = qNums.filter((n, i) => qNums.indexOf(n) !== i);
                if (missing.length > 0) report.push(`  Missing: ${missing.join(', ')}`);
                if (extra.length > 0) report.push(`  Duplicates: ${extra.join(', ')}`);
            }
        }
    });

    return report;
}

const results = validateJsonFiles();
results.forEach(line => console.log(line));
if (results.length === 0) {
    console.log("All checks passed!");
}
