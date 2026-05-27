import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'src', 'data', '컴퓨터활용능력 2급', '01. 컴퓨터 일반.json');
if (fs.existsSync(filePath)) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Loaded ${content.length} questions`);
  console.log('Sample question fields:', Object.keys(content[0]));
  console.log('Sample question values:');
  console.log(`  subject: ${content[0].subject}`);
  console.log(`  sub_unit: ${content[0].sub_unit}`);
  console.log(`  question: ${content[0].question.substring(0, 50)}...`);
} else {
  console.log('File does not exist');
}
