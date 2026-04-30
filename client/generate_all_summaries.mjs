import fs from 'fs';
import path from 'path';

const keys = [
  'AIzaSyDznL1UlJrBFqZLKotoLW9NiQVs_zxk5OU',
  'AIzaSyDXSHR17sV3ZfOJ7YLImi8m-IkkX9qh5xc',
  'AIzaSyDuWHZc6MQkW2Fu0hlmRBj-D7j7vev1G-M',
  'AIzaSyAEJqMiihrxK0mGA1Y4GWSpZERDfXX02U4'
];

let keyIndex = 0;
function getNextKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const classifyQuestion = (q) => {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
  if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "기계일반";
  return "기본 단원";
};

async function generateSummaries(questionsChunk, setNum) {
  const apiKey = getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const promptText = `
너는 20년 경력의 승강기 유지보수 및 기계 설계 전문가야.
승강기기능사 시험 중 [기계일반] 과목의 다음 30가지 기출문항 데이터를 읽고, 수험생들이 개념을 쉽게 이해하고 암기할 수 있도록 '총 8장의 교육용 학습 카드 슬라이드 자료'를 만들어줘.

[데이터 조건]
- title: 수험생의 이목을 끄는 흥미롭고 명쾌한 제목 (예: "끊어지지 않는 튼튼함, 와이어로프!")
- content: 승강기 부품 원리를 초등학생도 알기 쉽게 비유를 들어 설명하는 핵심 내용 (2~3문장)
- visual: 이해를 직관적으로 돕는 핵심 부품/키워드 이모지 및 키워드 요약 (예: "💪 정격 파단강도 × 로프 가닥수")
- exam_point: 기출문제 보기에 자주 등장하는 오답 함정 또는 필수 암기 조건

문항 데이터:
${JSON.stringify(questionsChunk.map(q => ({ q: q.question, e: q.explanation })), null, 2)}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ],
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
                    exam_point: { type: "STRING" }
                  },
                  required: ["id", "title", "content", "visual", "exam_point"]
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
    } else {
      console.error(`Unexpected API response schema:`, JSON.stringify(data));
      return null;
    }
  } catch (error) {
    console.error(`Failed generation for Set ${setNum}:`, error.message);
    return null;
  }
}

async function processAll() {
  const dbPath = 'e:/DugiGo/client/src/data/승강기기능사/MASTER_DB.json';
  if (!fs.existsSync(dbPath)) {
    console.error(`MASTER_DB not found!`);
    return;
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const allQuestions = db.questions || [];

  // 1. Filter for 기계일반
  let filtered = allQuestions.filter(q => classifyQuestion(q) === "기계일반");
  
  // 2. Sort by question text (mirroring backend logic)
  filtered.sort((a, b) => {
    const textA = (a.question || '').toString();
    const textB = (b.question || '').toString();
    return textA.localeCompare(textB);
  });

  console.log(`Total 기계일반 questions found: ${filtered.length}`);

  const setSize = 30;
  const maxSets = 48;
  const targetDir = 'e:/DugiGo/client/src/summaries/승강기기능사';

  for (let setNum = 1; setNum <= maxSets; setNum++) {
    const startIdx = (setNum - 1) * setSize;
    if (startIdx >= filtered.length) {
      console.log(`Ran out of questions at Set ${setNum}. Stopping.`);
      break;
    }
    
    const chunk = filtered.slice(startIdx, startIdx + setSize);
    const outputPath = path.join(targetDir, `기계일반_${setNum}세트.json`);
    
    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Set ${setNum} already exists, skipping.`);
      continue;
    }

    console.log(`Generating summaries for Set ${setNum} (${chunk.length} questions)...`);
    const slides = await generateSummaries(chunk, setNum);

    if (slides) {
      // Re-add default image field for frontend consistency
      slides.forEach(slide => {
        slide.image = `/summaries/승강기기능사/slide_${setNum}_${slide.id}.png`;
      });

      const finalOutput = {
        subject: "승강기기능사",
        unit: "기계일반",
        set: setNum,
        slides: slides
      };

      fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
      console.log(`Saved Set ${setNum} to ${outputPath}`);
      await sleep(6000); // 6s gap for API safety
    } else {
      console.log(`Failed to process Set ${setNum}. Pausing for 10s...`);
      await sleep(10000);
    }
  }
}

processAll();
