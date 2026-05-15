import fs from 'fs';
import path from 'path';

const baseDir = path.resolve(process.cwd(), 'src', 'summaries');
const targetBaseDir = path.resolve(process.cwd(), 'public', 'summaries');

function recover() {
  if (!fs.existsSync(baseDir)) return;

  const items = fs.readdirSync(baseDir, { recursive: true });
  let recoveredCount = 0;

  for (const item of items) {
    const fullPath = path.join(baseDir, item);
    if (fs.statSync(fullPath).isDirectory()) continue;
    if (!item.endsWith('.json')) continue;

    try {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const subject = content.subject || "Unknown";
      const set = content.set || "X";
      const unit = content.unit || "General";
      
      const safeUnitName = unit.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      const newFileName = `${safeUnitName}_SET_${set}.json`;
      const targetDir = path.join(targetBaseDir, subject);
      
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      
      const targetPath = path.join(targetDir, newFileName);
      fs.writeFileSync(targetPath, JSON.stringify(content, null, 2), 'utf-8');
      recoveredCount++;
      console.log(`[RECOVERED] ${item} -> ${targetPath}`);
    } catch (err) {
      // Skip non-json or broken files
    }
  }
  console.log(`\nTotal recovered: ${recoveredCount} files.`);
}

recover();
