import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEYS = [
  'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s',
  'AIzaSyC3PpvfbdMxb3ajXvtP-4m3uLHa-qcDsU0',
  'AIzaSyDmvjV4-D0WaWxOurP5TuUTjhc_c5ODHwk',
  'AIzaSyAZIaqtGyf4lIM6A60yJevVW4l-T5gTM_4',
  'AIzaSyBsWpRqpQA61MW0mFEWLEuvcTk15LNfxfg'
];

async function validate() {
  for (const key of API_KEYS) {
    console.log(`Testing key: ${key}`);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent("Hello");
      const text = result.response.text();
      console.log(`[VALID] Key is working.`);
    } catch (err) {
      if (err.message.includes('leaked')) {
        console.log(`[LEAKED] Key is revoked!`);
      } else {
        console.log(`[FAILED] Error: ${err.message}`);
      }
    }
    console.log('---');
  }
}

validate();
