import { GoogleGenerativeAI } from '@google/generative-ai';

const keys = [
  'AIzaSyDql8tW5hAIKVjxZEPF6dZ3cJydu7q9uuU',
  'AIzaSyCYORHvQP0OKdyBN2femGhUF_U634d1rDw',
  'AIzaSyCcPcc5jPYNNJrgTeZ6gAgr0_tfkTP_hfA',
  'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s',
  'AIzaSyC3PpvfbdMxb3ajXvtP-4m3uLHa-qcDsU0',
  'AIzaSyDmvjV4-D0WaWxOurP5TuUTjhc_c5ODHwk',
  'AIzaSyAZIaqtGyf4lIM6A60yJevVW4l-T5gTM_4',
  'AIzaSyBsWpRqpQA61MW0mFEWLEuvcTk15LNfxfg'
];

async function test() {
  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await res.json();
      if (data.error) {
        console.log(`Key ${key.substring(0, 10)}... : ${data.error.message}`);
      } else {
        console.log(`Key ${key.substring(0, 10)}... : OK`);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
test();
