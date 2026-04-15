import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file).replace(/\\/g, '/');
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.json')) {
      const buffer = fs.readFileSync(fullPath);
      const content = buffer.toString('utf8');
      if (content.includes('\uFFFD')) {
        console.log(`CORRUPT: ${fullPath}`);
        // Log actual lines with corruption
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('\uFFFD')) {
            console.log(`  L${i+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

scanDir(dataDir);
