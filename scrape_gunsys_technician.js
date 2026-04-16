const fs = require('fs');
const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const url = "https://www.gunsys.com/q/index.php?category=%EC%A0%84%EA%B8%B0%EA%B8%B0%EB%8A%A5%EC%82%AC";
  console.log("Fetching Technician Index:", url);
  const html = await fetchHtml(url);
  
  // Look for 2016년 2회 전기기능사
  const matches = [...html.matchAll(/href=(['"])(.*?)(['"])[^>]*>([^<]*2016[^<]*)</g)];
  
  let targetUrl = null;
  for (const m of matches) {
    if (m[4].includes('2회') && m[4].includes('기능사')) {
      targetUrl = m[2];
      console.log("TARGET ACQUIRED:", targetUrl);
      break;
    }
  }
  
  if (!targetUrl) {
    console.log("Target link not found.");
    return;
  }
  
  let fullUrl = targetUrl;
  if (!fullUrl.startsWith('http')) {
      if (fullUrl.startsWith('?')) {
          fullUrl = 'https://www.gunsys.com/q/index.php' + fullUrl;
      } else {
          fullUrl = 'https://www.gunsys.com/q/' + fullUrl;
      }
  }
  
  console.log("Fetching test page:", fullUrl);
  const testHtml = await fetchHtml(fullUrl);
  fs.writeFileSync('d:/App/Dukigo/tmp/gunsys_technician.html', testHtml);
  console.log("Saved test HTML to tmp/gunsys_technician.html");
}

run();
