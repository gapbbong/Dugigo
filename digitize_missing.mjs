import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyBijZ3TNMEiPW-iC_farcdl-9ysKnqRzS8';

// Source File URIs
const URI_2015 = 'https://generativelanguage.googleapis.com/v1beta/files/eggxmzmd54j9';
const URI_2016_2018 = 'https://generativelanguage.googleapis.com/v1beta/files/a082xx8ih6ff';
const URI_2019 = 'https://generativelanguage.googleapis.com/v1beta/files/q8k7ggg6ws08';

const MISSING_ROUNDS = [
  // 2015
  { year: 2015, round: '03', uri: URI_2015 },
  // 2016 (already have 01, 02)
  { year: 2016, round: '03', uri: URI_2016_2018 },
  { year: 2016, round: '04', uri: URI_2016_2018 },
  { year: 2016, round: '05', uri: URI_2016_2018 },
  // 2017 (all missing)
  { year: 2017, round: '01', uri: URI_2016_2018 },
  { year: 2017, round: '02', uri: URI_2016_2018 },
  { year: 2017, round: '03', uri: URI_2016_2018 },
  { year: 2017, round: '04', uri: URI_2016_2018 },
  // 2018 (all missing)
  { year: 2018, round: '01', uri: URI_2016_2018 },
  { year: 2018, round: '02', uri: URI_2016_2018 },
  { year: 2018, round: '03', uri: URI_2016_2018 },
  { year: 2018, round: '04', uri: URI_2016_2018 },
  // 2019 (only 02 is missing)
  { year: 2019, round: '02', uri: URI_2019 }
];

function robustParseJson(rawText) {
  let jsonStr = rawText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const fixed = jsonStr.replace(/\\(?![\\\"\/bfnrtu])/g, '\\\\');
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      fs.appendFileSync('error_json_raw_missing.log', `--- ERROR ---\n${rawText}\n\n`);
      throw e2;
    }
  }
}

async function digitizeChunk(year, round, startNum, endNum, fileUri) {
  console.log(`  - Fetching Questions ${startNum}~${endNum} for ${year} Round ${round}...`);
  
  const prompt = `Based on the provided PDF, extract questions from ${startNum} to ${endNum} for Year: ${year}, Round: ${round}.
  [Note: Round X is often written as 제X회]

Return ONLY a valid JSON array of objects.
Schema:
{
  "id": "${year}_${round}_[question_num]",
  "year": ${year},
  "round": "${round}",
  "question_num": number,
  "question": "text (use DOUBLE ESCAPED backslashes for LaTeX like $\\\\Omega$)",
  "options": ["1. opt", "2. opt", "3. opt", "4. opt"],
  "answer": number (1-4),
  "explanation": "brief technical explanation with DOUBLE ESCAPED LaTeX",
  "level": "하/중/상"
}

Constraints:
1. Use $ formula $ for all math/units.
2. LaTeX backslashes MUST be double-escaped (\\\\).
3. Accurate "answer" field (integer 1-4).`;

  const payload = {
    contents: [{
      parts: [ { file_data: { file_uri: fileUri, mime_type: 'application/pdf' } }, { text: prompt } ]
    }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  };

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.candidates && response.candidates[0].content.parts[0].text) {
            resolve(robustParseJson(response.candidates[0].content.parts[0].text));
          } else {
            reject(new Error(`API Error: ${data}`));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function processMissing() {
  for (const item of MISSING_ROUNDS) {
    const fileName = `e:\\DugiGo\\client\\src\\data\\${item.year}_${item.round}_questions.json`;
    if (fs.existsSync(fileName)) {
      console.log(`Skipping ${item.year} Round ${item.round} (Already exists)`);
      continue;
    }

    console.log(`Starting ${item.year} Round ${item.round}...`);
    try {
      const chunk1 = await digitizeChunk(item.year, item.round, 1, 20, item.uri);
      const chunk2 = await digitizeChunk(item.year, item.round, 21, 40, item.uri);
      const chunk3 = await digitizeChunk(item.year, item.round, 41, 60, item.uri);
      
      const fullRound = [...chunk1, ...chunk2, ...chunk3];
      fs.writeFileSync(fileName, JSON.stringify(fullRound, null, 2));
      console.log(`Done! Saved 60 questions to ${fileName}`);
    } catch (err) {
      console.error(`Failed to process ${item.year} Round ${item.round}:`, err.message);
    }
  }
}

processMissing();
