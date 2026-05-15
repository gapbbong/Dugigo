import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function test() {
  const subject = "승강기기능사";
  const unit = "03. 전동기 응용";
  const safeUnitName = unit.replace(/[^a-z0-9가-힣]/gi, '_').replace(/_+/g, '_');
  const targetPath = path.join(process.cwd(), 'public', 'summaries', subject, `${safeUnitName}_1세트.json`);
  
  console.log(`Target Path: ${targetPath}`);
  
  const prompt = "Generate a dummy JSON for learning slides with 1 slide. Format: { \"subject\": \"test\", \"slides\": [] }";
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`Response received: ${text.slice(0, 50)}...`);
    
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      console.log(`Creating directory: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, JSON.stringify({ test: true }, null, 2), 'utf-8');
    console.log(`File written successfully!`);
    
    if (fs.existsSync(targetPath)) {
      console.log(`Verification: File EXISTS at ${targetPath}`);
    } else {
      console.log(`Verification: File NOT FOUND after write!`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
