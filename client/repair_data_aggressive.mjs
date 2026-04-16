import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyA4k2juxTP3wGn7m2Ma89LsRwO2yXn_9FE';

async function repairWithGemini(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`Sending ${filePath} to Gemini for surgical repair...`);

  const prompt = `The following JSON contains electrical exam questions where some numeric options are corrupted (e.g., starting with a comma like ",000" or being just "0"). 
Based on the question text, the choices format, and especially the explanation provided, please REPAIR the "options" array for each question.
Output the ENTIRE JSON back, maintaining the exact same structure. 

JSON:
${content}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  };

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
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
            const repairedJson = response.candidates[0].content.parts[0].text;
            fs.writeFileSync(filePath, repairedJson);
            resolve();
          } else {
            reject(new Error(`API Error: ${JSON.stringify(response)}`));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

repairWithGemini('e:/DugiGo/client/src/data/전기기능사/2020_02_questions.json')
  .then(() => console.log('Surgical repair complete for 2020_02.'))
  .catch(err => console.error(err));
