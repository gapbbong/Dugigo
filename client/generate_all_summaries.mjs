import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEYS = [
  'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s',
  'AIzaSyC3PpvfbdMxb3ajXvtP-4m3uLHa-qcDsU0',
  'AIzaSyDmvjV4-D0WaWxOurP5TuUTjhc_c5ODHwk',
  'AIzaSyAZIaqtGyf4lIM6A60yJevVW4l-T5gTM_4',
  'AIzaSyBsWpRqpQA61MW0mFEWLEuvcTk15LNfxfg'
];

const subject = '컴퓨터활용능력 2급';
const dbPath = 'e:/DugiGo/client/src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json';
const outputDirBase = 'e:/DugiGo/client/src/summaries/컴퓨터활용능력 2급';

if (!fs.existsSync(outputDirBase)) fs.mkdirSync(outputDirBase, { recursive: true });

const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const allQuestions = Array.isArray(dbContent) ? dbContent : (dbContent.questions || []);

const classify = (q) => {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
  const isSubject1 = q.subject === "컴퓨터 일반";
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
};

const tasks = [];
const unitMap = {};

allQuestions.forEach(q => {
  const unit = classify(q);
  if (!unitMap[unit]) unitMap[unit] = [];
  unitMap[unit].push(q);
});

Object.keys(unitMap).forEach(unit => {
  const qs = unitMap[unit];
  const size = 30;
  const setTotal = Math.ceil(qs.length / size);
  for (let s = 1; s <= setTotal; s++) {
    tasks.push({ unit, set: s, questions: qs.slice((s-1)*size, s*size) });
  }
});

console.log(`Total tasks to process: ${tasks.length}`);

async function processTask(task, keyIndex) {
  const genAI = new GoogleGenerativeAI(API_KEYS[keyIndex]);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const safeUnitName = task.unit.replace(/[^a-z0-9가-힣]/gi, '_');
  const summaryFileName = `${safeUnitName}_${task.set}세트.json`;
  const summaryPath = path.join(outputDirBase, summaryFileName);

  // 이미 파일이 있고 내용이 유효하면 건너뛰기 (선택 사항 - 여기서는 재생성을 위해 주석 처리)
  // if (fs.existsSync(summaryPath)) return;

  const prompt = `
      당신은 국내 최고의 IT 자격증 교육 전문가입니다. 
      제공된 문제를 바탕으로 '컴퓨터활용능력 2급' 과목의 '${task.unit}' 단원 '${task.set}세트'를 위한 학습 슬라이드 10장 내외를 생성하세요.

      [컴활 2급 요약 규칙: 슬라이드 최적화]
      1. **문장 최소화**: "안녕하세요", "환영합니다" 같은 인사말은 절대 사용하지 마세요. 
      2. **분량 제한**: 'content' 필드는 반드시 **3문장(150자) 이내**로 작성하세요.
      3. **핵심 위주**: [입문], [심화] 같은 머리말을 쓰지 말고, 바로 핵심 비유나 핵심 기능을 설명하세요.
      4. **비유 활용**: 어려운 용어는 일상적인 비유(예: CPU = 두뇌, RAM = 책상)를 사용해 한 문장으로 정의하세요.

      [반드시 준수해야 할 응답 구조]
      1. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${safeUnitName}_${task.set}_slide_{id}.png" 형식으로 지정하세요.
      2. **이모지(emoji)**: 각 슬라이드 주제에 어울리는 거대하고 화려한 이모지를 하나씩 지정하세요 (이미지 로딩 실패 시 사용됨).
      3. **콘텐츠 구성**: 'content' 필드는 설명글 위주로, 'exam_point' 필드는 시험에 나오는 수치나 키워드 위주로 작성하세요.
      4. **형식**: 반드시 유효한 JSON 형식으로만 응답하세요.

      [입력 데이터 (기출문제)]
      ${JSON.stringify(task.questions)}

      [응답 형식 JSON]
      {
        "subject": "${subject}",
        "unit": "${task.unit}",
        "set": ${task.set},
        "slides": [
          {
            "id": 1,
            "style": "Expert",
            "image": "/summaries/${subject}/${safeUnitName}_${task.set}_slide_1.png",
            "emoji": "🚀",
            "title": "슬라이드 제목",
            "content": "핵심 개념 설명 (3문장 이내)",
            "visual": "이미지 생성용 상세 묘사",
            "exam_point": "시험 출제 포인트 및 오답 노트"
          }
        ]
      }
  `;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const generatedData = JSON.parse(jsonMatch[0]);
      fs.writeFileSync(summaryPath, JSON.stringify(generatedData, null, 2));
      console.log(`[SUCCESS] ${task.unit} - Set ${task.set}`);
      return; // 성공 시 루프 탈출
    } catch (err) {
      if (err.message.includes('429') || err.message.includes('Quota')) {
        console.warn(`[RATE LIMIT] ${task.unit} - Set ${task.set}: Waiting 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        retries--;
      } else {
        console.error(`[ERROR] ${task.unit} - Set ${task.set}:`, err.message);
        return;
      }
    }
  }
}

async function runParallel() {
  let taskIndex = 0;
  const running = [];

  for (let i = 0; i < API_KEYS.length; i++) {
    if (taskIndex < tasks.length) {
      running.push(startNext(i));
    }
  }

  async function startNext(keyIndex) {
    while (taskIndex < tasks.length) {
      const currentTask = tasks[taskIndex++];
      await processTask(currentTask, keyIndex);
      // 각 작업 사이에 20초 여유를 두어 429 방지
      await new Promise(r => setTimeout(r, 20000));
    }
  }

  await Promise.all(running);
  console.log("All tasks completed!");
}

runParallel();
