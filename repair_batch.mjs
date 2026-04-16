import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyBijZ3TNMEiPW-iC_farcdl-9ysKnqRzS8';
const FILE_URI = 'https://generativelanguage.googleapis.com/v1beta/files/q8k7ggg6ws08';

async function repairRound(year, round) {
  console.log(`Re-digitizing ${year} Round ${round} to fix broken fields...`);
  
  const prompt = `The current JSON for Year: ${year}, Round: ${round} is broken (missing options, explanations, or IDs). 
Based on the provided PDF, extract exactly 60 questions for this round.
  
Return ONLY a valid JSON array of objects. Each object must follow this schema:
{
  "id": "${year}_${round}_[question_num]",
  "year": ${year},
  "round": "${round}",
  "question_num": number,
  "question": "text (use LaTeX for math/units)",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "answer": number (1-4),
  "explanation": "technical explanation with LaTeX",
  "level": "하/중/상"
}

Ensure all mathematical expressions and units are in $ LaTeX $.
If it's a diagram question, put [그림 참고] in the question.`;

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
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
             const jsonStr = response.candidates[0].content.parts[0].text;
             const result = JSON.parse(jsonStr);
             const fileName = `e:\\DugiGo\\client\\src\\data\\${year}_${round}_questions.json`;
             fs.writeFileSync(fileName, JSON.stringify(result, null, 2));
             console.log(`Successfully repaired and saved ${fileName}`);
             resolve(result);
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

// Repair broken rounds
async function startRepair() {
  try {
    await repairRound('2017', '03');
    await repairRound('2016', '03');
  } catch (err) {
    console.error('Repair failed:', err.message);
  }
}

startRepair();
