import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data';
const corruptLines = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('\uFFFD')) {
        const lines = content.split('\n');
        lines.forEach(line => {
          if (line.includes('\uFFFD')) corruptLines.add(line.trim());
        });
      }
    }
  }
}

scanDir(dataDir);
fs.writeFileSync('corrupt_list.txt', Array.from(corruptLines).join('\n'));
console.log(`Saved ${corruptLines.size} unique corrupt lines to corrupt_list.txt`);
