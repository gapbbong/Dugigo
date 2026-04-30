import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const keys = [
  'AIzaSyDznL1UlJrBFqZLKotoLW9NiQVs_zxk5OU',
  'AIzaSyDXSHR17sV3ZfOJ7YLImi8m-IkkX9qh5xc',
  'AIzaSyDuWHZc6MQkW2Fu0hlmRBj-D7j7vev1G-M',
  'AIzaSyAEJqMiihrxK0mGA1Y4GWSpZERDfXX02U4'
];

let keyIndex = 0;
function getNextKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateImage(prompt, outputPath) {
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: `Highly detailed photorealistic educational real-life photograph of: ${prompt}. Studio lighting, professional product shot, premium quality, ultra-high resolution, isolated clean background.`
            }
          ],
          parameters: {
            sampleCount: 1
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Key attempt ${attempt + 1} failed. HTTP ${response.status}: ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        const base64Data = data.predictions[0].bytesBase64Encoded;
        const buffer = Buffer.from(base64Data, 'base64');
        
        await sharp(buffer)
          .webp({ quality: 80, lossless: false })
          .toFile(outputPath);

        console.log(`Successfully optimized & saved WebP image to ${outputPath}`);
        return true;
      } else {
        console.warn(`Key attempt ${attempt + 1} invalid payload.`);
        continue;
      }
    } catch (error) {
      console.warn(`Key attempt ${attempt + 1} error: ${error.message}`);
      continue;
    }
  }
  return false;
}

async function processSets() {
  const sets = [1, 2, 3, 4, 5, 6, 7, 8];
  const summariesDir = 'e:/DugiGo/client/src/summaries/승강기기능사';
  const publicDir = 'e:/DugiGo/client/public/summaries/승강기기능사';

  for (const setNum of sets) {
    const filePath = path.join(summariesDir, `기계일반_${setNum}세트.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updated = false;

    console.log(`\n==========================================`);
    console.log(`Processing Set ${setNum}...`);
    console.log(`==========================================`);

    for (const slide of data.slides) {
      const outputFilename = `slide_${setNum}_${slide.id}.webp`;
      const outputPath = path.join(publicDir, outputFilename);
      
      if (fs.existsSync(outputPath)) {
        console.log(`[Slide ${slide.id}] WebP already exists, skipping.`);
        continue;
      }
      
      console.log(`[Slide ${slide.id}] Generating image for: ${slide.title}...`);
      const success = await generateImage(slide.title + ". " + slide.content, outputPath);
      
      if (success) {
        slide.image = `/summaries/승강기기능사/${outputFilename}`;
        updated = true;
        await sleep(5000); 
      } else {
        console.log(`[Slide ${slide.id}] Generation failed. Pausing for 10s...`);
        await sleep(10000);
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Successfully updated JSON file: ${filePath}`);
    }
  }
}

async function startDaemon() {
  while (true) {
    console.log(`[Daemon] Starting image generation pass at ${new Date().toLocaleString()}...`);
    await processSets();
    console.log(`[Daemon] Pass finished. Sleeping for 1 hour before checking for missing images...`);
    await sleep(1 * 60 * 60 * 1000); 
  }
}

startDaemon();
