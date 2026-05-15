import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sanitize = (str: string | null) => {
    if (!str) return "";
    return str.replace(/[<>:"|?*]/g, "").replace(/\.\./g, "");
  };

  const { searchParams } = new URL(req.url);
  const subject = sanitize(searchParams.get('subject'));

  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  }

  try {
    const baseDataDir = path.resolve(process.cwd(), 'src', 'data');
    
    // 1. 원본 이름으로 시도
    let targetSubject = subject;
    let dataDir = path.resolve(baseDataDir, targetSubject);

    // 2. 없으면 공백 제거 버전으로 시도
    if (!fs.existsSync(dataDir)) {
      targetSubject = subject.replace(/\s/g, '');
      dataDir = path.resolve(baseDataDir, targetSubject);
    }

    // 3. 그래도 없으면 전체 폴더를 돌며 공백 무시하고 매칭되는 것 찾기
    if (!fs.existsSync(dataDir)) {
      if (fs.existsSync(baseDataDir)) {
        const allFolders = fs.readdirSync(baseDataDir).filter(f => fs.statSync(path.join(baseDataDir, f)).isDirectory());
        const match = allFolders.find(f => f.replace(/\s/g, '').toLowerCase() === subject.replace(/\s/g, '').toLowerCase());
        if (match) {
          targetSubject = match;
          dataDir = path.resolve(baseDataDir, targetSubject);
        }
      }
    }

    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ units: [], exams: [] });
    }

    const sanitizedSubject = targetSubject.replace(/\s/g, '');

    const allFiles = fs.readdirSync(dataDir);
    const masterFile = allFiles.find(f => f.toLowerCase().includes('master') && f.endsWith('.json'));
    const hasMaster = !!masterFile;
    
    // 모든 JSON 파일 읽기 (단원 파일 우선순위 적용을 위해 정렬)
    const filesToLoad = allFiles
          .filter(f => f.endsWith('.json') && !f.includes('_CLEAN') && !f.includes('.bak'))
          .sort((a, b) => {
            const isAStandard = /^\d+\./.test(a);
            const isBStandard = /^\d+\./.test(b);
            if (isAStandard && !isBStandard) return -1;
            if (!isAStandard && isBStandard) return 1;
            return 0;
          });

    const unitMap = new Map<string, number>();
    const questionMap = new Map<string, any>(); // 중복 체크용 ID 맵
    const freqCountMap = new Map<string, number>(); // 텍스트 기반 빈도 측정용

    const normalize = (text: string) => {
      if (!text) return "";
      return text.toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "")
        .replace(/\s+/g, "")
        .trim();
    };

    const classifyQuestion = (sub: string, q: any): string => {
      const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
      const s = sub.replace(/\s/g, '');

      if (s === '정보처리기능사') {
        if (q.sub_unit) return q.sub_unit;
        if (/sql|릴레이션|테이블|데이터베이스|조인|정규화|뷰|인덱스|트랜잭션|ddl|dml|dcl|select|update|delete|insert|기본키|외래키/.test(text)) return "데이터베이스 활용";
        if (/테스트|블랙박스|화이트박스|오류|결함|디버깅|검사|통합|알파|베타|유지보수|스텁|드라이버|단위|인수/.test(text)) return "애플리케이션 테스트 관리";
        if (/운영체제|리눅스|유닉스|쉘|스케줄링|프로세스|네트워크|osi|tcp|ip|라우팅|보안|통신|윈도우|dos|디렉터리/.test(text)) return "운영체제 및 네트워크 기초";
        if (/c언어|자바|파이썬|변수|배열|포인터|연산자|반복문|함수|클래스|객체|상속|알고리즘|순서도|자료구조|스택|큐|트리/.test(text)) return "프로그래밍 언어 활용";
        return "소프트웨어 개발 기초";
      }

      if (s === '승강기기능사') {
        if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|전동기|발전기|브리지|오옴|플레밍/.test(text)) return "전기이론";
        if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "기계일반";
        if (/안전관리|일상점검|정기검사|유지관리|비상벨|안전장치|보수|점검/.test(text)) return "승강기 점검 및 보수";
        return "승강기 개론";
      }

      if (s === '전기기능사') {
        if (/전선|배선|배관|접지|전선로|조명|절연|공사|금속관|가요|케이블/.test(text)) return "[설비] 전기설비";
        if (/직류기|동기기|변압기|유도기|정류기|전동기|발전기|회전자|슬립|계자/.test(text)) return "[기기] 전기기기";
        return "[이론] 전기이론";
      }

      if (s === '컴퓨터활용능력2급') {
        const isSubject1 = q.subject && q.subject.includes("컴퓨터 일반");
        
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

      if (s === '한국사검정시험' || s === '한국사능력검정시험') {
        if (q.sub_unit) return q.sub_unit;
        if (/구석기|신석기|청동기|철기|고조선|부여|고구려|옥저|동예|삼한|빗살무늬|고인돌|주먹도끼/.test(text) && !/백제|신라|고려|조선/.test(text)) return "선사시대 및 국가의 형성";
        if (/백제|신라|통일신라|발해|가야|어라하|건흥|해동성국|골품|화랑|삼국/.test(text)) return "고대 사회 (삼국~남북국)";
        if (/고려|광종|성종|공민왕|묘청|무신|몽골|거란|여진|전시과/.test(text)) return "중세 사회 (고려 시대)";
        if (/조선|세종|정조|영조|임진왜란|병자호란|사화|붕당|대동법/.test(text)) return "근세~근대 태동기 (조선 시대)";
        if (/강화도|개항|위정척사|동학|갑오개혁|독립협회|대한제국|아관파천/.test(text)) return "근대 사회의 전개 (개항기)";
        if (/일제|독립|3·1|임시 정부|민족 말살|물산 장려|신간회|광복/.test(text)) return "일제 강점기";
        if (/정부 수립|6·25|4·19|5·18|6월 민주 항쟁|민주화|통일/.test(text)) return "현대 사회의 발전";
        return "기타 및 통합";
      }

      if (s === '시각디자인산업기사') {
        if (q.subject) return q.subject;
        if (/색채|색상|명도|채도|먼셀|오스트발트|배색|조화|대비|색명|현색계|계시/.test(text)) return "색채학";
        if (/인쇄|사진|필름|현상|제판|제책|잉크|카메라|노출|광선|렌즈|망점|오프셋|감광|잠상/.test(text)) return "인쇄 및 사진기법";
        if (/디자인|기호|광고|마케팅|바우하우스|조형|공간|매니지먼트|아이덴티티|퍼스|게슈탈트/.test(text)) return "시각디자인론";
        return "시각디자인 일반";
      }

      if (s === '전기기사') {
        if (/자기|자계|전계|유전체/.test(text)) return "01. 전기자기학";
        if (/송전|배전|발전|변전/.test(text)) return "02. 전력공학";
        if (/변압기|유도기|직류기|동기기/.test(text)) return "03. 전기기기";
        if (/회로|라플라스|전달함수/.test(text)) return "04. 회로이론 및 제어공학";
        if (/KEC|설비|기술기준/.test(text)) return "05. 전기설비기술기준";
        if (q.subject) return q.subject;
        return "기타";
      }

      if (s === '전기공사산업기사') {
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
        
        // 최후의 수단: q.subject가 있다면 그것을 반환 (이미 분류된 파일에서 읽을 때 유리)
        if (q.subject) {
            if (q.subject.includes("응용")) return "01. 조명 및 전열";
            if (q.subject.includes("전력")) return "05. 송전특성 및 선로정수";
            if (q.subject.includes("기기")) return "09. 직류기";
            if (q.subject.includes("회로")) return "13. 직류회로 및 교류회로 기초";
            if (q.subject.includes("설비")) return "17. 공통사항 및 접지(KEC)";
        }
        return "기본 단원";
      }

      return "기본 단원";
    };

    const examsMap = new Map<string, number>();

    filesToLoad.forEach(file => {
      try {
        const fileContent = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const data = JSON.parse(fileContent);
        const questions = Array.isArray(data) ? data : (data.questions || []);
        
        const fileNameUnit = file.replace(/\.json$/, '').trim();
        const isStandardUnitFile = /^\d+\./.test(fileNameUnit);

        questions.forEach((q: any) => {
          const text = (q.question || '').trim();
          const isPlaceholder = text === '' || 
                               text.includes('이미지에 지문이 없습니다') || 
                               text.includes('이미지에 문제 본문 없음') ||
                               text.includes('내용을 확인할 수 없습니다');
          const hasImage = !!(q.question_img || q.image);
          if (isPlaceholder && !hasImage) return;

          // 빈도 측정을 위한 텍스트 정규화 키 (중복 체크 전에 수행하여 전체 파일 내 빈도 집계)
          const normText = normalize(q.question || "");
          freqCountMap.set(normText, (freqCountMap.get(normText) || 0) + 1);

          // 고유 ID 생성 로직 통일
          const qId = q.id || `${q.year || ''}_${q.round || ''}_${q.number}`;
          
          if (questionMap.has(qId)) {
            // 이미 등록된 문제면 빈도 정보만 업데이트
            const existingQ = questionMap.get(qId);
            if (q.frequency) {
              existingQ.frequency = Math.max(Number(existingQ.frequency) || 0, Number(q.frequency));
            }
            return;
          }

          const mainUnit = q.subject || "";
          const baseSubUnit = isStandardUnitFile ? fileNameUnit : (q.sub_unit || classifyQuestion(sanitizedSubject, q));
          // 전기기사는 파일명 기반 단원명을 최우선으로 사용하고, 불필요한 접두사 방지
          const subUnit = (sanitizedSubject === '전기기사' || !mainUnit || baseSubUnit.includes(mainUnit)) ? baseSubUnit : `[${mainUnit}] ${baseSubUnit}`;

          unitMap.set(subUnit, (unitMap.get(subUnit) || 0) + 1);
          questionMap.set(qId, { ...q, subUnit: subUnit });

          // 연도별 기출 집계 추가
          let y = q.year || data.year;
          let r = q.round || data.round;
          
          if (subject === '컴퓨터활용능력 2급' && q.round_info) {
            const yearMatch = q.round_info.match(/(\d{4})년/);
            const roundMatch = q.round_info.match(/(\d+)회/);
            const sangsiMatch = q.round_info.match(/상시\s*(\d+)/);
            if (yearMatch) y = yearMatch[1];
            if (roundMatch) r = roundMatch[1];
            else if (sangsiMatch) r = `상시${sangsiMatch[1]}`;
          }
          if (!r) r = q.id?.split('_')[1];
          if (r) {
            let roundStr = String(r).trim();
            // 전기기사 등 특정 키워드가 포함된 경우만 정리 (다른 종목 피해 최소화)
            if (sanitizedSubject === '전기기사') {
              roundStr = roundStr.replace(/\s*(기출문제|전기기사)$/, '').trim();
            }
            const suffix = (roundStr.includes('회') || roundStr.includes('상시')) ? '' : '회';
            const examKey = y ? `${y}년 ${roundStr}${suffix}` : `${roundStr}${suffix}`;
            examsMap.set(examKey, (examsMap.get(examKey) || 0) + 1);
          }
        });
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    });

    const sortedExams = Array.from(examsMap.entries())
      .map(([name, count]) => ({ 
        name, 
        count,
        isAI: name.includes('예상문제')
      }))
      .sort((a, b) => {
        // AI 예상 문제는 항상 최상단에 오거나 정렬에서 우선권 부여 가능
        if (a.isAI && !b.isAI) return -1;
        if (!a.isAI && b.isAI) return 1;
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numB - numA;
      });

    const getWeight = (name: string): number => {
      if (name === "선사시대 및 국가의 형성") return 1;
      if (name === "고대 사회 (삼국~남북국)") return 2;
      if (name === "중세 사회 (고려 시대)") return 3;
      if (name === "근세~근대 태동기 (조선 시대)") return 4;
      if (name === "근대 사회의 전개 (개항기)") return 5;
      if (name === "일제 강점기") return 6;
      if (name === "현대 사회의 발전") return 7;
      if (name === "기타 및 통합") return 8;

      if (name.includes('[이론]')) return 10;
      if (name.includes('[기기]')) return 11;
      if (name.includes('[설비]')) return 12;

      if (name.includes('[1과목]')) return 40;
      if (name.includes('[2과목]')) return 50;

      if (name === "시각디자인론") return 60;
      if (name === "색채학") return 61;
      if (name === "인쇄 및 사진기법") return 62;
      if (name === "시각디자인 일반") return 69;

      if (name.includes("전기자기학")) return 70;
      if (name.includes("전력공학")) return 71;
      if (name.includes("전기기기")) return 72;
      if (name.includes("회로이론")) return 73;
      if (name.includes("전기설비기술기준")) return 74;

      return 99;
    };

    const prioritizedUnits = Array.from(unitMap.entries()).sort((a, b) => {
      const wa = getWeight(a[0]);
      const wb = getWeight(b[0]);
      if (wa !== wb) return wa - wb;
      return a[0].localeCompare(b[0]);
    });

    // 빈도 정보 주입 (기본 데이터에 있는 빈도와 계산된 빈도 중 큰 것 선택)
    Array.from(questionMap.values()).forEach((q: any) => {
      const normText = normalize(q.question || "");
      const calculatedFreq = freqCountMap.get(normText) || 1;
      q.frequency = Math.max(Number(q.frequency) || 0, calculatedFreq);
    });

    // 1. [🔥 자주 나왔던 문항] 섹션 구성 (초정밀 중복 제거 - 특수문자/공백/대소문자 무시)
    const uniqueFrequentMap = new Map<string, any>();
    

    Array.from(questionMap.values()).forEach((q: any) => {
      if ((q.frequency || 0) >= 2) {
        const cleanQuestion = normalize(q.question);
        const cleanChoices = (q.choices || []).map((c: string) => normalize(c)).join("|");
        const contentKey = `${cleanQuestion}_${cleanChoices}`;
        
        if (!uniqueFrequentMap.has(contentKey)) {
          uniqueFrequentMap.set(contentKey, q);
        }
      }
    });

    const frequentQuestions = Array.from(uniqueFrequentMap.values())
      .sort((a: any, b: any) => (b.frequency || 0) - (a.frequency || 0));

    const finalUnits: { 
      name: string; 
      count: number; 
      isPart?: boolean; 
      originalName?: string; 
      range?: [number, number];
      customLabel?: string;
      isAI?: boolean; 
    }[] = [];

    // 정보처리기능사는 빈출 섹션 숨김 (사용자 요청)
    if (frequentQuestions.length > 0 && sanitizedSubject !== '정보처리기능사') {
      const FREQ_PAGE_SIZE = 30;
      const MAX_FREQ_PARTS = 6; // 사용자 요청: 공략 07부터는 노출하지 않음
      const freqParts = Math.min(MAX_FREQ_PARTS, Math.floor(frequentQuestions.length / FREQ_PAGE_SIZE) + (frequentQuestions.length % FREQ_PAGE_SIZE > 0 ? 1 : 0));
      
      for (let i = 0; i < freqParts; i++) {
        const currentCount = Math.min(FREQ_PAGE_SIZE, frequentQuestions.length - (i * FREQ_PAGE_SIZE));
        if (currentCount <= 0) continue; // 빈 페이지는 생성 안함

        finalUnits.push({
          name: `🔥 자주 나왔던 문항 - 공략 ${String(i + 1).padStart(2, '0')}`,
          count: currentCount,
          isPart: true,
          originalName: "자주나왔던문항",
          range: [i * FREQ_PAGE_SIZE, (i + 1) * FREQ_PAGE_SIZE],
          customLabel: `공략 ${i + 1}`
        });
      }
    }

    // 단원 쪼개기 로직 (한국사는 쪼개지 않고 전체 노출)
    const MAX_PER_UNIT = (subject === '한국사검정시험' || subject === '한국사능력검정시험') ? 9999 : 150;
    
    prioritizedUnits.forEach(([name, count]) => {
      if (count > MAX_PER_UNIT) {
        const parts = Math.ceil(count / MAX_PER_UNIT);
        for (let i = 0; i < parts; i++) {
          const start = i * MAX_PER_UNIT;
          const end = Math.min((i + 1) * MAX_PER_UNIT, count);
          finalUnits.push({ 
            name: `${name} (${i + 1}부)`, 
            count: end - start,
            isPart: true,
            originalName: name,
            range: [start, end]
          });
        }
      } else {
        finalUnits.push({ name, count });
      }
    });

    return NextResponse.json({ units: finalUnits, exams: sortedExams });
  } catch (err) {
    console.error('Failed to get units:', err);
    return NextResponse.json({ error: 'Failed to load units' }, { status: 500 });
  }
}
