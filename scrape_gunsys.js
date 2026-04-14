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
  const html = fs.readFileSync('d:/App/Dukigo/tmp/gunsys.html', 'utf8');
  
  // Look for 2016년 2회 전기기사
  // Usually the link is something like <a href="?test=...&idx=...">2016년 2회 전기기사...
  // In Gunsys, it might be ?board=... or something.
  const regex = /href=(['"])(([^'"]*?)%EC%A0%84%EA%B8%B0%EA%B8%B0%EC%82%AC([^'"]*?))['"][^>]*>([^<]*2016년[^<]*2회[^<]*)/i;
  
  // Let's print out all hrefs that contain 2016 to see the format
  const matches = [...html.matchAll(/href=(['"])(.*?)(['"])[^>]*>([^<]*2016[^<]*)</g)];
  
  let targetUrl = null;
  for (const m of matches) {
    console.log("Found 2016 link:", m[2], m[4].trim());
    if (m[4].includes('2회') && m[4].includes('전기기사')) {
      targetUrl = m[2];
      console.log("TARGET ACQUIRED:", targetUrl);
    }
  }
  
  if (!targetUrl) {
    console.log("Target link not found in index HTML. Let's dump the HTML so we can see it.");
    return;
  }
  
  // Fetch the target URL. Assuming it's a relative path if it doesn't start with http
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
  fs.writeFileSync('d:/App/Dukigo/tmp/gunsys_test.html', testHtml);
  console.log("Saved test HTML to tmp/gunsys_test.html");
}

run();
