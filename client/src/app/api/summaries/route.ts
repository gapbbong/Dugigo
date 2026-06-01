import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const API_KEYS = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);

function getApiKey() {
  if (API_KEYS.length === 0) return '';
  const index = Math.floor(Math.random() * API_KEYS.length);
  return API_KEYS[index];
}

export async function GET(req: NextRequest) {
  const sanitize = (str: string | null) => {
    if (!str) return "";
    return str.replace(/[<>:"|?*]/g, "").replace(/\.\./g, "");
  };

  const { searchParams } = new URL(req.url);
  const subject = sanitize(searchParams.get('subject'));
  const unit = sanitize(searchParams.get('unit'));
  const set = sanitize(searchParams.get('set'));

  if (!subject || !unit || !set) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
  }

  const cleanUnit = unit.replace(/\s*\(\d+부\)$/, '').trim();
  const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
  const summaryFileName = `${safeUnitName}_${set}세트.json`;
  const fallbackFileName = `${cleanUnit.replace(/^\d+\.\s*/, '').replace(/[^a-z0-9가-힣]/gi, '_')}_${set}세트.json`;

  let baseDir = process.cwd();
  // 만약 process.cwd()가 client 상위 폴더이고, client 폴더가 존재한다면 client 폴더 안을 base로 잡음
  if (!fs.existsSync(path.join(baseDir, 'public', 'summaries')) && fs.existsSync(path.join(baseDir, 'client', 'public', 'summaries'))) {
    baseDir = path.join(baseDir, 'client');
  }

  const summariesBase = path.join(baseDir, 'public', 'summaries');
  const srcSummariesBase = path.join(baseDir, 'src', 'summaries');
  
  const publicPath = path.join(summariesBase, subject, summaryFileName);
  const fallbackPublicPath = path.join(summariesBase, subject, fallbackFileName);
  const srcPath = path.join(srcSummariesBase, subject, summaryFileName);
  const fallbackSrcPath = path.join(srcSummariesBase, subject, fallbackFileName);
  
  // Verify path is within allowed base directories
  if (!publicPath.startsWith(summariesBase) && !srcPath.startsWith(srcSummariesBase)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const summaryPath = fs.existsSync(publicPath) ? publicPath : 
                    (fs.existsSync(fallbackPublicPath) ? fallbackPublicPath : 
                    (fs.existsSync(srcPath) ? srcPath : fallbackSrcPath));

  if (fs.existsSync(summaryPath)) {
    try {
      const fileContent = fs.readFileSync(summaryPath, 'utf-8');
      return NextResponse.json(JSON.parse(fileContent));
    } catch (e) {
      console.error('File read error, regenerating...', e);
    }
  }

  try {
    const targetDir = path.dirname(summaryPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const dataBase = path.join(baseDir, 'src', 'data');
    const dataDir = path.join(dataBase, subject);
    
    if (!dataDir.startsWith(dataBase)) throw new Error('Invalid data access');

    let dbPath = path.join(dataDir, 'MASTER_DB.json');
    if (!fs.existsSync(dbPath)) dbPath = path.join(dataDir, 'Literacy2_MASTER_DB.json');
    if (!fs.existsSync(dbPath)) dbPath = path.join(dataDir, 'history_master.json');

    const size = parseInt(searchParams.get('size') || '30');
    let contextQuestions = "";

    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      let allQuestions = Array.isArray(dbContent) ? dbContent : (dbContent.questions || []);
      
      const classify = (q: any) => {
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
          if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|전동기|발전기|브리지|오옴|플레밍/.test(text)) return "01. 전기이론";
          if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "02. 기계일반";
          if (/안전관리|일상점검|정기검사|유지관리|비상벨|안전장치|보수|점검/.test(text)) return "03. 승강기 점검 및 보수";
          return "04. 승강기 개론";
        }
        if (subject === '전기공사산업기사' || subject === '전기기능사') {
          if (/조명|광도|럭스|루멘|전열|조도|광속|칸델라|글로브|휘도|램프|반사율|투과율/.test(text)) return "01. 조명 및 전열";
          if (/전지|배터리|축전지|전기화학|패러데이|전해|금속막대|도금|이온/.test(text)) return "02. 전기화학 및 배터리";
          if (/펌프|권상|엘리베이터|에스컬레이터|기중기|용접|가열|건조|공작기계/.test(text)) return "03. 전동기 응용";
          if (/철도|궤도|전차|급전|가선|조가선|커티너리|브래킷|집전|판타그래프/.test(text)) return "04. 철도설계 및 궤도";
          if (/송전|선로정수|인덕턴스|정전용량|복도체|다도체|충전전류|코로나|복소전력/.test(text)) return "05. 송전특성 및 선로정수";
          if (/지락|단락|고장계산|직접접지|소호리액터|저항접지|대칭좌표|영상임피던스/.test(text)) return "06. 전로의 고장계산 및 중성점 접지";
          if (/피뢰기|차단기|계전기|이상전압|섬락|아킹혼|서지|절연협조|변류기|단로기/.test(text)) return "07. 이상전압 및 보호계측";
          if (/배전|변전|수력|화력|원자력|댐|터빈|조정지|펠턴|카플란/.test(text)) return "08. 배전 계통 및 발전";
          if (/직류기|정류자|브러시|전기자|직권|분권|균압|전기자반작용/.test(text)) return "09. 직류기";
          if (/동기기|동기발전기|동기전동기|동기임피던스|동기화|병렬운전/.test(text)) return "10. 동기기";
          if (/변압기|권수비|변압기결선|무부하손|부하손|절연유/.test(text)) return "11. 변압기";
          if (/유도기|유도전동기|슬립|회전자기장|정류기|사이리스터|SCR|인버터|컨버터/.test(text)) return "12. 유도기 및 정류기";
          if (/옴의법칙|키르히호프|실효값|평균값|순시값|임피던스|리액턴스|주파수/.test(text)) return "13. 직류회로 및 교류회로 기초";
          if (/3상|델타|와이|Y-Δ|대칭좌표|영상전류|정상전류|역상전류/.test(text)) return "14. 다상교류 및 대칭좌표법";
          if (/테브난|노턴|중첩의|과도현상|특성임피던스|시정수/.test(text)) return "15. 회로망 정리 및 과도현상";
          if (/전달함수|블록선도|라플라스|제어공학|안정도|주파수응답/.test(text)) return "16. 전달함수 및 라플라스 변환";
          if (/KEC|전기설비기술기준|접지시스템|등전위|피뢰시스템/.test(text)) return "17. 공통사항 및 접지(KEC)";
          if (/저압전기설비|고압전기설비|보안거리|가공전선|옥내배선|이격거리/.test(text)) return "18. 저압/고압/특고압 전기설비(KEC)";
          if (/전기철도|분산형|신재생|전기저장장치|태양광/.test(text)) return "19. 전기철도 및 분산형 전원(KEC)";
        }
        if (subject === '전기기사') {
          if (/자기|자계|전계|유전체/.test(text)) return "01. 전기자기학";
          if (/송전|배전|발전|변전/.test(text)) return "02. 전력공학";
          if (/변압기|유도기|직류기|동기기/.test(text)) return "03. 전기기기";
          if (/회로|라플라스|전달함수/.test(text)) return "04. 회로이론 및 제어공학";
          if (/KEC|설비|기술기준/.test(text)) return "05. 전기설비기술기준";
          if (q.subject) {
            if (q.subject.includes("자기")) return "01. 전기자기학";
            if (q.subject.includes("전력")) return "02. 전력공학";
            if (q.subject.includes("기기")) return "03. 전기기기";
            if (q.subject.includes("회로")) return "04. 회로이론 및 제어공학";
            if (q.subject.includes("설비")) return "05. 전기설비기술기준";
          }
          return "01. 전기자기학";
        }
        return q.sub_unit || q.subject || "";
      };

      let filteredByUnit: any[] = [];
      if (cleanUnit.includes("자주 나왔던 문항")) {
        const freqCountMap = new Map<string, number>();
        const normalizeText = (t: string) => (t || '').replace(/\s+/g, '').replace(/[^\w가-힣]/g, '').toLowerCase();
        
        allQuestions.forEach((q: any) => {
          const norm = normalizeText(q.question);
          if (norm) {
            freqCountMap.set(norm, (freqCountMap.get(norm) || 0) + 1);
          }
        });

        const uniqueFreqMap = new Map<string, any>();
        allQuestions.forEach((q: any) => {
          const norm = normalizeText(q.question);
          const freq = Math.max(Number(q.frequency) || 0, freqCountMap.get(norm) || 1);
          if (freq >= 2) {
            const cleanChoices = (q.choices || []).map((c: string) => normalizeText(c)).join("|");
            const contentKey = `${norm}_${cleanChoices}`;
            if (!uniqueFreqMap.has(contentKey)) {
              uniqueFreqMap.set(contentKey, { ...q, frequency: freq });
            }
          }
        });

        const sortedFreq = Array.from(uniqueFreqMap.values())
          .sort((a, b) => (b.frequency || 0) - (a.frequency || 0));

        const match = cleanUnit.match(/공략\s*(\d+)/);
        const partIdx = match ? parseInt(match[1]) - 1 : 0;
        
        const startIdx = partIdx * 30;
        const endIdx = startIdx + 30;
        filteredByUnit = sortedFreq.slice(startIdx, endIdx);
      } else {
        filteredByUnit = allQuestions.filter((q: any) => classify(q) === cleanUnit || !unit);
      }

      const setQuestions = cleanUnit.includes("자주 나왔던 문항") 
        ? filteredByUnit 
        : filteredByUnit.slice((parseInt(set) - 1) * size, parseInt(set) * size);
        
      const uniqueQuestions = Array.from(new Map(setQuestions.map((q: any) => [q.question, q])).values())
        .map((q: any) => ({
          number: q.number,
          question: q.question,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation
        }));
      contextQuestions = JSON.stringify(uniqueQuestions);
    }

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
    ` : subject.includes('정보처리') ? `
      [정보처리기능사 요약 규칙]
      1. **문장 제한**: 'content' 필드는 반드시 **4문장 이내**, **250자 이내**로 작성하세요.
      2. **비유 활용**: 어려운 IT 용어는 일상적인 비유(예: 데이터베이스 = 도서관, 프로토콜 = 대화 규칙)를 사용해 친절하게 한 문장으로 정의하세요.
      3. **톤앤매너**: 친절하고 명확하게 설명하되, 특정 연령대(초등/중등)를 지칭하는 표현은 절대 쓰지 마세요.
    ` : '';

    const prompt = `
      당신은 국내 최고의 IT 자격증 교육 전문가입니다. 
      제공된 문제를 바탕으로 '${subject}' 과목의 '${unit}' 단원 '${set}세트'를 위한 학습 슬라이드(최대 30장)를 생성하세요.
      유사한 개념의 문제는 한 장의 슬라이드로 통합하여 효율을 높이세요.

      ${subjectPrompt}

      [반드시 준수해야 할 응답 구조]
      1. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${safeUnitName}_${set}_slide_{id}.png" 형식으로 지정하세요.
      2. **이미지 생성 프롬프트(visual)**: 이미지 내부에 한글이 들어갈 경우 글자가 깨지지 않도록 'Korean text in high quality font' 등의 지시어를 포함하고, 복잡한 텍스트보다는 직관적인 도식과 아이콘 묘사 위주로 작성하세요.
      3. **이모지(emoji)**: 각 슬라이드 주제에 어울리는 거대하고 화려한 이모지를 하나씩 지정하세요.
      4. **콘텐츠 구성**: 'content' 필드는 친절한 설명(4문장/250자 이내), 'exam_point' 필드는 시험에 나오는 수치나 키워드 위주로 작성하세요.
      5. **🎨 SVG 벡터 그래픽 적극 활용**: 
         - 회로도, 흐름도, 데이터 구조(스택, 큐 등), 그래프, 표 등 시각적 도식이 필수적인 개념을 설명할 때는 반드시 깔끔한 반응형 SVG 코드 (\`<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">...</svg>\`)를 \`svg\` 필드에 포함하세요.
         - 부드럽고 가독성 좋은 라이트 테마 배경을 채택하고 (예: \`<rect width="400" height="250" rx="20" fill="#f8fafc"/>\` 또는 세련된 그라디언트 적용), 도형(rect, circle, line, path, polygon) 및 가독성 좋은 텍스트(\`<text>\`)를 정확한 좌표로 배치하세요.
         - 단순 텍스트 설명이라 도식이 전혀 필요 없는 경우에는 \`svg\` 필드를 빈 문자열(\`""\`)로 설정하세요.
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
            "svg": "400x250 비율의 SVG 코드 또는 빈 문자열 (\\\"\\\")"
          }
        ]
      }
    `;

    let result;
    let lastError;
    const maxAttempts = 3;
    let delay = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const apiKey = getApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        result = await model.generateContent(prompt);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation attempt ${attempt + 1} failed:`, err.message);
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to generate content after multiple attempts');
    }

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to extract JSON from AI response');
    
    const generatedData = JSON.parse(jsonMatch[0]);

    try {
      fs.writeFileSync(summaryPath, JSON.stringify(generatedData, null, 2));
    } catch (e) {
      console.warn('Failed to cache summary file:', e);
    }

    return NextResponse.json(generatedData);
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
