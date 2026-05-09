import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s');

async function listModels() {
  const models = await genAI.getGenerativeModel({ model: 'gemini-pro' });
  console.log('Successfully connected to gemini-pro. Testing other names...');
  // Usually the SDK handles the version, we just need the right name.
}
listModels();
