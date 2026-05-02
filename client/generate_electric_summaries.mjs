import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
if (keys.length === 0) {
  console.error("No API keys found in .env.local (GEMINI_API_KEYS)");
  process.exit(1);
}

let keyIndex = 0;
function getNextKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const classifyQuestion = (q) => {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
  if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|오옴|플레밍|키르히호프|정전기|전력|전력량/.test(text)) return "전기이론";
  if (/변압기|전동기|발전기|정류기|제어|동기기|유도기|직류기|슬립|토크|권선|브러시|슬립링/.test(text)) return "전기기기";
  return "전기설비";
};

async function generateSummaries(questionsChunk, unitName, setNum) {
  const apiKey = getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const promptText = `
너는 대한민국 최고의 전기 교육 전문가이자 공학 박사야.
전기기능사 시험 중 [${unitName}] 단원의 기출문항 데이터를 읽고, 수험생들이 눈을 떼지 못할 만큼 쉽고 재미있는 '교육용 학습 카드 슬라이드 10장'을 만들어줘.

[슬라이드 구성 규칙]
- title: 눈에 쏙 들어오는 직관적인 핵심 개념 제목
- content: 보이지 않는 전기의 흐름을 물의 흐름, 고속도로, 택배 배달 등 일상적인 상황에 비유해서 설명 (매우 친절하게 2~3문장)
- visual: 개념을 형상화한 이모지와 핵심 부품 키워드 (예: ⚡ 저항 R, 💡 옴의 법칙)
- exam_point: 시험 문제에서 정답을 찾아내는 비법이나 꼭 외워야 할 공식 암기 팁
- image: "/summaries/전기기능사/slide_${unitName}_${setNum}_{id}.webp" 형식으로 지정 (id는 1~10)

문항 데이터:
${JSON.stringify(questionsChunk.map(q => ({ q: q.question, e: q.explanation })), null, 2)}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              slides: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "INTEGER" },
                    title: { type: "STRING" },
                    content: { type: "STRING" },
                    visual: { type: "STRING" },
                    exam_point: { type: "STRING" },
                    image: { type: "STRING" }
                  },
                  required: ["id", "title", "content", "visual", "exam_point", "image"]
                }
              }
            },
            required: ["slides"]
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
      const rawText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(rawText);
      return parsed.slides;
    }
    return null;
  } catch (error) {
    console.error(`Failed generation for ${unitName} Set ${setNum}:`, error.message);
    return null;
  }
}

async function processAll() {
  const dbPath = 'e:/DugiGo/client/src/data/전기기능사/MASTER_DB.json';
  const targetDir = 'e:/DugiGo/client/src/summaries/전기기능사';
  
  if (!fs.existsSync(dbPath)) return;
  const rawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const allQuestions = Array.isArray(rawDb) ? rawDb : (rawDb.questions || []);

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const units = {
    "전기이론": [],
    "전기기기": [],
    "전기설비": []
  };

  allQuestions.forEach(q => {
    const unit = classifyQuestion(q);
    units[unit].push(q);
  });

  const setSize = 30;

  for (const [unitName, questions] of Object.entries(units)) {
    console.log(`\nProcessing Unit: ${unitName} (${questions.length} questions)`);
    const totalSets = Math.ceil(questions.length / setSize);

    for (let setNum = 1; setNum <= totalSets; setNum++) {
      const outputPath = path.join(targetDir, `${unitName}_${setNum}세트.json`);
      
      if (fs.existsSync(outputPath)) {
        console.log(`  [Skipping] ${unitName} Set ${setNum} (Already exists)`);
        continue;
      }

      const startIdx = (setNum - 1) * setSize;
      const chunk = questions.slice(startIdx, startIdx + setSize);

      console.log(`  [Generating] ${unitName} Set ${setNum}...`);
      const slides = await generateSummaries(chunk, unitName, setNum);

      if (slides) {
        const finalOutput = {
          subject: "전기기능사",
          unit: unitName,
          set: setNum,
          slides: slides
        };
        fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
        console.log(`  [Saved] ${unitName} Set ${setNum}`);
        await sleep(3000); // 3s gap
      } else {
        console.error(`  [Failed] ${unitName} Set ${setNum}. Pausing 10s...`);
        await sleep(10000);
      }
    }
  }
  console.log("\n[Done] All Electrician sets generated!");
}

processAll();
