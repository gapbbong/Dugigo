import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 제공된 4개의 API 키 로테이션
const API_KEYS = [
  'AIzaSyAm-cbD26-Kw6D7jw_kRWwMbmSX5kdkCEA',
  'AIzaSyCJrEEApCqBKVNQkkljxg9MavVMzg7iSls',
  'AIzaSyC6eIBZxj-oCL4myZNpHmmINe0UWAoyVAc',
  'AIzaSyDm1ui58wpXnGWJWnxPmo3ZsMYMyRBqX9c'
];

function getApiKey() {
  const index = Math.floor(Math.random() * API_KEYS.length);
  return API_KEYS[index];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const unit = searchParams.get('unit');
  const set = searchParams.get('set');

  if (!subject || !unit || !set) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const summaryDir = path.join(process.cwd(), 'public', 'summaries', subject);
  const safeUnitName = unit.replace(/[^a-z0-9가-힣]/gi, '_');
  const summaryFileName = `${safeUnitName}_${set}세트.json`;
  const summaryPath = path.join(process.cwd(), 'src', 'summaries', subject, summaryFileName);

  // 1. 이미 파일이 있으면 반환
  if (fs.existsSync(summaryPath)) {
    try {
      const fileContent = fs.readFileSync(summaryPath, 'utf-8');
      return NextResponse.json(JSON.parse(fileContent));
    } catch (e) {
      console.error('File read error, regenerating...', e);
    }
  }

  // 2. 파일이 없으면 생성 로직 시작
  try {
    // 디렉토리 생성
    const targetDir = path.dirname(summaryPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // 관련 문제 데이터 가져오기 (컨텍스트용)
    const dataDir = path.join(process.cwd(), 'src', 'data', subject);
    let dbPath = path.join(dataDir, 'MASTER_DB.json');
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(dataDir, 'Literacy2_MASTER_DB.json');
    }
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(dataDir, 'history_master.json');
    }

    let contextQuestions = "";
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      let allQuestions = Array.isArray(dbContent) ? dbContent : (dbContent.questions || []);
      
      // 재분류 로직 (Iron Wall Classification과 동기화)
      const classify = (q: any) => {
        const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
        const isSubject1 = q.subject === "컴퓨터 일반" || (q.round_info && q.round_info.includes('컴'));
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
        return q.sub_unit || "";
      };

      // 해당 단원 문제 필터링
      const filtered = allQuestions
        .filter((q: any) => {
          const qUnit = classify(q);
          return qUnit === unit || !unit;
        })
        .slice((parseInt(set) - 1) * 10, parseInt(set) * 10);
      contextQuestions = JSON.stringify(filtered);
    }

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // 컴활 2급 전용 프롬프트 추가
    const subjectPrompt = subject.includes('전기') ? `
      [전기기능사 특화 규칙]
      1. **단원별 스타일 적용**:
         - '전기이론': 수식과 회로도가 중심인 'Formula' 스타일. SVG 코드로 간략한 회로도를 표현하세요.
         - '전기기기': 구조와 원리 중심의 'Structure' 스타일. 부품별 역할을 'Component Breakdown'으로 설명하세요.
         - '전기설비': 시공과 안전 중심의 'Process' 스타일. 체크리스트나 단계별 가이드를 제공하세요.
      2. **수식 표현**: 반드시 KaTeX 형식(예: $V=IR$)을 사용하고, 복잡한 식은 변수별로 색상이나 비유를 들어 해부하세요.
      3. **직관적 비유**: 전압은 수압, 전류는 물의 양처럼 전기가 눈에 보이듯 설명하세요.
    ` : subject.includes('컴퓨터활용능력') ? `
      [컴활 2급 특화 규칙]
      1. **시각적 가이드**: 엑셀의 메뉴 경로나 단축키는 'Step-by-Step'으로 명확히 설명하세요.
      2. **비유와 예시**: 함수 설명 시 실생활 예시(예: VLOOKUP은 도서관에서 책 찾기)를 들어 이해를 돕습니다.
      3. **핵심 암기**: 1과목은 '두문자 암기법'이나 '비교표'를, 2과목은 '함수 구조도'를 적극 활용하세요.
    ` : '';

    const prompt = `
      당신은 전기/기술 자격증 학습을 돕는 국내 최고의 교육 콘텐츠 제작자입니다.
      제공된 문제를 바탕으로 '${subject}' 과목의 '${unit}' 단원 '${set}세트'를 위한 핵심 요약 슬라이드 10장 내외를 생성하세요.

      ${subjectPrompt}

      [반드시 준수해야 할 규칙]
      1. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${safeUnitName}_${set}_slide_{id}.png" 형식으로 지정하세요.
      2. **SVG 지원**: 'svg_overlay' 필드에 학습 내용과 관련된 간단한 회로도나 다이어그램을 나타내는 SVG 코드를 포함할 수 있습니다.
      3. **구조**: 반드시 유효한 JSON 형식으로만 응답하세요.

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
            "style": "Formula | Structure | Process",
            "image": "/summaries/${subject}/${safeUnitName}_${set}_slide_1.png",
            "svg_overlay": "<svg>...</svg>",
            "title": "슬라이드 제목",
            "content": "비유를 섞은 친절한 설명",
            "visual": "이미지 생성용 상세 묘사 (실사 풍)",
            "exam_point": "시험 출제 포인트 및 풀이 팁",
            "components": [
               { "name": "변수/부품명", "desc": "설명/비유" }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSON 추출 최적화 (정규식 사용)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to extract JSON from AI response');
    
    const generatedData = JSON.parse(jsonMatch[0]);

    // 파일 저장
    fs.writeFileSync(summaryPath, JSON.stringify(generatedData, null, 2));

    return NextResponse.json(generatedData);
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
