import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data';

const replacements = [
    // Higher precision matches
    [/력\(起磁力\)/g, '기자력(起磁력)'], // Fix based on screenshot
    [/해설: \ufffd\ufffd\ufffd력/g, '해설: 기자력'],
    [/자유 \ufffd\ufffd자의/g, '자유 전자의'],
    [/유 \ufffd\ufffd자의/g, '유 전자의'],
    [/사\ufffd\ufffd되는/g, '사용되는'],
    [/사\ufffd\ufffd하여/g, '사용하여'],
    [/접\ufffd\ufffd/g, '접속'],
    [/방향\ufffd\ufffd/g, '방향과'],
    [/배\ufffd\ufffd용/g, '배선용'],
    [/스\ufffd\ufffd치/g, '스위치'],
    [/부\ufffd\ufffd의/g, '부하의'],
    [/\ufffd\ufffd험/g, '시험'],
    [/장\ufffd\ufffd에/g, '장소에'],
    [/인가\ufffd\ufffd면/g, '인가하면'],
    [/비\ufffd\ufffd/g, '비닐'],
    [/리\ufffd\ufffd턴스/g, '리액턴스'],
    [/횡축\ufffd\ufffd/g, '횡축과'],
    [/동기기\ufffd\ufffd/g, '동기기의'],
    [/있으\ufffd\ufffd/g, '있으므로'],
    [/크기\ufffd\ufffd/g, '크기를'],
    [/\ufffd\ufffd지/g, '접지'],
    [/\ufffd\ufffd도/g, '유도'],
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // 1. Specific replacements
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    
    // 2. Generic cleanup: remove any remaining \ufffd
    // This is safer now that we've fixed the major ones.
    content = content.replace(/\ufffd+/g, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
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
console.log('Final data repair complete.');
