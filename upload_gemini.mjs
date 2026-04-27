import fs from 'fs';
import https from 'https';

const API_KEY = 'AIzaSyBVMgA2JdX0YV4PC7Pmb596BsQYNTegSBs';
const FILE_PATH = 'e:\\DugiGo\\scan\\ElectricExam2019-2022_part1.pdf';
const FILE_NAME = 'ElectricExam2019-2022_part1.pdf';

async function uploadFile() {
  const stats = fs.statSync(FILE_PATH);
  const fileSize = stats.size;

  console.log(`Uploading ${FILE_NAME} (${fileSize} bytes)...`);

  // Step 1: Initial resumable upload request
  const options1 = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/upload/v1beta/files?key=${API_KEY}`,
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': fileSize,
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'Content-Type': 'application/json',
    },
  };

  const req1 = https.request(options1, (res) => {
    const uploadUrl = res.headers['x-goog-upload-url'];
    if (!uploadUrl) {
      console.error('Failed to get upload URL');
      process.exit(1);
    }

    const fileStream = fs.createReadStream(FILE_PATH);
    
    // Step 2: Upload the actual file
    const url = new URL(uploadUrl);
    const options2 = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
        'Content-Length': fileSize,
      },
    };

    const req2 = https.request(options2, (res2) => {
      let data = '';
      res2.on('data', (chunk) => data += chunk);
      res2.on('end', () => {
        const response = JSON.parse(data);
        console.log('Upload complete!');
        console.log('File URI:', response.file.uri);
        fs.writeFileSync('gemini_file_uri.txt', response.file.uri);
      });
    });

    fileStream.pipe(req2);
  });

  req1.write(JSON.stringify({ file: { display_name: FILE_NAME } }));
  req1.end();
}

uploadFile();
