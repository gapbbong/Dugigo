import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;


let supabase: any = null;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const subject = searchParams.get("subject");
    const examFile = searchParams.get("examFile");

    // Local HEAD logic for crop tool
    if (examFile) {
      const DATA_PATH = path.join(process.cwd(), "src/data", examFile);
      const data = await fsPromises.readFile(DATA_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      return NextResponse.json(questions);
    }

    // Remote incoming logic for study
    if (subject) {
      // 1. 자동화설비(생산자동화)기능사 - 슈파베이스 우선 처리
      if (subject.includes('자동화설비') || subject.includes('생산자동화')) {
        if (!supabase) {
          const { createClient } = await import('@supabase/supabase-js');
          supabase = createClient(supabaseUrl!, SERVICE_ROLE_KEY!, {
            global: {
              fetch: (url, options) => {
                const headers = new Headers(options?.headers);
                if (supabaseUrl!.includes('ngrok-free.dev')) {
                  headers.set('ngrok-skip-browser-warning', '1');
                }
                return fetch(url, { ...options, headers });
              }
            }
          });
        }

        const start = parseInt(searchParams.get("start") || "0");
        const limit = parseInt(searchParams.get("limit") || "30");
        const yearFilter = searchParams.get("year");
        const roundFilter = searchParams.get("round");
        const unitFilter = searchParams.get("unit");

        let query = supabase
          .from('dukigo_exam_questions')
          .select('*', { count: 'exact' })
          .eq('subject_id', 'PRODUCTION_AUTO');

        if (yearFilter) query = query.eq('exam_year', yearFilter);
        if (roundFilter) query = query.eq('exam_round', roundFilter);
        if (unitFilter) {
          const cleanUnit = unitFilter.replace(/^\[.*?\]\s*/, '').replace(/\s*\(\d+부\)$/, '').trim();
          // metadata 내의 sub_unit 필드 검색 (Supabase jsonb 검색 활용)
          query = query.filter('metadata->>sub_unit', 'ilike', `%${cleanUnit}%`);
        }

        const { data, error, count } = await query
          .order('exam_year', { ascending: false })
          .order('exam_round', { ascending: false })
          .order('question_no', { ascending: true })
          .range(start, start + limit - 1);

        if (!error && data) {
          const mappedQuestions = data.map((q: any) => ({
            id: q.metadata?.id || `${q.exam_year}_${q.exam_round}_${q.question_no}`,
            year: q.exam_year.toString(),
            round: q.exam_round.toString(),
            number: q.question_no,
            question: q.question_text,
            choices: q.options,
            answer: q.correct_answer,
            explanation: q.explanation,
            sub_unit: q.metadata?.sub_unit || "4.3 자동화 시스템",
            question_img: q.metadata?.question_img || null,
            visual_coords: q.metadata?.visual_coords || null,
            round_info: `${q.exam_year}년 ${q.exam_round}회`,
            choice_imgs: q.metadata?.choice_imgs || []
          }));

          return NextResponse.json({
            subject,
            total: count || mappedQuestions.length,
            questions: mappedQuestions,
            start,
            limit
          });
        }
      }

      // 2. 원본 이름으로 시도
      let targetSubject = subject;
      let dataDir = path.join(process.cwd(), "src", "data", targetSubject);

      // 2. 없으면 공백 제거 버전으로 시도
      if (!fs.existsSync(dataDir)) {
        targetSubject = subject.replace(/\s/g, '');
        dataDir = path.join(process.cwd(), "src", "data", targetSubject);
      }

      // 3. 그래도 없으면 전체 폴더를 돌며 공백 무시하고 매칭되는 것 찾기
      if (!fs.existsSync(dataDir)) {
        const parentDir = path.join(process.cwd(), "src", "data");
        if (fs.existsSync(parentDir)) {
          const allFolders = fs.readdirSync(parentDir).filter(f => fs.statSync(path.join(parentDir, f)).isDirectory());
          const match = allFolders.find(f => f.replace(/\s/g, '') === subject.replace(/\s/g, ''));
          if (match) {
            targetSubject = match;
            dataDir = path.join(parentDir, targetSubject);
          }
        }
      }

      if (!fs.existsSync(dataDir)) {
        return NextResponse.json({ error: 'Subject folder not found' }, { status: 404 });
      }

      const sanitizedSubject = targetSubject.replace(/\s/g, '');

      // 모든 JSON 파일 읽기 (단원 파일 우선순위 적용을 위해 정렬)
      const filesToLoad = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.json') && !file.includes('_CLEAN'))
        .sort((a, b) => {
          const isAStandard = /^\d+\./.test(a);
          const isBStandard = /^\d+\./.test(b);
          if (isAStandard && !isBStandard) return -1;
          if (!isAStandard && isAStandard) return 1;
          return 0;
        });

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
          if (/인쇄|사진|필름|현상|제판|제책|잉크|카메라|노출|광선|렌즈|망점|오프셋|가열|잠상/.test(text)) return "인쇄 및 사진기법";
          if (/디자인|기호|광고|마케팅|바우하우스|조형|공간|매니지먼트|아이덴티티|퍼스|게슈탈트/.test(text)) return "시각디자인론";
          return "시각디자인 일반";
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
        }

        return "기본 단원";
      };

      const questionMap = new Map<string, any>();

      filesToLoad.forEach(file => {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        const fileNameUnit = file.replace(/\.json$/, '').trim();
        const isStandardUnitFile = /^\d+\./.test(fileNameUnit);

        let fileQuestions: any[] = [];
        if (Array.isArray(jsonData)) {
          fileQuestions = jsonData;
        } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
          fileQuestions = jsonData.questions;
        }

        fileQuestions.forEach(q => {
          const text = (q.question || '').trim();
          const isPlaceholder = text === '' || 
                               text.includes('이미지에 지문이 없습니다') || 
                               text.includes('이미지에 문제 본문 없음') ||
                               text.includes('내용을 확인할 수 없습니다');
          const hasImage = !!(q.question_img || q.image);
          if (isPlaceholder && !hasImage) return;

          // 고유 ID 생성 로직 최적화 (year, round, number 조합 우선)
          const qId = q.id || `${q.year || ''}_${q.round || ''}_${q.number}`;
          
          // 이미 등록된 문제가 있고, 현재 파일이 표준 단원 파일이 아니면 패스 (단원 파일 우선순위)
          if (questionMap.has(qId) && !isStandardUnitFile) return;

          const mainUnit = q.subject || "";
          const baseSubUnit = isStandardUnitFile ? fileNameUnit : (q.sub_unit || classifyQuestion(sanitizedSubject, q));
          const subUnit = mainUnit ? `[${mainUnit}] ${baseSubUnit}` : baseSubUnit;
          
          questionMap.set(qId, {
            ...q,
            sub_unit: subUnit
          });
        });
      });

      const allQuestions = Array.from(questionMap.values());

      const UNIT_ORDER: { [key: string]: number } = {
        "선사시대 및 국가의 형성": 1,
        "고대 사회 (삼국~남북국)": 2,
        "중세 사회 (고려 시대)": 3,
        "근세~근대 태동기 (조선 시대)": 4,
        "근대 사회의 전개 (개항기)": 5,
        "일제 강점기": 6,
        "현대 사회의 발전": 7,
        "기타 및 통합": 8,
        "데이터베이스 활용": 10,
        "애플리케이션 테스트 관리": 11,
        "운영체제 및 네트워크 기초": 12,
        "프로그래밍 언어 활용": 13,
        "소프트웨어 개발 기초": 14,
        "[이론] 전기이론": 20,
        "[기기] 전기기기": 21,
        "[설비] 전기설비": 22,
        "전기이론": 30,
        "기계일반": 31,
        "승강기 개론": 32,
        "승강기 점검 및 보수": 33,
        "컴퓨터 일반": 40,
        "스프레드시트 일반": 41
      };

      let sorted = allQuestions.sort((a, b) => {
        const orderA = UNIT_ORDER[a.sub_unit] || 99;
        const orderB = UNIT_ORDER[b.sub_unit] || 99;
        
        if (orderA !== orderB) return orderA - orderB;
        
        // 같은 단원 내에서는 회차(round) 순서로 정렬
        const roundA = parseInt(a.round) || 0;
        const roundB = parseInt(b.round) || 0;
        if (roundA !== roundB) return roundA - roundB;

        return (a.number || 0) - (b.number || 0);
      });

      // --- 서버 사이드 필터링 및 페이징 로직 추가 ---
      const yearFilter = searchParams.get("year");
      const roundFilter = searchParams.get("round");
      const unitFilter = searchParams.get("unit");
      const start = parseInt(searchParams.get("start") || "0");
      const limit = parseInt(searchParams.get("limit") || "10000"); // 기본값은 크게 설정

      if (unitFilter) {
        // [🔥 자주 나왔던 문항] 특수 처리
        if (unitFilter.includes("자주 나왔던 문항") || unitFilter.includes("자주나왔던문항")) {
          const masterFile = filesToLoad.find(f => f.toLowerCase().includes('master_db') || f.toLowerCase().includes('master') || f.includes('Literacy2') || f.includes('history_master'));
          if (masterFile) {
            const masterPath = path.join(dataDir, masterFile);
            const masterContent = fs.readFileSync(masterPath, 'utf-8');
            const masterData = JSON.parse(masterContent);
            let masterQuestions = Array.isArray(masterData) ? masterData : (masterData.questions || []);
            
            // 내용(문제+보기) 기반으로 중복을 완전히 제거합니다.
            const uniqueMap = new Map<string, any>();
            masterQuestions.forEach((q: any) => {
              if ((q.frequency || 0) >= 2) {
                const contentKey = `${q.question}_${(q.choices || []).join('|')}`;
                if (!uniqueMap.has(contentKey)) {
                  uniqueMap.set(contentKey, q);
                }
              }
            });

            sorted = Array.from(uniqueMap.values())
              .sort((a: any, b: any) => (b.frequency || 0) - (a.frequency || 0));
          }
        } else {
          const baseUnitFilter = unitFilter.replace(/\s*\(\d+부\)$/, '').trim();
          const cleanUnit = baseUnitFilter.replace(/^\[.*?\]\s*/g, '').trim();
          
          sorted = sorted.filter(q => {
            const rawQUnit = q.sub_unit || q.subject || '';
            if (rawQUnit === baseUnitFilter) return true;
            
            const qCleanUnit = rawQUnit.replace(/^\[.*?\]\s*/g, '').trim();
            return qCleanUnit === cleanUnit;
          });
        }
      }

      if (yearFilter || roundFilter) {
        sorted = sorted.filter(q => {
          let y = q.year || '';
          let r = q.round || q.id?.split('_')[1] || '';

          if (subject === '컴퓨터활용능력 2급' && q.round_info) {
            const yearMatch = q.round_info.match(/(\d{4})년/);
            const roundMatch = q.round_info.match(/(\d+)회/);
            const sangsiMatch = q.round_info.match(/상시\s*(\d+)/);
            if (yearMatch) y = yearMatch[1];
            if (roundMatch) r = roundMatch[1];
            else if (sangsiMatch) r = `상시${sangsiMatch[1]}`;
          }

          const matchYear = !yearFilter || y.toString() === yearFilter.toString();
          const matchRound = !roundFilter || r.toString() === roundFilter.toString();
          return matchYear && matchRound;
        });
      }

      const totalCount = sorted.length;
      const paginatedQuestions = sorted.slice(start, start + limit);

      return NextResponse.json({
        subject,
        total: totalCount,
        questions: paginatedQuestions,
        start,
        limit
      });
    }

    // Default to examFile logic if no params provided (for backward compatibility)
    const DEFAULT_DATA_PATH = path.join(process.cwd(), "src/data", "2015_01_questions.json");
    if (fs.existsSync(DEFAULT_DATA_PATH)) {
      const data = await fsPromises.readFile(DEFAULT_DATA_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      return NextResponse.json(questions);
    }

    return NextResponse.json({ error: "Either subject or examFile is required" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
