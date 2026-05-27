import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Load API keys from E:/DugiGo/client/.env.local
let apiKey = '';
const envPath = 'E:/DugiGo/client/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/GEMINI_API_KEYS=([^\r\n]+)/);
  if (match && match[1]) {
    apiKey = match[1].split(',')[0].trim();
  }
}

if (!apiKey) {
  apiKey = 'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s'; // Fallback key
}

console.log(`Using API Key for Retry: ${apiKey.substring(0, 8)}...`);
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Classification logic (matching route.ts)
function classify(subject, q) {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
  const isSubject1 = q.subject && q.subject.includes("컴퓨터 일반");

  if (subject === '컴퓨터활용능력 2급') {
    if (isSubject1) {
      if (/윈도우|windows|바로 가기|제어판|탐색기|작업 표시줄|부팅|레지스트리|시스템 도구|스풀링|인터럽트|포맷/.test(text)) return "[1과목] Windows OS 환경 설정 및 시스템 관리";
      if (/폴더|파일|휴지통|속성|검색|옵션|라이브러리/.test(text)) return "[1과목] 파일 관리 시스템 및 자원 최적화";
      if (/cpu|중앙처리장치|메모리|ram|rom|보조기억|ssd|hdd|usb|바이오스|bios|메인보드|입출력|칩셋|레지스터/.test(text)) return "[1과목] 컴퓨터 하드웨어 아키텍처 분석";
      if (/비트|바이트|워드|진법|자료|코드|ascii|unicode|유니코드|컴파일러|어셈블러|언어 번역/.test(text)) return "[1과목] 데이터 표현 기술 및 소프트웨어 공학 기초";
      if (/멀티미디어|그래픽|이미지|동영상|사운드|오디오|코덱|비선형|bmp|jpg|png|gif|avi|mp4|스트리밍/.test(text)) return "[1과목] 디지털 미디어 활용 및 멀티미디어 기술";
      if (/인터넷|url|ip|tcp|프로토콜|osi|브라우저|도메인|인트라넷|ftp|텔넷|공유기|dns/.test(text)) return "[1과목] 정보 통신 인프라 및 인터넷 네트워크 인프라";
      if (/보안|바이러스|침해|암호|해킹|방화벽|변조|위조|iot|클라우드|ai|모바일|빅데이터/.test(text)) return "[1과목] 정보 보안 시스템 및 최신 ICT 트렌드";
      return "[1과목] 컴퓨터 일반 기타 심화 분석";
    } else {
      if (/시트|워크시트|통합 문서|보호|숨기기|탭 색|이동|복사|이름 바꾸기/.test(text)) return "[2과목] 워크시트 설정 및 시트 관리 프로세스";
      if (/셀 서식|사용자 정의|데이터 입력|자동 채우기|선택하여 붙여넣기|조건부 서식|필터|정렬|유효성|텍스트 나누기|중복 데이터/.test(text)) return "[2과목] 셀 서식 및 데이터 편집/유효성 제어";
      if (/함수|수식|연산자|계산|sum|average|count|max|min|if|rank|today|now|round|abs/.test(text)) return "[2과목] 수식 활용 및 수학/통계 함수 정밀 분석";
      if (/vlookup|hlookup|match|index|choose|dsum|daverage|left|right|mid|value|text/.test(text)) return "[2과목] 찾기/참조 및 데이터베이스 함수 심화 분석";
      if (/부분합|피벗|시나리오|목표값|통합|데이터 표|윤곽/.test(text)) return "[2과목] 데이터 분석 모델링 및 분석 도구 활용";
      if (/차트|그래프|구성 요소|추세선|범례|데이터 레이블/.test(text)) return "[2과목] 데이터 시각화 및 차트 구성 요소 분석";
      if (/페이지 설정|인쇄|머리글|바닥글|매크로|vba|모듈|프로시저|사용자 정의 폼/.test(text)) return "[2과목] 매크로 자동화 및 인쇄 출력 프로세스 관리";
      return "[2과목] 스프레드시트 일반 기타 심화 분석";
    }
  }

  if (subject === '승강기기능사') {
    if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|전동기|발전기|bridge|브리지|오옴|옴|플레밍/.test(text)) return "01. 전기이론";
    if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "02. 기계일반";
    if (/안전관리|일상점검|정기검사|유지관리|비상벨|안전장치|보수|점검/.test(text)) return "03. 승강기 점검 및 보수";
    return "04. 승강기 개론";
  }

  return q.sub_unit || q.subject || "미분류";
}

