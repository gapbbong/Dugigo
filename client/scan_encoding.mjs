import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file === 'questions.json') {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('\uFFFD') || content.includes('')) {
        console.log(`Potential encoding issue in: ${fullPath}`);
        // Find line numbers
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('\uFFFD')) {
            console.log(`  Line ${i + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

scanDir(dataDir);
