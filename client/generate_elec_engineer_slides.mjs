import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

// We know the first key is leaked, so we filter it out and keep only the valid ones to save startup quota
const LEAKED_KEY = 'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s';
const ALL_KEYS = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',').filter(Boolean) : [];
const VALID_KEYS = ALL_KEYS.filter(key => key !== LEAKED_KEY);

if (VALID_KEYS.length === 0) {
  console.error("No valid API keys found in .env.local!");
  process.exit(1);
}

console.log(`Initialized with ${VALID_KEYS.length} valid keys.`);

let keyIndex = 0;
function getModel() {
  const key = VALID_KEYS[keyIndex % VALID_KEYS.length];
  keyIndex++;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const subject = "전기기사";
const dataDir = 'e:/DugiGo/client/src/data/전기기사';
const outputDir = 'e:/DugiGo/client/public/summaries/전기기사';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const schema = {
  type: "OBJECT",
  properties: {
    subject: { type: "STRING" },
    unit: { type: "STRING" },
    set: { type: "INTEGER" },
    slides: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "INTEGER" },
          style: { type: "STRING" },
          emoji: { type: "STRING" },
          title: { type: "STRING" },
          content: { type: "STRING" },
          visual: { type: "STRING" },
          exam_point: { type: "STRING" },
          svg: { type: "STRING" }
        },
        required: ["id", "style", "emoji", "title", "content", "visual", "exam_point", "svg"]
      }
    }
  },
  required: ["subject", "unit", "set", "slides"]
};

async function generateSummaries(chunk, unitName, setNum) {
  let retries = 5;
  while (retries > 0) {
    try {
      const model = getModel();
      const prompt = `
너는 대한민국 최고의 전기 자격증 교육 전문가이자 전기공학 박사야.
전기기사 필기 시험 중 [${unitName}] 단원의 ${setNum}세트 기출문항 데이터를 읽고, 수험생들이 핵심 개념을 눈으로 직관적으로 파악하고 뇌리에 깊이 남을 수 있도록 '교육용 학습 카드 슬라이드 5장'을 제작해줘.

각 슬라이드에는 설명하고자 하는 물리 현상이나 개념을 도식화한 깔끔하고 아름다운 SVG 벡터 그래픽이 포함되어야 해.

[슬라이드 작성 규칙]
- style: "Expert"
- emoji: 개념을 대표하는 거대하고 화려한 이모지 1개
- title: 수험생의 이목을 끄는 흥미롭고 직관적인 핵심 개념 제목
- content: 보이지 않는 전기의 흐름이나 공식을 일상적인 비유(예: 전위는 산의 높이, 전계는 경사도, 인덕턴스는 관성, 콘덴서는 그릇 등)를 적극적으로 들어 3~4문장(250자 이내)으로 매우 친절하게 설명.
- visual: SVG 그래픽이 나타내는 내용에 대한 간략한 요약 설명
- exam_point: 시험 문제에서 정답을 찾아내는 비법, 공식 암기 팁, 혹은 헷갈리는 오답 포인트 정리
- svg: 400x250 비율의 깔끔한 반응형 SVG 코드 (<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">...</svg>)

[SVG 그래픽 디자인 가이드라인 (중요)]
1. 수험생들이 보기에 아주 프로페셔널하고 완성도 높은 느낌을 주어야 함.
2. 부드럽고 가독성 좋은 라이트 테마 배경을 채택 (예: <rect width="400" height="250" rx="20" fill="#f8fafc"/> 또는 세련된 그라디언트 적용).
3. 전기기사 개념을 시각적으로 도식화할 것.
   - 예: 전기력선, 자기장 루프, 도체구 내부/외부 전계 분포 그래프, RLC 회로도, 변압기 철심과 권선, 동기 발전기 회전자 도식, 과도현상 곡선 등.
4. <text> 요소를 사용하여 주요 포인트나 수식을 깔끔하게 레이블링할 것 (단, HTML 태그는 절대 사용하지 말고, font-family="sans-serif", font-weight="bold", fill 속성을 지정할 것).
5. 색상 조합은 세련된 HSL 테마나 테일윈드 계열 파스텔/네온톤을 활용 (예: blue, indigo, purple, amber, emerald, rose 등).
6. 모든 SVG 코드는 viewBox="0 0 400 250" 내에서 올바르게 렌더링되도록 좌표를 정확하게 계산하여 완벽한 도형(rect, circle, line, path, polygon)으로 직접 그릴 것. 빈 플레이스홀더나 빈 영역은 절대 금지.

기출문제 데이터:
${JSON.stringify(chunk.map(q => ({ q: q.question, e: q.explanation })), null, 2)}
`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const responseText = result.response.text();
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error(`[ERROR] Set ${setNum} generation error:`, error.message);
      retries--;
      if (retries > 0) {
        const isRateLimit = error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Requests')));
        const waitTime = isRateLimit ? 60000 : 15000;
        console.log(`Retrying Set ${setNum} (${retries} left) in ${waitTime/1000}s...`);
        await sleep(waitTime);
      }
    }
  }
  return null;
}

async function processSubject(fileName) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) return;

  const rawDb = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(rawDb) ? rawDb : (rawDb.questions || []);

  const cleanUnit = fileName.replace(/\.json$/, '').trim();
  const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
  const fallbackUnit = cleanUnit.replace(/^\d+\.\s*/, '').replace(/[^a-z0-9가-힣]/gi, '_');

  console.log(`\n=== Processing ${cleanUnit} (${questions.length} questions) ===`);

  const setSize = 30;
  const totalSets = Math.ceil(questions.length / setSize);

  for (let setNum = 1; setNum <= totalSets; setNum++) {
    if (fallbackUnit === "전기자기학" && setNum === 1) {
      console.log(`  [Skipping] ${cleanUnit} Set ${setNum} (Set 1 already exists)`);
      continue;
    }

    const primaryFile = path.join(outputDir, `${safeUnitName}_${setNum}세트.json`);
    const fallbackFile = path.join(outputDir, `${fallbackUnit}_${setNum}세트.json`);

    if (fs.existsSync(primaryFile) || fs.existsSync(fallbackFile)) {
      console.log(`  [Skipping] ${cleanUnit} Set ${setNum} (Already generated)`);
      continue;
    }

    const startIdx = (setNum - 1) * setSize;
    const chunk = questions.slice(startIdx, startIdx + setSize);

    console.log(`  [Generating] ${cleanUnit} Set ${setNum}/${totalSets}...`);
    const data = await generateSummaries(chunk, cleanUnit, setNum);

    if (data) {
      fs.writeFileSync(primaryFile, JSON.stringify(data, null, 2), 'utf8');
      
      const fallbackData = {
        ...data,
        unit: fallbackUnit
      };
      fs.writeFileSync(fallbackFile, JSON.stringify(fallbackData, null, 2), 'utf8');

      console.log(`  [SUCCESS] Saved ${cleanUnit} Set ${setNum} slides!`);
      await sleep(25000); // 25s sleep stays well within 5 RPM
    } else {
      console.error(`  [FAILURE] Failed to generate ${cleanUnit} Set ${setNum}. Pausing 30s...`);
      await sleep(30000);
    }
  }
}

async function run() {
  const files = [
    '01. 전기자기학.json',
    '02. 전력공학.json',
    '03. 전기기기.json',
    '04. 회로이론 및 제어공학.json',
    '05. 전기설비기술기준.json'
  ];

  for (const file of files) {
    await processSubject(file);
  }

  console.log("\n[SUCCESS] All Electrician summary slides generated!");
}

run().catch(console.error);
