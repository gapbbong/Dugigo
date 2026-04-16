import fs from 'fs';
import path from 'path';

const file = 'e:/DugiGo/client/src/data/전기기능사/questions.json';
const content = fs.readFileSync(file, 'utf8');

const target = '起磁力';
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes(target)) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

// Also check for weird characters
const regex = /[^\x00-\x7F가-힣ㄱ-ㅎㅏ-ㅣ\s.,()[\]{}'":;\-\+=\/*&^%$#@!~?<>|\\起磁力]/g;
// Actually just check for \uFFFD
if (content.includes('\uFFFD')) {
  console.log('Found \\uFFFD in file!');
} else {
  console.log('No \\uFFFD in file.');
}
