import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const API_KEYS = (env.GEMINI_API_KEYS || '').split(',').filter(Boolean);

function getApiKey() {
  if (API_KEYS.length === 0) return '';
  const index = Math.floor(Math.random() * API_KEYS.length);
  return API_KEYS[index];
}

const unitsConfig = [
  { name: "01. 선사 시대와 국가의 형성", sets: 3 },
  { name: "02. 삼국 시대와 남북국 시대", sets: 4 },
  { name: "03. 고려 시대", sets: 3 },
  { name: "04. 조선 시대(전기)", sets: 4 },
  { name: "06. 근대 사회의 전개", sets: 2 },
  { name: "07. 일제 강점기와 현대 사회", sets: 5 }
];

async function generateSet(subject, unit, set, allQuestions) {
  const cleanUnit = unit.replace(/\s*\(\d+부\)$/, '').trim();
  const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
  const summaryFileName = `${safeUnitName}_${set}세트.json`;
  
  const baseDir = process.cwd();
  const targetPath = path.join(baseDir, 'public', 'summaries', subject, summaryFileName);
  
  if (fs.existsSync(targetPath)) {
    console.log(`[Skipped] ${unit} Set ${set} already exists.`);
    return;
  }
  
  console.log(`\n[Generating] ${unit} Set ${set}...`);
  const size = 30;
  
  const classify = (q) => {
    return q.sub_unit || q.subject || "";
  };

  const filteredByUnit = allQuestions.filter(q => classify(q) === cleanUnit);
  const setQuestions = filteredByUnit.slice((parseInt(set) - 1) * size, parseInt(set) * size);
  
  const uniqueQuestions = Array.from(new Map(setQuestions.map((q) => [q.question, q])).values())
    .map((q) => ({
      number: q.number,
      question: q.question,
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation
    }));
  
  const slicedQuestions = uniqueQuestions.slice(0, 8);
  const contextQuestions = JSON.stringify(slicedQuestions);
  
  const prompt = `
    당신은 국내 최고의 IT 자격증 및 한국사 교육 전문가입니다. 
    제공된 문제를 바탕으로 '${subject}' 과목의 '${unit}' 단원 '${set}세트'를 요약하는 학습 슬라이드(최대 5장)를 생성하세요.
    핵심 개념 위주로 압축하여 설명하세요.

    [반드시 준수해야 할 응답 구조]
    1. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${safeUnitName}_${set}_slide_{id}.png" 형식으로 지정하세요.
    2. **이미지 생성 프롬프트(visual)**: 이미지 내부에 한글이 들어갈 경우 글자가 깨지지 않도록 'Korean text in high quality font' 등의 지시어를 포함하고, 복잡한 텍스트보다는 직관적인 도식과 아이콘 묘사 위주로 작성하세요.
    3. **이모지(emoji)**: 각 슬라이드 주제에 어울리는 거대하고 화려한 이모지를 하나씩 지정하세요.
    4. **콘텐츠 구성**: 'content' 필드는 친절한 설명(4문장/250자 이내), 'exam_point' 필드는 시험에 나오는 수치나 키워드 위주로 작성하세요.
    5. **svg 필드**: 한국사 요약에서는 복잡한 시각 도식이 불필요하므로, 'svg' 필드는 반드시 빈 문자열 ("")로 설정하세요. 절대로 SVG 코드를 작성하지 마세요.
    6. **형식**: 반드시 유효한 JSON 형식으로만 응답하세요.

    [입력 데이터 (기출문제)]
    ${contextQuestions}

    [응답 형식 JSON]
    {
      "subject": "${subject}",
      "unit": "${unit}",
      "set": ${set},
      "slides": [
        {
          "id": 1,
          "style": "Expert",
          "image": "/summaries/${subject}/${safeUnitName}_${set}_slide_1.png",
          "emoji": "🚀",
          "title": "슬라이드 제목",
          "content": "친절한 설명 (4문장/250자 이내)",
          "visual": "이미지 생성용 상세 묘사",
          "exam_point": "시험 출제 포인트",
          "svg": ""
        }
      ]
    }
  `;
  
  let result;
  let lastError;
  const maxAttempts = 3;
  let delay = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const apiKey = getApiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { timeout: 60000 });
      result = await model.generateContent(prompt);
      break;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt + 1}/${maxAttempts} failed:`, err.message);
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
  
  if (!result) {
    throw lastError || new Error('Failed to generate after 3 attempts');
  }
  
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  
  const generatedData = JSON.parse(jsonMatch[0]);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(generatedData, null, 2));
  console.log(`✅ Succeeded: Cached to ${targetPath}`);
}

async function run() {
  const subject = "한국사검정시험";
  const baseDir = process.cwd();
  const dbPath = path.join(baseDir, 'src', 'data', subject, 'history_master.json');
  
  const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const allQuestions = Array.isArray(dbContent) ? dbContent : (dbContent.questions || []);
  
  console.log(`Starting generation of all ${unitsConfig.reduce((acc, u) => acc + u.sets, 0)} sets for ${subject}...`);
  
  for (const unit of unitsConfig) {
    for (let set = 1; set <= unit.sets; set++) {
      try {
        await generateSet(subject, unit.name, set, allQuestions);
        // Cool down for 1 second to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`❌ Failed generating ${unit.name} Set ${set}:`, err.message);
      }
    }
  }
  
  console.log("\n🎉 Generation task finished!");
}

run();
