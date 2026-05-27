import fs from 'fs';
import path from 'path';

function searchJsonFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const subjects = ['승강기기능사', '정보처리기능사', '컴퓨터활용능력 2급'];
const bases = [
  'E:/DugiGo/client/public/summaries',
  'E:/DugiGo/client/src/summaries'
];

bases.forEach(base => {
  console.log(`\nBase: ${base}`);
  subjects.forEach(subject => {
    const p = path.join(base, subject);
    if (fs.existsSync(p)) {
      const jsons = searchJsonFiles(p);
      console.log(`  - [${subject}]: Found ${jsons.length} JSON files`);
      if (jsons.length > 0) {
        jsons.slice(0, 5).forEach(f => console.log(`    * ${path.basename(f)}`));
        if (jsons.length > 5) console.log(`    * ... and ${jsons.length - 5} more`);
      }
    } else {
      console.log(`  - [${subject}]: Directory does not exist`);
    }
  });
});
