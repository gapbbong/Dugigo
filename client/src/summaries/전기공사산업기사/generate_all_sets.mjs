import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 살아있는 정예 키 리스트 (1번, 3번)
const API_KEYS = [
  'AIzaSyC3PpvfbdMxb3ajXvtP-4m3uLHa-qcDsU0',
  'AIzaSyAZIaqtGyf4lIM6A60yJevVW4l-T5gTM_4'
];

function getApiKey() {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

const subject = '전기공사산업기사';
const dataDir = `e:/DugiGo/client/src/data/${subject}`;
const outputDir = `e:/DugiGo/client/public/summaries/${subject}`;

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function generateSet(unitName, setNum, questions) {
  const safeUnitName = unitName.replace(/[^a-z0-9가-힣]/gi, '_');
  const fileName = `${safeUnitName}_${setNum}세트.json`;
  const filePath = path.join(outputDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`Skipping: ${fileName} (Already exists)`);
    return;
  }

  const genAI = new GoogleGenerativeAI(getApiKey());
  // 검증된 모델명 사용
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    당신은 전기공사산업기사 교육 전문가입니다. 
    제공된 문제를 바탕으로 '${unitName}' 단원 '${setNum}세트' 학습 슬라이드 10장을 생성하세요.
    
    [규칙]
    1. 비유와 쉬운 설명을 사용하세요.
    2. 'image' 경로는 "/summaries/${subject}/${safeUnitName}_${setNum}_slide_{id}.png"로 하세요.
    3. 반드시 JSON으로만 응답하세요.

    [문제 데이터]
    ${JSON.stringify(questions.slice(0, 30))}

    [응답 형식]
    {
      "subject": "${subject}",
      "unit": "${unitName}",
      "set": ${setNum},
      "slides": [
        { "id": 1, "title": "...", "content": "...", "emoji": "⚡", "exam_point": "..." }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      fs.writeFileSync(filePath, jsonMatch[0]);
      console.log(`Generated: ${fileName}`);
    }
  } catch (e) {
    if (e.message.includes('429') || e.message.includes('403')) {
      console.warn(`Issue with ${fileName} (${e.message}). Waiting 45s...`);
      await new Promise(r => setTimeout(r, 45000));
      return generateSet(unitName, setNum, questions); // Retry
    }
    console.error(`Failed: ${fileName}`, e.message);
  }
}

async function main() {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.includes('MASTER'));
  
  for (const file of files) {
    const unitName = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const questions = Array.isArray(data) ? data : (data.questions || []);
    const totalSets = Math.ceil(questions.length / 30);

    console.log(`\nProcessing ${unitName} (${totalSets} sets)`);
    
    for (let s = 1; s <= totalSets; s++) {
      const setQuestions = questions.slice((s - 1) * 30, s * 30);
      await generateSet(unitName, s, setQuestions);
      // 할당량 보존을 위한 넉넉한 대기 시간
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

main();
