import fs from 'fs';
import path from 'path';

const masterPath = path.resolve(process.cwd(), 'src', 'data', '전기기사', 'MASTER_DB.json');
if (fs.existsSync(masterPath)) {
  const data = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const questions = Array.isArray(data) ? data : (data.questions || []);
  console.log(`📂 로컬 전기기사 MASTER_DB.json 문항 수: ${questions.length}개`);
}
