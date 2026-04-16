import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyBijZ3TNMEiPW-iC_farcdl-9ysKnqRzS8';

const PDF_SOURCES = {
  '2015': 'https://generativelanguage.googleapis.com/v1beta/files/dmv1v54rs2k8',
  '2016': 'https://generativelanguage.googleapis.com/v1beta/files/uptdwc1cagu1'
};

const MISSING_DIAGRAMS = {
  '2015': ['2015_01_4', '2015_01_7', '2015_01_17', '2015_01_18', '2015_04_11', '2015_04_13', '2015_04_20', '2015_04_22', '2015_04_30', '2015_04_31', '2015_04_32', '2015_04_33', '2015_05_31'],
  '2016': ['2016_02_10', '2016_02_15']
};

async function getCoordinates(year, fileUri, questions) {
  console.log(`Getting coordinates for ${year} diagrams using ${fileUri}...`);
  
  const prompt = `Identify the page number and coordinates for the diagrams in the following questions from the provided PDF:
${questions.join(', ')}

Return a JSON array of objects:
{ "id": "YYYY_RR_Num", "page": number, "x": number, "y": number, "w": number, "h": number, "label": "description" }
Coordinates are in PDF points (approx 595x842). (x,y) is bottom-left.`;

  const payload = {
    contents: [{
      parts: [
        { file_data: { file_uri: fileUri, mime_type: 'application/pdf' } },
        { text: prompt }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.candidates && response.candidates[0].content.parts[0].text) {
             resolve(JSON.parse(response.candidates[0].content.parts[0].text));
          } else {
             reject(new Error(`API Error ${year}: ${data}`));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function run() {
    let allCoords = [];
    for (const year of Object.keys(MISSING_DIAGRAMS)) {
        try {
            const coords = await getCoordinates(year, PDF_SOURCES[year], MISSING_DIAGRAMS[year]);
            allCoords = allCoords.concat(coords);
        } catch (e) {
            console.error(e);
        }
    }
    fs.writeFileSync('e:\\DugiGo\\new_coords.json', JSON.stringify(allCoords, null, 2));
    console.log('All missing coordinates saved to new_coords.json');
}

run();
