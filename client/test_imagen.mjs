import fs from 'fs';

const apiKey = 'AIzaSyDznL1UlJrBFqZLKotoLW9NiQVs_zxk5OU';
const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;

async function test() {
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
            prompt: "A modern gold key with small gears around it, premium 3D design, isolated on white background"
          }
        ],
        parameters: {
          sampleCount: 1
        }
      })
    });
    
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log(`Keys in response:`, Object.keys(data));
    if (data.predictions) {
      console.log(`Predictions count:`, data.predictions.length);
      console.log(`Keys in first prediction:`, Object.keys(data.predictions[0]));
    } else if (data.error) {
      console.error(`Error from API:`, data.error);
    }
  } catch (err) {
    console.error(`Failed fetch:`, err.message);
  }
}

test();
