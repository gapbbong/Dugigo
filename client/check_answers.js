const fs = require('fs');
const data = JSON.parse(fs.readFileSync('e:/DugiGo/client/src/data/승강기기능사/MASTER_DB.json', 'utf8'));

const questions = Array.isArray(data) ? data : (data.questions || []);

const q = questions[590];
if (q) {
  console.log(`Q: ${q.question}`);
  console.log(`Ans: ${q.answer}`);
  console.log(`Choices: ${JSON.stringify(q.choices)}`);
}
