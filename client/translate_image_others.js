const sharp = require('sharp');

// Helper function to create SVG text box
const createLabel = (x, y, w, text) => `
  <g transform="translate(${x}, ${y})">
    <rect width="${w}" height="56" rx="12" fill="#ffffff" stroke="#635bff" stroke-width="3"/>
    <text x="${w / 2}" y="38" font-family="sans-serif" font-weight="900" font-size="32px" fill="#1e293b" text-anchor="middle">${text}</text>
  </g>
`;

async function processImages() {
  // Slide 2: Movable Pulley
  const labels2 = [
    createLabel(650, 150, 320, "당기는 힘 (P = W/2)"),
    createLabel(350, 480, 280, "움직도르래 (동활차)"),
    createLabel(400, 750, 240, "물체의 무게 (W)")
  ].join('');

  const svg2 = `<svg width="1024" height="1024">${labels2}</svg>`;

  await sharp('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_2.png')
    .composite([{ input: Buffer.from(svg2), top: 0, left: 0 }])
    .toFile('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_2_ko.png');

  // Slide 4: Mechanical Parking Weight Distribution
  const labels4 = [
    createLabel(100, 150, 260, "기계식 주차장치"),
    createLabel(200, 700, 240, "전륜 하중 (60%)"),
    createLabel(650, 700, 240, "후륜 하중 (40%)")
  ].join('');

  const svg4 = `<svg width="1024" height="1024">${labels4}</svg>`;

  await sharp('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_4.png')
    .composite([{ input: Buffer.from(svg4), top: 0, left: 0 }])
    .toFile('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_4_ko.png');

  console.log('Successfully generated Korean annotated images for slide 2 and 4!');

  // Overwrite originals
  const fs = require('fs');
  fs.renameSync('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_2_ko.png', 'e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_2.png');
  fs.renameSync('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_4_ko.png', 'e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_4.png');
}

processImages().catch(console.error);
