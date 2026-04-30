import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyA4k2juxTP3wGn7m2Ma89LsRwO2yXn_9FE';
const FILE_URI = 'https://generativelanguage.googleapis.com/v1beta/files/okf1jqupmct6';

const ROUNDS = [
  { year: 2016, rounds: ['01', '04', '05'] }
];

/**
 * Robustly extract and parse JSON array from AI response.
 * Handles markdown wrappers and unescaped backslashes in LaTeX strings.
 */
function robustParseJson(rawText) {
  // 1. Remove markdown blocks
  let jsonStr = rawText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  
  // 2. Fix unescaped backslashes in strings (e.g. \Omega -> \\Omega)
  // This is tricky. We'll try to find backslashes that aren't followed by a valid JSON escape char.
  // Actually, for most LaTeX, just double-escaping all backslashes that aren't already doubled works.
  // But we must NOT double backslashes used for \" or \n.
  
  // Simpler approach: If JSON.parse fails, try a aggressive escape and then parse.
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Attempt to fix common LaTeX backslash issues in strings
    // Replace \ with \\ unless it's already \\ or \ followed by ["\/bfnrt]
    const fixed = jsonStr.replace(/\\(?![\\\"\/bfnrtu])/g, '\\\\');
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      // Last resort: Save to log for debugging
      fs.appendFileSync('error_json_raw.log', `--- ERROR ---\n${rawText}\n\n`);
      throw e2;
    }
  }
}

async function digitizeChunk(year, round, startNum, endNum) {
  console.log(`  - Fetching Questions ${startNum}~${endNum}...`);
  
  const prompt = `Based on the provided PDF, extract questions from ${startNum} to ${endNum} for Year: ${year}, Round: ${round}.
  
Output MUST be a valid JSON array of objects.
Schema:
{
  "id": "${year}_${round}_[question_num]",
  "year": ${year},
  "round": "${round}",
  "question_num": number,
  "question": "string with LaTeX ($V = IR$, $\\\\Omega$)",
  "options": ["1. option", "2. option", "3. option", "4. option"],
  "answer": number,
  "explanation": "string with LaTeX",
  "level": "하/중/상"
}

IMPORTANT:
1. LaTeX backslashes MUST BE DOUBLE ESCAPED (e.g., \\\\Omega, \\\\frac).
2. ONLY output the JSON array. No extra text.`;

  const payload = {
    contents: [{
      parts: [
        { file_data: { file_uri: FILE_URI, mime_type: 'application/pdf' } },
        { text: prompt }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
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
            const rawText = response.candidates[0].content.parts[0].text;
            resolve(robustParseJson(rawText));
          } else {
            reject(new Error(`API Error: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function processAll() {
  for (const group of ROUNDS) {
    for (const round of group.rounds) {
      const fileName = `e:\\DugiGo\\client\\src\\data\\전기기능사\\${group.year}_${round}_questions.json`;
      console.log(`Starting ${group.year} Round ${round}...`);
      try {
        const chunk1 = await digitizeChunk(group.year, round, 1, 20);
        const chunk2 = await digitizeChunk(group.year, round, 21, 40);
        const chunk3 = await digitizeChunk(group.year, round, 41, 60);
        
        const fullRound = [...chunk1, ...chunk2, ...chunk3];
        fs.writeFileSync(fileName, JSON.stringify(fullRound, null, 2));
        console.log(`Done! Saved 60 questions to ${fileName}`);
      } catch (err) {
        console.error(`Failed to process ${group.year} Round ${round}:`, err.message);
      }
    }
  }
}

processAll();
