import fs from 'fs';

const files = [
    'src/data/승강기기능사/MASTER_DB.json',
    'src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        // BOM 제거
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
            fs.writeFileSync(file, content, 'utf-8');
            console.log(`✅ ${file}에서 BOM을 제거했습니다.`);
        }
    }
});
