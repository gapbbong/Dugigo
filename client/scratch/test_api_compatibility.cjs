const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEYS = [
  'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s',
  'AIzaSyCcPcc5jPYNNJrgTeZ6gAgr0_tfkTP_hfA',
  'AIzaSyCYORHvQP0OKdyBN2femGhUF_U634d1rDw',
  'AIzaSyDql8tW5hAIKVjxZEPF6dZ3cJydu7q9uuU',
  'AIzaSyBFKk8tiIMu5fu4mCmGg0dHo0IE-OEMh5g',
  'AIzaSyDQKO3BM_8P9MIILGPEpMgL5mtHAngJLu4',
  'AIzaSyAMeQoWonLHNNetmgbv-N4vz2dqyA1JTrA',
  'AIzaSyB_EXOVSxRqqFX7hXJagmY3TCrX9EthVmk',
  'AIzaSyD9nZQf9BUuSo1bvX0DZbUPgeqjvCswL-o',
  'AIzaSyA9QKrkNztFZaAka3sdlsbCo2FjTDGUh3I'
];

// 테스트할 모델 후보들
const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-1.0-pro'
];

async function test() {
  console.log('🧪 모델 및 키 호환성 정밀 테스트 시작...');
  
  for (const key of API_KEYS) {
    console.log(`\n🔑 Key: ${key.substring(0, 10)}...`);
    for (const modelName of MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('hi');
        console.log(`  ✅ [SUCCESS] Model: ${modelName}`);
        break; // 하나 성공하면 다음 키로
      } catch (err) {
        console.log(`  ❌ [FAIL] Model: ${modelName} -> ${err.message}`);
      }
    }
  }
}

test();
