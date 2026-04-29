const fs = require('fs');
const dbPath = 'e:/DugiGo/client/src/data/승강기기능사/MASTER_DB.json';
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

if (data.questions && data.questions[590]) {
  console.log('Original answer:', data.questions[590].answer);
  data.questions[590].answer = "3";
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('Answer fixed to 3');
} else {
  console.log('Question 590 not found');
}
