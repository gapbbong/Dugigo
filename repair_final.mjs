import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyBijZ3TNMEiPW-iC_farcdl-9ysKnqRzS8';
const FILE_URI = 'https://generativelanguage.googleapis.com/v1beta/files/q8k7ggg6ws08';

async function digitizeRound(year, round) {
  console.log(`Processing ${year} Round ${round}...`);
  
  const prompt = `Based on the provided PDF, extract exactly 60 questions for Year: ${year}, Round: ${round}.
  
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

Important:
1. Use $ formula $ for ALL mathematical expressions and units.
2. If there's a diagram, just put [그림 참고] in the question.
3. Ensure "answer" is an integer 1-4.
4. ONLY output the JSON array.`;

  const payload = {
    contents: [
      {
        parts: [
          { file_data: { file_uri: FILE_URI, mime_type: 'application/pdf' } },
          { text: prompt }
        ]
      }
    ],
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
            const jsonStr = response.candidates[0].content.parts[0].id ? response.candidates[0].content.parts[0].text : response.candidates[0].content.parts[0].text;
            const result = JSON.parse(jsonStr);
            const fileName = `e:\\DugiGo\\client\\src\\data\\${year}_${round}_questions.json`;
            fs.writeFileSync(fileName, JSON.stringify(result, null, 2));
            console.log(`Successfully saved ${fileName}`);
            resolve(result);
          } else {
            console.error('Error result:', data);
            reject(new Error('Invalid response'));
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
async function start() {
    try {
        await digitizeRound('2017', '03');
        await digitizeRound('2016', '03');
    } catch (e) {
        console.error(e);
    }
}

start();
