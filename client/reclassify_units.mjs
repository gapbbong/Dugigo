import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기능사';

function classify(q) {
  const num = q.question_num;
  const text = (q.question + ' ' + (q.explanation || '')).toLowerCase();

  // Primary Section by Number
  if (num >= 1 && num <= 20) {
    if (text.includes('콘덴서') || text.includes('인덕턴스') || text.includes('자기') || text.includes('전기장')) 
      return '[이론] 전기장과 인덕턴스';
    if (text.includes('교류') || text.includes('임피던스') || text.includes('리액턴스') || text.includes('위상')) 
      return '[이론] 교류 회로';
    return '[이론] 일반 전기 이론';
  }

  if (num >= 21 && num <= 40) {
    if (text.includes('직류') || text.includes('브러시') || text.includes('정류자')) 
      return '[기기] 직류 발전기와 전동기';
    if (text.includes('동기') || text.includes('주파수')) 
      return '[기기] 동기 발전기와 전동기';
    if (text.includes('변압기') || text.includes('결선') || text.includes('비율')) 
      return '[기기] 변압기';
    if (text.includes('유도') || text.includes('슬립')) 
      return '[기기] 유도 전동기 및 정류기';
    return '[기기] 전기 기기 일반';
  }

  if (num >= 41 && num <= 60) {
    if (text.includes('접지') || text.includes('차단기') || text.includes('보호')) 
      return '[설비] 접지, 차단기 및 보호 장치';
    if (text.includes('배선') || text.includes('전선') || text.includes('공사') || text.includes('관')) 
      return '[설비] 옥내 배선 공사';
    if (text.includes('조명') || text.includes('기구')) 
      return '[설비] 조명 및 기타 응용';
    return '[설비] 기타 및 안전 수칙';
  }

  return q.sub_unit || '기타';
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  if (!data.questions) return;

  let changed = false;
  data.questions.forEach(q => {
    const newUnit = classify(q);
    if (q.sub_unit !== newUnit) {
      q.sub_unit = newUnit;
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`RECLASSIFIED: ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
files.forEach(f => processFile(path.join(dataDir, f)));
console.log('Re-classification complete.');
