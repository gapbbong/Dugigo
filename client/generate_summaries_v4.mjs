import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

let API_KEYS = [
  'AIzaSyC3PpvfbdMxb3ajXvtP-4m3uLHa-qcDsU0',
  'AIzaSyDmvjV4-D0WaWxOurP5TuUTjhc_c5ODHwk',
  'AIzaSyAZIaqtGyf4lIM6A60yJevVW4l-T5gTM_4',
  'AIzaSyBsWpRqpQA61MW0mFEWLEuvcTk15LNfxfg'
];

let keyIndex = 0;
function getNextApiKey() {
  if (API_KEYS.length === 0) throw new Error('All API keys are exhausted or leaked!');
  const key = API_KEYS[keyIndex % API_KEYS.length];
  keyIndex++;
  return key;
}

async function generateSetSlides(subject, unit, set, questions) {
  const safeUnitName = unit.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  const targetPath = path.resolve(process.cwd(), 'public', 'summaries', subject, `${safeUnitName}_SET_${set}.json`);
  
  if (fs.existsSync(targetPath)) return;

  const apiKey = getNextApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
    당신은 IT 교육 전문가입니다. '${subject}' 과목의 '${unit}' 단원 학습 슬라이드를 만드세요.
    규칙: 4문장 이내, 250자 이내. 친절한 비유 사용. 초등/중등 언급 금지.
    
    데이터: ${JSON.stringify(questions.map(q => ({ q: q.question, e: q.explanation })))}
    
    Format JSON:
    {
      "subject": "${subject}",
      "unit": "${unit}",
      "set": ${set},
      "slides": [
        {
          "id": 1,
          "title": "...",
          "content": "...",
          "visual": "...",
          "exam_point": "...",
          "image": "/summaries/${subject}/${safeUnitName}_SET_${set}_slide_1.png"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found');
    
    const data = JSON.parse(jsonMatch[0]);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[SUCCESS] Saved: ${targetPath}`);
  } catch (err) {
    console.error(`[ERROR] SET ${set}: ${err.message}`);
  }
}

async function main() {
  const subjects = [
    { name: '승강기기능사', db: 'MASTER_DB.json' },
    { name: '컴퓨터활용능력 2급', db: 'Literacy2_MASTER_DB.json' }
  ];

  for (const sub of subjects) {
    const dbPath = path.resolve(process.cwd(), 'src', 'data', sub.name, sub.db);
    if (!fs.existsSync(dbPath)) continue;
    const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const allQuestions = Array.isArray(dbContent) ? dbContent : (dbContent.questions || []);

    const sets = [];
    for(let i=0; i<allQuestions.length; i+=30) {
      sets.push(allQuestions.slice(i, i+30));
    }

    console.log(`\n=== Processing ${sub.name} (${sets.length} total sets) ===`);
    for (let i=0; i<sets.length; i++) {
      console.log(`Generating Set ${i+1}/${sets.length}...`);
      await generateSetSlides(sub.name, "General", i+1, sets[i]);
      // 30초 대기 (Quota 방어)
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

main().catch(console.error);
