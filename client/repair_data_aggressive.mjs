import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data';

const replacements = [
    [/접속\ufffd+하여/g, '접속하여'],
    [/접속\ufffd+여/g, '접속하여'],
    [/사용\ufffd+되는/g, '사용되는'],
    [/사용\ufffd+하여/g, '사용하여'],
    [/\ufffd+전류/g, '전류'],
    [/\ufffd+도/g, '유도'],
    [/접\ufffd+할/g, '접속할'],
    [/다음 \ufffd+ 전지의/g, '다음 중 전지의'],
    [/두 \ufffd+일 사이의/g, '두 코일 사이의'],
    [/횡축\ufffd+ 종축/g, '횡축과 종축'],
    [/특고압 \ufffd+선로/g, '특고압 전선로'],
    [/얻어내는 발전기/g, '전력을 얻어내는 발전기'], // Wait, checking context
    [/격/g, '간격'],
    [/ level": "\ufffd+/g, ' level": "하'],
    [/  /g, ' 중 '],
    [/  /g, ' 는 '],
];

// Context check for "얻어내는 발전기":
// "유도 전동기를 동기 속도 이상으로 회전시켜 력을 얻어내는 발전기" -> 전력

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    
    // Global generic cleanups
    content = content.replace(/\ufffd([가-힣])/g, '$1'); // Remove stray diamonds before Korean chars
    content = content.replace(/([가-힣])\ufffd/g, '$1'); // Remove stray diamonds after Korean chars

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`FIXED: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.json')) {
            processFile(fullPath);
        }
    }
}

scanDir(dataDir);
console.log('Done repairing data aggressive.');
