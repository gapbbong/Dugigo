const sharp = require('sharp');

const labels = [
  { x: 670, y: 155, w: 220, text: "기계실" },
  { x: 710, y: 210, w: 240, text: "권상기(모터)" },
  { x: 720, y: 265, w: 180, text: "제어반" },
  { x: 710, y: 350, w: 260, text: "트랙션 도르래" },
  { x: 720, y: 430, w: 200, text: "권상 로프" },
  { x: 720, y: 485, w: 220, text: "가이드 레일" },
  { x: 720, y: 660, w: 180, text: "균형추" },
  { x: 620, y: 845, w: 260, text: "균형추 완충기" },
  { x: 260, y: 855, w: 200, text: "카 완충기" },
  { x: 70, y: 565, w: 240, text: "엘리베이터 카" },
  { x: 90, y: 375, w: 220, text: "가이드 레일" },
  { x: 130, y: 235, w: 320, text: "구동 도르래" }
];

let svgs = labels.map(l => `
  <g transform="translate(${l.x}, ${l.y})">
    <rect width="${l.w}" height="56" rx="12" fill="#ffffff" stroke="#635bff" stroke-width="3"/>
    <text x="${l.w / 2}" y="38" font-family="sans-serif" font-weight="900" font-size="32px" fill="#1e293b" text-anchor="middle">${l.text}</text>
  </g>
`).join('');

const svg = `
<svg width="1024" height="1024">
  ${svgs}
</svg>
`;

sharp('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_1.png')
  .composite([{
    input: Buffer.from(svg),
    top: 0,
    left: 0
  }])
  .toFile('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_1_ko.png')
  .then(() => {
    console.log('Successfully generated Korean annotated image!');
    // overwrite original
    const fs = require('fs');
    fs.renameSync('e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_1_ko.png', 'e:/DugiGo/client/public/summaries/승강기기능사/set2_slide_1.png');
  })
  .catch(console.error);