async function generateSlideSet(subject, unit, setNum, questions) {
  const cleanUnit = unit.replace(/\s*\(\d+부\)$/, '').trim();
  const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
  const targetDir = path.resolve(process.cwd(), 'public', 'summaries', subject);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, `${safeUnitName}_${setNum}세트.json`);

  const subjectPrompt = subject.includes('전기') || subject.includes('승강기') ? `
    [기술 자격증 특화 규칙]
    1. **설명 수준**: 복잡한 공식보다는 원리를 일상적인 현상에 비유하여 아주 쉽게 설명하세요.
    2. **톤앤매너**: 친절하고 명확하게 설명하되, 특정 연령대(초등/중등)를 지칭하는 표현은 절대 쓰지 마세요.
    3. **구조**: 비유를 통한 도입 -> 구조 분석 -> 핵심 요약 순으로 진행하세요.
  ` : subject.includes('컴퓨터활용능력') ? `
    [컴활 2급 요약 규칙: 슬라이드 최적화]
    1. **문장 제한**: 'content' 필드는 반드시 **4문장 이내**, **250자 이내**로 작성하세요.
    2. **비유 활용**: 어려운 용어는 일상적인 비유(예: CPU = 두뇌, RAM = 책상)를 사용해 한 문장으로 정의하세요.
    3. **톤앤매너**: 누구나 쉽게 이해할 수 있는 친숙한 언어를 사용하되, 대상 연령을 직접 언급하지 마세요.
  ` : `
    [정보처리기능사 요약 규칙]
    1. **문장 제한**: 'content' 필드는 반드시 **4문장 이내**, **250자 이내**로 작성하세요.
    2. **비유 활용**: 어려운 IT 용어는 일상적인 비유(예: 데이터베이스 = 도서관, 프로토콜 = 대화 규칙)를 사용해 친절하게 한 문장으로 정의하세요.
    3. **톤앤매너**: 친절하고 명확하게 설명하되, 특정 연령대(초등/중등)를 지칭하는 표현은 절대 쓰지 마세요.
  `;

  const prompt = `
    당신은 국내 최고의 IT/기술 자격증 교육 전문가입니다. 
    제공된 문제를 바탕으로 '${subject}' 과목의 '${unit}' 단원 '${setNum}세트'를 위한 학습 슬라이드(최대 30장)를 생성하세요.
    유사한 개념의 문제는 한 장의 슬라이드로 통합하여 효율을 높이세요.

    ${subjectPrompt}

    [반드시 준수해야 할 응답 구조]
    1. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${safeUnitName}_${setNum}_slide_{id}.png" 형식으로 지정하세요.
    2. **이미지 생성 프롬프트(visual)**: 이미지 내부에 한글이 들어갈 경우 글자가 깨지지 않도록 'Korean text in high quality font' 등의 지시어를 포함하고, 복잡한 텍스트보다는 직관적인 도식과 아이콘 묘사 위주로 작성하세요.
    3. **이모지(emoji)**: 각 슬라이드 주제에 어울리는 거대하고 화려한 이모지를 하나씩 지정하세요.
    4. **콘텐츠 구성**: 'content' 필드는 친절한 설명(4문장/250자 이내), 'exam_point' 필드는 시험에 나오는 수치나 키워드 위주로 작성하세요.
    5. **🎨 SVG 벡터 그래픽 적극 활용**: 
       - 회로도, 흐름도, 데이터 구조(스택, 큐 등), 그래프, 표 등 시각적 도식이 필수적인 개념을 설명할 때는 반드시 깔끔한 반응형 SVG 코드 (\`<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">...</svg>\`)를 \`svg\` 필드에 포함하세요.
       - 부드럽고 가독성 좋은 라이트 테마 배경을 채택하고 (예: \`<rect width="400" height="250" rx="20" fill="#f8fafc"/>\` 또는 세련된 그라디언트 적용), 도형(rect, circle, line, path, polygon) 및 가독성 좋은 텍스트(\`<text>\`)를 정확한 좌표로 배치하세요.
       - 단순 텍스트 설명이라 도식이 전혀 필요 없는 경우에는 \`svg\` 필드를 빈 문자열(\`""\`)로 설정하세요.
    6. **형식**: 반드시 유효한 JSON 형식으로만 응답하세요.

    [입력 데이터 (기출문제)]
    ${JSON.stringify(questions.map(q => ({ q: q.question, e: q.explanation })))}

    [응답 형식 JSON]
    {
      "subject": "${subject}",
      "unit": "${unit}",
      "set": ${setNum},
      "slides": [
        {
          "id": 1,
          "style": "Expert",
          "image": "/summaries/${subject}/${safeUnitName}_${setNum}_slide_1.png",
          "emoji": "🚀",
          "title": "슬라이드 제목",
          "content": "친절한 설명 (4문장/250자 이내)",
          "visual": "이미지 생성용 상세 묘사",
          "exam_point": "시험 출제 포인트",
          "svg": "400x250 비율 of SVG code or empty string (\\\"\\\")"
        }
      ]
    }
  `;

  let retries = 3;
  while (retries > 0) {
    let timer;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('API Response Timeout (75s)')), 75000);
      });
      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);
      clearTimeout(timer);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');
      const generatedData = JSON.parse(jsonMatch[0]);
      fs.writeFileSync(targetPath, JSON.stringify(generatedData, null, 2), 'utf-8');
      console.log(`  [SUCCESS] Retry Generated & Cached: ${path.relative(process.cwd(), targetPath)}`);
      return true;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`  [RETRY FAILED] ${unit} Set ${setNum}: ${err.message}. Retrying...`);
      await sleep(15000);
      retries--;
    }
  }
  console.error(`  [FINAL FAILED] Could not generate slides for ${unit} Set ${setNum}`);
  return false;
}

