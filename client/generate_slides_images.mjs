import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
let keyStatus = new Array(keys.length).fill(true);

let keyIndex = 0;
function getNextActiveKey() {
  let startIdx = keyIndex;
  while (true) {
    if (keyStatus[keyIndex]) {
      const key = keys[keyIndex];
      const currentIdx = keyIndex;
      keyIndex = (keyIndex + 1) % keys.length;
      return { key, index: currentIdx };
    }
    keyIndex = (keyIndex + 1) % keys.length;
    if (keyIndex === startIdx) return null;
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getEnglishDescription(koreanTitle, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Translate this Korean title into a simple English noun for an image: "${koreanTitle}". NO TEXT.` }] }]
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    return "Industrial part";
  }
}

async function generateImage(title, outputPath) {
  const keyInfo = getNextActiveKey();
  if (!keyInfo) return "RETRY_LATER";

  const { key, index } = keyInfo;
  const englishDesc = await getEnglishDescription(title, key);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${key}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: `A professional studio photograph of a SINGLE ${englishDesc}. Centered, white background. NO TEXT.` }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
      })
    });

    if (response.status === 429) {
      keyStatus[index] = false;
      return await generateImage(title, outputPath);
    }
    if (!response.ok) return false;

    const data = await response.json();
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      const buffer = Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
      await sharp(buffer).resize(768, 768).webp({ quality: 80 }).toFile(outputPath);
      console.log(`  [OK] Saved: ${path.basename(outputPath)}`);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function processSubject(subject) {
  const summariesDir = `e:/DugiGo/client/src/summaries/${subject}`;
  const publicDir = `e:/DugiGo/client/public/summaries/${subject}`;
  if (!fs.existsSync(summariesDir)) return;
  const files = fs.readdirSync(summariesDir)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => (parseInt(a.match(/\d+/)) || 0) - (parseInt(b.match(/\d+/)) || 0));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(summariesDir, file), 'utf8'));
    for (const slide of data.slides) {
      const outputPath = path.join(publicDir, `slide_${data.unit}_${data.set}_${slide.id}.webp`);
      if (fs.existsSync(outputPath)) continue;
      
      console.log(`[${subject}] ${data.unit}_${data.set}_${slide.id}...`);
      const result = await generateImage(slide.title, outputPath);
      
      if (result === "RETRY_LATER") {
        console.log("==========================================");
        console.log("!!! ALL KEYS EXHAUSTED. WAITING FOR 09:00 AM RESET !!!");
        console.log("==========================================");
        return "WAIT";
      }
      await sleep(15000);
    }
  }
}

async function startDaemon() {
  while (true) {
    const now = new Date();
    const hours = now.getHours();
    
    // v18.1: Wait until 09:00 AM if it's currently early morning
    if (hours >= 0 && hours < 9) {
      const minutesToWait = (9 - hours) * 60 - now.getMinutes();
      console.log(`[Timer] It's currently ${now.toLocaleTimeString()}. Waiting ${minutesToWait} minutes until 09:00 AM reset...`);
      await sleep(minutesToWait * 60 * 1000);
    }

    keyStatus = new Array(keys.length).fill(true); // Reset key status
    const subjects = ['승강기기능사', '전기기능사', '정보처리기능사'];
    for (const subject of subjects) {
      const status = await processSubject(subject);
      if (status === "WAIT") break;
    }
    await sleep(60000);
  }
}

startDaemon();
