import fs from 'fs';
import path from 'path';

const sourceDir = 'e:/DugiGo/client/src/data/전기기능사';
const targetDir = 'e:/DugiGo/client/notebook_lm_data';

// Create target directory
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to clean strings (removing the corrupted  character or ?? if they exist)
function cleanText(text) {
    if (!text) return text;
    // Replace the common corrupted character (U+FFFD) and literal '??'
    return text.replace(/\uFFFD/g, ' ').replace(/\?\?/g, ' ');
}

// Read all source files
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json') && !f.includes('structured'));

files.forEach(file => {
    const rawData = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
    let questions = [];
    try {
        questions = JSON.parse(rawData);
    } catch (e) {
        console.error(`Skipping ${file}: ${e.message}`);
        return;
    }

    if (!Array.isArray(questions)) return;

    questions.forEach(q => {
        const year = q.year || 'UnknownYear';
        const round = q.round || 'UnknownRound';
        let subUnit = q.sub_unit || '기타';
        
        // Sanitize subUnit for filename
        const safeSubUnit = subUnit.replace(/[\[\]\s]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        
        const outputFileName = `${year}_${round}_${safeSubUnit}.json`;
        const outputPath = path.join(targetDir, outputFileName);

        // Pre-clean question and explanation
        q.question = cleanText(q.question);
        q.explanation = cleanText(q.explanation);
        if (q.options) {
            q.options = q.options.map(opt => cleanText(opt));
        }

        let existingData = [];
        if (fs.existsSync(outputPath)) {
            existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        }

        existingData.push(q);
        fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2), 'utf-8');
    });
});

console.log('Finished organizing questions for NotebookLM.');
