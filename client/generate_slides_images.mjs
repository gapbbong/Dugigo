import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
if (keys.length === 0) {
  console.error("No API keys found in .env.local (GEMINI_API_KEYS)");
  process.exit(1);
}

let keyIndex = 0;
function getNextKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateImage(prompt, outputPath, attempt = 1) {
  if (attempt > keys.length) {
    console.error(`  [!] All ${keys.length} keys failed for this prompt. Skipping.`);
    return false;
  }

  const apiKey = getNextKey();
  // Using Imagen 4.0 via Gemini API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        instances: [{ prompt: `Highly detailed photorealistic educational real-life photograph of: ${prompt}. Studio lighting, professional product shot, premium quality, ultra-high resolution, isolated clean background.` }],
        parameters: { sampleCount: 1 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`  [!] Key attempt ${attempt} failed (HTTP ${response.status}). Retrying...`);
      return await generateImage(prompt, outputPath, attempt + 1);
    }

    const data = await response.json();
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      const buffer = Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
      await sharp(buffer).webp({ quality: 80 }).toFile(outputPath);
      console.log(`Successfully saved: ${path.basename(outputPath)}`);
      return true;
    }
    return await generateImage(prompt, outputPath, attempt + 1);
  } catch (error) {
    console.warn(`  [!] Error: ${error.message}. Retrying...`);
    return await generateImage(prompt, outputPath, attempt + 1);
  }
}

async function processAllSummaries() {
  const summariesDir = 'e:/DugiGo/client/src/summaries/승강기기능사';
  const publicDir = 'e:/DugiGo/client/public/summaries/승강기기능사';

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const files = fs.readdirSync(summariesDir).filter(f => f.endsWith('.json'));
  console.log(`\n[Daemon] Found ${files.length} summary files. Checking for missing images...`);

  for (const file of files) {
    const filePath = path.join(summariesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const unitName = data.unit;
    const setNum = data.set;

    for (const slide of data.slides) {
      // Handle both old and new image path formats
      // Format: slide_UnitName_SetNum_SlideId.webp
      const outputFilename = `slide_${unitName}_${setNum}_${slide.id}.webp`;
      const outputPath = path.join(publicDir, outputFilename);
      
      if (fs.existsSync(outputPath)) continue;
      
      console.log(`[Slide ${unitName}_${setNum}_${slide.id}] Generating image...`);
      const success = await generateImage(slide.title + ". " + slide.content, outputPath);
      if (success) await sleep(15000); // Increase to 15s for Imagen quota
      else await sleep(10000);
    }
  }
}

async function startDaemon() {
  console.log("Starting Image Generation Daemon (Unit-aware)...");
  while (true) {
    try {
      await processAllSummaries();
    } catch (err) {
      console.error("Daemon error:", err.message);
    }
    console.log("[Daemon] Completed scan. Sleeping for 5 minutes...");
    await sleep(5 * 60 * 1000); 
  }
}

startDaemon();