async function main() {
  const subjects = [
    { name: '컴퓨터활용능력 2급', db: 'Literacy2_MASTER_DB.json' },
    { name: '승강기기능사', db: 'MASTER_DB.json' },
    { name: '정보처리기능사', db: 'MASTER_DB.json' }
  ];

  let missingCount = 0;
  let fixedCount = 0;

  for (const sub of subjects) {
    const dbPath = path.resolve(process.cwd(), 'src', 'data', sub.name, sub.db);
    if (!fs.existsSync(dbPath)) continue;

    const content = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const allQuestions = Array.isArray(content) ? content : (content.questions || []);

    const grouped = {};
    allQuestions.forEach(q => {
      const unit = classify(sub.name, q);
      if (!grouped[unit]) grouped[unit] = [];
      grouped[unit].push(q);
    });

    for (const [unitName, questions] of Object.entries(grouped)) {
      const pageSize = 30;
      const totalSets = Math.ceil(questions.length / pageSize);

      for (let set = 1; set <= totalSets; set++) {
        const cleanUnit = unitName.replace(/\s*\(\d+부\)$/, '').trim();
        const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
        const targetPath = path.resolve(process.cwd(), 'public', 'summaries', sub.name, `${safeUnitName}_${set}세트.json`);
        
        if (!fs.existsSync(targetPath)) {
          missingCount++;
          console.log(`🔍 Found Missing Set: ${sub.name} - ${unitName} Set ${set}`);
          const start = (set - 1) * pageSize;
          const chunk = questions.slice(start, start + pageSize);
          
          const success = await generateSlideSet(sub.name, unitName, set, chunk);
          if (success) {
            fixedCount++;
          }
          await sleep(15000); // 15s gap to respect API rate limits
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`🧹 Retry Scan Completed!`);
  console.log(`   Total Missing Sets Detected: ${missingCount}`);
  console.log(`   Successfully Fixed: ${fixedCount}`);
}

main().catch(console.error);
