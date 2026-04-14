import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// .env.local 로드
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ API 키를 찾을 수 없습니다. .env.local 파일을 확인해 주세요.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// 대상 종목 설정 (명령어 인자로 받거나 기본값 설정)
const subject = process.argv[2] || "전기기능사";
const dataDir = path.join(process.cwd(), 'src', 'data', subject);
const cacheFile = path.join(process.cwd(), 'classification_cache.json');

async function runClassification() {
  console.log(`🤖 [${subject}] AI 자동 분류 엔진 가동 시작...`);

  // 1. 모든 파일 읽기 및 문항 추출
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ 해당 경로를 찾을 수 없습니다: ${dataDir}`);
    return;
  }

  let allQuestions = [];
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    try {
      const rawData = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      let questions = [];
      if (Array.isArray(rawData)) {
        questions = rawData;
      } else if (rawData.questions && Array.isArray(rawData.questions)) {
        questions = rawData.questions;
      } else {
        console.warn(`⚠️ [${file}] 유효한 문항 배열을 찾을 수 없습니다. 건너뜁니다.`);
        continue;
      }

      allQuestions.push(...questions.map(q => ({
        ...q,
        _sourceFile: file
      })));
    } catch (err) {
      console.error(`❌ [${file}] 파일 읽기 오류:`, err.message);
    }
  }

  // 2. 중복 문항 제거 및 유효성 검사
  const uniqueQuestions = [];
  const seenTexts = new Set();
  for (const q of allQuestions) {
    if (!q.question || typeof q.question !== 'string') {
      console.warn(`⚠️ [${q.id || 'Unknown ID'}] 질문 텍스트가 없거나 비정상적입니다.`);
      continue;
    }
    const cleanText = q.question.trim();
    if (!seenTexts.has(cleanText)) {
      seenTexts.add(cleanText);
      uniqueQuestions.push(q);
    }
  }

  console.log(`📊 전체 문항: ${allQuestions.length}개 / 고유 문항: ${uniqueQuestions.length}개`);

  // 3. 캐시 로드
  let cache = {};
  if (fs.existsSync(cacheFile)) {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  // 4. 분류되지 않은 문항 필터링
  const pendingQuestions = uniqueQuestions.filter(q => !cache[q.question.trim()]);
  console.log(`🔍 신규 분류 대상: ${pendingQuestions.length}개`);

  if (pendingQuestions.length === 0) {
    console.log("✅ 모든 문항이 이미 분류되어 있습니다.");
    await applyResults(allQuestions, cache);
    return;
  }

  // 5. AI 호출 (배치 처리 - 40개씩)
  const BATCH_SIZE = 40;
  for (let i = 0; i < pendingQuestions.length; i += BATCH_SIZE) {
    const batch = pendingQuestions.slice(i, i + BATCH_SIZE);
    console.log(`🧠 AI 작업 중... (${i + 1} ~ ${Math.min(i + BATCH_SIZE, pendingQuestions.length)} / ${pendingQuestions.length})`);
    
    try {
      const result = await classifyBatchWithAI(batch);
      Object.assign(cache, result);
      // 중간 저장 (안정성)
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
    } catch (err) {
      console.error(`❌ 배치 처리 중 오류 발생:`, err.message);
      // 잠시 대기 후 재시도 (Rate Limit 대비)
      await new Promise(r => setTimeout(r, 5000));
      i -= BATCH_SIZE; 
    }
  }

  // 6. 원본 파일에 결과 적용
  await applyResults(allQuestions, cache);
}

async function classifyBatchWithAI(batch) {
  const prompt = `
    당신은 자격증 시험 전문 강사입니다. 아래의 기출문제들을 읽고 각 문제에 가장 적합한 '소단원(Micro-Unit)' 명칭을 결정해 주세요.
    
    [가이드라인]
    1. 소단원 명칭은 구체적이고 전문적이어야 합니다. (예: '비오 사바르의 법칙', '변압기의 등가회로')
    2. 한 단원당 약 20~35문제가 모이도록 적절한 입도로 분류해 주세요.
    3. 결과는 반드시 다음과 같은 JSON 형식으로만 응답해 주세요 (다른 설명 불필요):
       { "질문텍스트": "소단원명" }
    4. 질문 텍스트는 아래 제공된 것과 토씨 하나 틀리지 않고 '완전히 동일'해야 합니다. (번호 붙이지 마세요)

    [대상 문제 목록]
    ${batch.map(q => q.question).join('\n')}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI 응답에 유효한 JSON이 없습니다.");
  }

  let cleanedJson = jsonMatch[0];
  
  // 백슬래시 보정: JSON에서 허용되지 않는 이스케이프 방지
  // \ 기호를 \\로 치환하되, 이미 이스케이프된 것들은 제외
  cleanedJson = cleanedJson.replace(/\\/g, '\\\\').replace(/\\\\"/g, '\\"');

  try {
    const parsed = JSON.parse(cleanedJson);
    return parsed;
  } catch (err) {
    console.error("❌ JSON 파싱 에러. 보정된 텍스트:", cleanedJson);
    throw new Error("AI 응답의 JSON 형식이 올바르지 않습니다.");
  }
}

async function applyResults(allQuestions, cache) {
  console.log("💾 분류 결과를 데이터 파일에 적용하는 중...");
  
  const fileGroups = {};
  for (const q of allQuestions) {
    const qText = q.question?.trim() || "";
    const unit = cache[qText] || "미분류";
    q.sub_unit = unit;

    if (!fileGroups[q._sourceFile]) fileGroups[q._sourceFile] = [];
    fileGroups[q._sourceFile].push(q);
  }

  for (const fileName in fileGroups) {
    const filePath = path.join(dataDir, fileName);
    // _sourceFile 메타데이터 제거 후 저장
    const cleanData = fileGroups[fileName].map(({ _sourceFile, ...rest }) => rest);
    fs.writeFileSync(filePath, JSON.stringify({ questions: cleanData }, null, 2));
  }

  console.log("🏁 모든 작업이 완료되었습니다! 이제 대시보드에서 확인해 보세요.");
}

runClassification();
