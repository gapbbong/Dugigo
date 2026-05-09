import { GoogleGenerativeAI } from '@google/generative-ai';

const keys = [
  'AIzaSyBFKk8tiIMu5fu4mCmGg0dHo0IE-OEMh5g',
  'AIzaSyDQKO3BM_8P9MIILGPEpMgL5mtHAngJLu4',
  'AIzaSyAMeQoWonLHNNetmgbv-N4vz2dqyA1JTrA',
  'AIzaSyB_EXOVSxRqqFX7hXJagmY3TCrX9EthVmk',
  'AIzaSyD9nZQf9BUuSo1bvX0DZbUPgeqjvCswL-o',
  'AIzaSyA9QKrkNztFZaAka3sdlsbCo2FjTDGUh3I'
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
