import fs from 'fs';
import path from 'path';

const DATA_DIR = 'e:\\DugiGo\\client\\src\\data';

const EXPECTED_DIAGRAMS = [
    { id: '2015_01_4', year: '2015_01' }, { id: '2015_01_7', year: '2015_01' },
    { id: '2015_01_17', year: '2015_01' }, { id: '2015_01_18', year: '2015_01' },
    { id: '2015_04_11', year: '2015_04' }, { id: '2015_04_13', year: '2015_04' },
    { id: '2015_04_20', year: '2015_04' }, { id: '2015_04_22', year: '2015_04' },
    { id: '2015_04_30', year: '2015_04' }, { id: '2015_04_31', year: '2015_04' },
    { id: '2015_04_32', year: '2015_04' }, { id: '2015_04_33', year: '2015_04' },
    { id: '2015_05_31', year: '2015_05' },
    { id: '2016_02_10', year: '2016_02' }, { id: '2016_02_15', year: '2016_02' }
];

function injectExpectedImages() {
    EXPECTED_DIAGRAMS.forEach(d => {
        const fileName = `${d.id.substring(0, 7)}_questions.json`;
        const filePath = path.join(DATA_DIR, fileName);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            let modified = false;
            data.forEach(q => {
                if (q.id === d.id) {
                    q.image = `/images/exams/${d.year}/${d.id}_diagram.png`;
                    modified = true;
                }
            });
            if (modified) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
                console.log(`Injected expected image path for ${d.id}`);
            }
        }
    });
}

injectExpectedImages();
