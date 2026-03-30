import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyBijZ3TNMEiPW-iC_farcdl-9ysKnqRzS8';

// Source File URIs
const URI_2015 = 'https://generativelanguage.googleapis.com/v1beta/files/eggxmzmd54j9';
const URI_2016_2018 = 'https://generativelanguage.googleapis.com/v1beta/files/a082xx8ih6ff';

const CORRECTION_ROUNDS = [
  { year: 2015, round: '03', uri: URI_2015 },
  { year: 2016, round: '03', uri: URI_2016_2018 },
  { year: 2016, round: '05', uri: URI_2016_2018 },
  { year: 2017, round: '01', uri: URI_2016_2018 },
  { year: 2017, round: '02', uri: URI_2016_2018 },
  { year: 2017, round: '03', uri: URI_2016_2018 },
  { year: 2018, round: '01', uri: URI_2016_2018 },
  { year: 2018, round: '04', uri: URI_2016_2018 }
];

function robustParseJson(rawText) {
  let jsonStr = rawText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Escape backslashes for LaTeX specifically if they aren't part of valid escapes
    const fixed = jsonStr.replace(/\\(?![\\\"\/bfnrtu])/g, '\\\\');
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      fs.appendFileSync('error_final_correction.log', `--- ERROR ---\n${rawText}\n\n`);
      throw e2;
    }
  }
}

async function digitizeTinyChunk(year, round, startNum, endNum, fileUri) {
  console.log(`  - Fetching Questions ${startNum}~${endNum} for ${year} Round ${round}...`);
  
  const prompt = `Based on the provided PDF, extract questions from ${startNum} to ${endNum} for Year: ${year}, Round: ${round}.
  [Note: Round X is often written as 제X회]

Return ONLY a valid JSON array of objects.
CRITICAL: USE DOUBLE ESCAPED BACKSLASHES FOR ALL LATEX (e.g., \\\\Omega, \\\\frac).
Schema example: {"question": "$100 [V]$"}

Constraints:
1. LaTeX formulas ($...$) for all math/units.
2. Accurate "answer" field (1-4).`;

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

async function processCorrections() {
  for (const item of CORRECTION_ROUNDS) {
    const fileName = `e:\\DugiGo\\client\\src\\data\\${item.year}_${item.round}_questions.json`;
    
    // Check if file is small or empty (< 1KB), if so overwrite.
    if (fs.existsSync(fileName) && fs.statSync(fileName).size > 1000) {
      console.log(`Skipping ${item.year} Round ${item.round} (Already done/good size)`);
      continue;
    }

    console.log(`Correcting ${item.year} Round ${item.round}...`);
    try {
      let fullRound = [];
      // 10 questions per batch for ultimate precision
      for (let i = 1; i <= 6; i++) {
        const start = (i - 1) * 10 + 1;
        const end = i * 10;
        const chunk = await digitizeTinyChunk(item.year, item.round, start, end, item.uri);
        fullRound = [...fullRound, ...chunk];
      }
      
      fs.writeFileSync(fileName, JSON.stringify(fullRound, null, 2));
      console.log(`Fixed! Saved 60 questions to ${fileName}`);
    } catch (err) {
      console.error(`Failed to correct ${item.year} Round ${item.round}:`, err.message);
    }
  }
}

processCorrections();
