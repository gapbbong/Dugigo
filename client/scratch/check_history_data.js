const fs = require('fs');
const path = require('path');

const subject = '한국사검정시험';
const dataDir = path.join(process.cwd(), 'src/data', subject);

if (!fs.existsSync(dataDir)) {
  console.log('Subject folder not found');
  process.exit(1);
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
const examsMap = new Map();
const unitMap = new Map();

files.forEach(file => {
  const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  const data = JSON.parse(content);
  const questions = Array.isArray(data) ? data : (data.questions || []);
  
  console.log(`Checking ${file}: ${questions.length} questions`);

  questions.forEach(q => {
    // Round/Year detection
    const y = q.year || data.year;
    const r = q.round || data.round;
    if (y && r) {
      const key = `${y}년 ${r}회`;
      examsMap.set(key, (examsMap.get(key) || 0) + 1);
    }

    // Unit classification
    const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
    let unit = "기본 단원";
    if (/구석기|신석기|청동기|철기|고조선|부여|고구려|옥저|동예|삼한|빗살무늬|고인돌|주먹도끼/.test(text) && !/백제|신라|고려|조선/.test(text)) unit = "선사시대 및 국가의 형성";
    else if (/백제|신라|통일신라|발해|가야|어라하|건흥|해동성국|골품|화랑|삼국/.test(text)) unit = "고대 사회 (삼국~남북국)";
    else if (/고려|광종|성종|공민왕|묘청|무신|몽골|거란|여진|전시과/.test(text)) unit = "중세 사회 (고려 시대)";
    else if (/조선|세종|정조|영조|임진왜란|병자호란|사화|붕당|대동법/.test(text)) unit = "근세~근대 태동기 (조선 시대)";
    else if (/강화도|개항|위정척사|동학|갑오개혁|독립협회|대한제국|아관파천/.test(text)) unit = "근대 사회의 전개 (개항기)";
    else if (/일제|독립|3·1|임시 정부|민족 말살|물산 장려|신간회|광복/.test(text)) unit = "일제 강점기";
    else if (/정부 수립|6·25|4·19|5·18|6월 민주 항쟁|민주화|통일/.test(text)) unit = "현대 사회의 발전";
    
    unitMap.set(unit, (unitMap.get(unit) || 0) + 1);
  });
});

console.log('\n--- Detected Exams ---');
console.log(Array.from(examsMap.entries()));

console.log('\n--- Detected Units ---');
console.log(Array.from(unitMap.entries()));
