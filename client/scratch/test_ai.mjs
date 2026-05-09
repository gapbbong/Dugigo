import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBFKk8tiIMu5fu4mCmGg0dHo0IE-OEMh5g');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function test() {
  try {
    const result = await model.generateContent("Hi");
    console.log(result.response.text());
  } catch (err) {
    console.error(err);
  }
}
test();
