import fs from 'fs';
import path from 'path';

const DATA_DIR = 'e:\\DugiGo\\client\\src\\data';
const PUBLIC_IMAGES_DIR = 'e:\\DugiGo\\client\\public\\images\\exams';

function normalizeId(id) {
    if (!id) return '';
    // 2016_01_05 -> 2016_01_5
    return id.replace(/_0(\d)$/, '_$1');
}

function mapDiagrams() {
    const imageMap = new Map(); // normalizedId -> relPath
    
    function walkDir(dir, baseRel = '/images/exams') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const relPath = path.join(baseRel, entry.name).replace(/\\/g, '/');
            const absPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walkDir(absPath, relPath);
            } else if (entry.isFile() && /\.(png|gif|jpg|jpeg)$/i.test(entry.name)) {
                const match = entry.name.match(/^(\d{4}_\d{2}_\d+)/);
                if (match) {
                    imageMap.set(normalizeId(match[1]), relPath);
                }
            }
        }
    }

    if (fs.existsSync(PUBLIC_IMAGES_DIR)) walkDir(PUBLIC_IMAGES_DIR);

    const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_questions.json') && f !== '2015_03_questions.json');
    const missingImages = [];

    jsonFiles.forEach(fileName => {
        const filePath = path.join(DATA_DIR, fileName);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let modified = false;

        data.forEach(q => {
            const id = q.id || '';
            const normalizedId = normalizeId(id);
            const hasDiagramText = (q.question || '').includes('[그림 참고]') || (q.explanation || '').includes('[그림 참고]');
            
            if (imageMap.has(normalizedId)) {
                q.image = imageMap.get(normalizedId);
                modified = true;
            } else if (hasDiagramText) {
                missingImages.push({ file: fileName, id: id, question: q.question.substring(0, 30) });
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`Updated ${fileName}`);
        }
    });

    console.log(`\n### Mapping Summary ###`);
    console.log(`Matched ${imageMap.size} unique image IDs.`);
    console.log(`Missing images for ${missingImages.length} questions.`);
    if (missingImages.length > 0) {
        console.log(`\n### Missing list ###`);
        missingImages.slice(0, 50).forEach(m => console.log(`- ${m.id} in ${m.file}`));
    }
}

mapDiagrams();
