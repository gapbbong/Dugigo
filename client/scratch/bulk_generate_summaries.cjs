const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 사장님이 제공해주신 10개의 정예 API 키
const API_KEYS = [
  'AIzaSyCqM6VXgXszoN_ICLmATOJ3KZHSSCkS49s',
  'AIzaSyCcPcc5jPYNNJrgTeZ6gAgr0_tfkTP_hfA',
  'AIzaSyCYORHvQP0OKdyBN2femGhUF_U634d1rDw',
  'AIzaSyDql8tW5hAIKVjxZEPF6dZ3cJydu7q9uuU',
  'AIzaSyBFKk8tiIMu5fu4mCmGg0dHo0IE-OEMh5g',
  'AIzaSyDQKO3BM_8P9MIILGPEpMgL5mtHAngJLu4',
  'AIzaSyAMeQoWonLHNNetmgbv-N4vz2dqyA1JTrA',
  'AIzaSyB_EXOVSxRqqFX7hXJagmY3TCrX9EthVmk',
  'AIzaSyD9nZQf9BUuSo1bvX0DZbUPgeqjvCswL-o',
  'AIzaSyA9QKrkNztFZaAka3sdlsbCo2FjTDGUh3I'
];

const SUBJECT = '컴퓨터활용능력 2급';
const SET_SIZE = 30;
const CONCURRENCY = 3; // 안정성을 위해 동시 작업 수를 3으로 조정
const MODEL_NAME = 'gemini-flash-latest';

// 살아있는 키만 골라내기 위한 테스트 함수
async function validateKeys() {
  console.log('🔍 API 키 생존 테스트 시작...');
  const validKeys = [];
  for (const key of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      await model.generateContent('hi');
      validKeys.push(key);
      console.log(`✅ [VALID] ${key.substring(0, 8)}... 사용 가능`);
    } catch (err) {
      console.log(`❌ [INVALID] ${key.substring(0, 8)}... 만료 또는 오류: ${err.message}`);
    }
  }
  return validKeys;
}

// 데이터 경로 설정
const DB_PATH = path.join(__dirname, '..', 'src', 'data', SUBJECT, 'Literacy2_MASTER_DB.json');
const SUMMARY_BASE_DIR = path.join(__dirname, '..', 'src', 'summaries', SUBJECT);

// 분류 로직 (API와 동일)
function classify(q) {
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
}

async function generateSummary(apiKey, unit, setNum, questions, attempts = 3) {
  const safeUnitName = unit.replace(/[^a-z0-9가-힣]/gi, '_');
  const fileName = `${safeUnitName}_${setNum}세트.json`;
  const filePath = path.join(SUMMARY_BASE_DIR, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`[PASS] ${unit} 세트 ${setNum} 이미 존재함`);
    return;
  }

  // 시도할 모델 후보들 (안정성 최우선)
  const modelsToTry = [MODEL_NAME, 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];

  for (let i = 1; i <= attempts; i++) {
    const currentModel = modelsToTry[i-1] || modelsToTry[0];
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: currentModel });

      const prompt = `
        당신은 국내 최고의 IT 자격증 교육 전문가입니다. 
        제공된 문제를 바탕으로 '컴퓨터활용능력 2급' 과목의 '${unit}' 단원 '${setNum}세트'를 위한 전문가급 학습 슬라이드 10장 내외를 생성하세요.
        (규칙: 중학생도 이해하는 쉬운 비유 + 전문가의 심화 분석 + 문제풀이 핵심 팁)
        [반드시 준수해야 할 응답 구조]
        1. 이미지 경로: '/summaries/${SUBJECT}/${safeUnitName}_${setNum}_slide_{id}.png'
        2. 형식: 반드시 순수한 JSON 형식으로만 응답하세요. (마크다운 포맷 제외)
        ${JSON.stringify(questions)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // 정밀 JSON 추출 로직 (매칭되는 중괄호 쌍 찾기)
      let jsonStr = '';
      const firstBrace = text.indexOf('{');
      if (firstBrace !== -1) {
        let braceCount = 0;
        let started = false;
        for (let j = firstBrace; j < text.length; j++) {
          if (text[j] === '{') {
            braceCount++;
            started = true;
          } else if (text[j] === '}') {
            braceCount--;
          }
          if (started && braceCount === 0) {
            jsonStr = text.substring(firstBrace, j + 1);
            break;
          }
        }
      }

      if (!jsonStr) throw new Error('Valid JSON object not found in response');
      
      const data = JSON.parse(jsonStr);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ [DONE] ${unit} 세트 ${setNum} (엔진: ${currentModel})`);
      return;
    } catch (err) {
      console.log(`⚠️ [시도 ${i}/${attempts}] ${unit} 세트 ${setNum} 실패 (${currentModel}): ${err.message}`);
      if (i < attempts) await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  console.error(`❌ [최종 실패] ${unit} 세트 ${setNum}`);
}

async function run() {
  console.log('🚀 컴활 2급 마스터 슬라이드 대량 생성 시작...');
  
  const validKeys = await validateKeys();
  if (validKeys.length === 0) {
    console.error('❌ 사용할 수 있는 API 키가 하나도 없습니다. 키를 확인해 주세요.');
    return;
  }
  console.log(`💡 총 ${validKeys.length}개의 살아있는 키로 작업을 시작합니다.`);

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const questions = Array.isArray(db) ? db : (db.questions || []);

  // 단원별로 문제 묶기
  const unitGroups = {};
  questions.forEach(q => {
    const u = classify(q);
    if (!unitGroups[u]) unitGroups[u] = [];
    unitGroups[u].push(q);
  });

  const tasks = [];
  Object.keys(unitGroups).forEach(unitName => {
    const qList = unitGroups[unitName];
    // 중복 제거 (질문 내용 기준)
    const uniqueList = Array.from(new Map(qList.map(q => [q.question, q])).values());
    const totalSets = Math.ceil(uniqueList.length / SET_SIZE);
    
    for (let s = 1; s <= totalSets; s++) {
      const setQuestions = uniqueList.slice((s - 1) * SET_SIZE, s * SET_SIZE);
      tasks.push({ unitName, setNum: s, questions: setQuestions });
    }
  });

  console.log(`📊 총 ${tasks.length}개의 세트를 생성해야 합니다.`);

  // 동시 작업 처리 (Worker Pool)
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const chunk = tasks.slice(i, i + CONCURRENCY);
    console.log(`🔄 진행 중: ${i + 1} ~ ${Math.min(i + CONCURRENCY, tasks.length)} / ${tasks.length}`);
    
    await Promise.all(chunk.map((task, idx) => {
      const apiKey = validKeys[idx % validKeys.length];
      return generateSummary(apiKey, task.unitName, task.setNum, task.questions);
    }));
    
    // API 레이트 리밋 방지를 위해 잠시 휴식 (Free Tier 15 RPM 고려)
    if (i + CONCURRENCY < tasks.length) {
      console.log('☕ 잠시 숨 고르기 중 (2초)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('🏁 모든 슬라이드 생성 작업이 종료되었습니다!');
}

run();
