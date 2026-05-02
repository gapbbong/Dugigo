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
  if (/sql|릴레이션|테이블|데이터베이스|조인|정규화|뷰|인덱스|트랜잭션|ddl|dml|dcl|select|update|delete|insert|기본키|외래키/.test(text)) return "데이터베이스 활용";
  if (/테스트|블랙박스|화이트박스|오류|결함|디버깅|검사|통합|알파|베타|유지보수|스텁|드라이버|단위|인수/.test(text)) return "애플리케이션 테스트 관리";
  if (/운영체제|리눅스|유닉스|쉘|스케줄링|프로세스|네트워크|osi|tcp|ip|라우팅|보안|통신|윈도우|dos|디렉터리/.test(text)) return "운영체제 및 네트워크 기초";
  if (/c언어|자바|파이썬|변수|배열|포인터|연산자|반복문|함수|클래스|객체|상속|알고리즘|순서도|자료구조|스택|큐|트리/.test(text)) return "프로그래밍 언어 활용";
  return "소프트웨어 개발 기초";
};

async function generateSummaries(questionsChunk, unitName, setNum) {
  const apiKey = getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const promptText = `
너는 정보처리 전문가이자 IT 교육 콘텐츠 기획자야.
정보처리기능사 시험 중 [${unitName}] 단원의 기출문항 데이터를 읽고, 수험생들이 개념을 쉽게 이해하고 암기할 수 있도록 '총 10장의 교육용 학습 카드 슬라이드 자료'를 만들어줘.

[데이터 조건]
- title: 수험생의 이목을 끄는 흥미롭고 명쾌한 IT 핵심 제목
- content: IT 개념을 실생활 사례나 직관적인 비유(예: 데이터베이스는 도서관, 프로토콜은 외국어 회화 등)를 들어 초보자도 알기 쉽게 설명 (2~3문장)
- visual: 이해를 직관적으로 돕는 핵심 부품/키워드 이모지 및 IT 기술 키워드 요약
- exam_point: 시험에서 정답을 골라내는 핵심 키워드나 헷갈리는 오답 포인트 팁
- image: "/summaries/정보처리기능사/slide_${unitName}_${setNum}_{id}.webp" 형식으로 지정 (id는 1~10)

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
  const dbPath = 'e:/DugiGo/client/src/data/정보처리기능사/MASTER_DB.json';
  const targetDir = 'e:/DugiGo/client/src/summaries/정보처리기능사';
  
  if (!fs.existsSync(dbPath)) return;
  const rawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const allQuestions = Array.isArray(rawDb) ? rawDb : (rawDb.questions || []);

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const units = {
    "데이터베이스 활용": [],
    "애플리케이션 테스트 관리": [],
    "운영체제 및 네트워크 기초": [],
    "프로그래밍 언어 활용": [],
    "소프트웨어 개발 기초": []
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
          subject: "정보처리기능사",
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
  console.log("\n[Done] All Information Processing sets generated!");
}

processAll();
