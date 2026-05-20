import fs from 'fs';

const masterPath = 'e:/Quiz-extraction/output/전기기사_MASTER_DB.json';
const data = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

const oldQs = data.filter(q => q.round === '과년도' || q.round?.includes('과년도'));
console.log("과년도로 분류된 문항 수:", oldQs.length);
console.log("\n첫 5개 샘플의 원본 속성들:");
oldQs.slice(0, 5).forEach(q => {
  console.log({
    id: q.id,
    question: q.question?.slice(0, 40),
    year: q.year,
    round: q.round,
    source_page: q.source_page
  });
});

// source_page별로 몇 개씩 있는지 확인
const pageMap = {};
oldQs.forEach(q => {
  pageMap[q.source_page] = (pageMap[q.source_page] || 0) + 1;
});
console.log("\n과년도가 있는 페이지 목록 샘플:");
console.log(Object.entries(pageMap).slice(0, 10));
