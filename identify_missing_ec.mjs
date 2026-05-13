import fs from 'fs';

const data = JSON.parse(fs.readFileSync('e:/DugiGo/client/src/data/전기공사산업기사/Electric_Construction_MASTER_DB.json', 'utf8'));

const missing = data.filter(q => !q.question || q.question.trim() === '' || !q.choices || q.choices.length === 0 || q.answer === null);

console.log(`Total missing: ${missing.length}`);

const missingRounds = [...new Set(missing.map(q => q.round_info))];
console.log('Missing Rounds:', missingRounds);

fs.writeFileSync('missing_ec_questions.json', JSON.stringify(missing, null, 2));
