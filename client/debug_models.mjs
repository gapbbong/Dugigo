import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("=== Available Models ===");
    if (data.models) {
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("No models found or error:", data);
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
