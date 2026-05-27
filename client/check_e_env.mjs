import fs from 'fs';
import path from 'path';

const p = 'E:/DugiGo/client/.env.local';
console.log(`Checking: ${p}`);
if (fs.existsSync(p)) {
  console.log(`  Exists!`);
  const content = fs.readFileSync(p, 'utf-8');
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('GEMINI_API_KEYS')) {
      const parts = line.split('=');
      const keys = parts[1] ? parts[1].split(',') : [];
      console.log(`  Found GEMINI_API_KEYS with ${keys.length} keys.`);
    } else if (line.includes('SUPABASE')) {
      console.log(`  Found Supabase config line: ${line.split('=')[0]}`);
    }
  });
} else {
  console.log(`  Does not exist.`);
}
