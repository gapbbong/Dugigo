import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

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
      const dataDir = path.join(process.cwd(), "src", "data", subject);

      if (!fs.existsSync(dataDir)) {
        return NextResponse.json({ error: 'Subject folder not found' }, { status: 404 });
      }

      // 폴더 내 모든 JSON 파일 읽기
      const files = fs.readdirSync(dataDir).filter(file => 
        file.endsWith('.json') && !file.includes('_CLEAN')
      );
      let allQuestions: any[] = [];

      const classifyQuestion = (sub: string, q: any): string => {
        const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();

        if (sub === '정보처리기능사') {
          if (q.sub_unit) return q.sub_unit;
          if (/sql|릴레이션|테이블|데이터베이스|조인|정규화|뷰|인덱스|트랜잭션|ddl|dml|dcl|select|update|delete|insert|기본키|외래키/.test(text)) return "데이터베이스 활용";
          if (/테스트|블랙박스|화이트박스|오류|결함|디버깅|검사|통합|알파|베타|유지보수|스텁|드라이버|단위|인수/.test(text)) return "애플리케이션 테스트 관리";
          if (/운영체제|리눅스|유닉스|쉘|스케줄링|프로세스|네트워크|osi|tcp|ip|라우팅|보안|통신|윈도우|dos|디렉터리/.test(text)) return "운영체제 및 네트워크 기초";
          if (/c언어|자바|파이썬|변수|배열|포인터|연산자|반복문|함수|클래스|객체|상속|알고리즘|순서도|자료구조|스택|큐|트리/.test(text)) return "프로그래밍 언어 활용";
          return "소프트웨어 개발 기초";
        }

        if (sub === '승강기기능사') {
          if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|전동기|발전기|브리지|오옴|플레밍/.test(text)) return "전기이론";
          if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "기계일반";
          if (/안전관리|일상점검|정기검사|유지관리|비상벨|안전장치|보수|점검/.test(text)) return "승강기 점검 및 보수";
          return "승강기 개론";
        }

        if (sub === '전기기능사') {
          if (/전선|배선|배관|접지|전선로|조명|절연|공사|금속관|가요|케이블/.test(text)) return "[설비] 전기설비";
          if (/직류기|동기기|변압기|유도기|정류기|전동기|발전기|회전자|슬립|계자/.test(text)) return "[기기] 전기기기";
          return "[이론] 전기이론";
        }

        if (sub === '컴퓨터활용능력 2급') {
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

        if (sub === '한국사검정시험' || sub === '한국사능력검정시험') {
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

        return "기본 단원";
      };

      files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        let fileQuestions: any[] = [];
        if (Array.isArray(jsonData)) {
          fileQuestions = jsonData;
        } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
          fileQuestions = jsonData.questions;
        }

        fileQuestions = fileQuestions
          .filter(q => {
            const text = (q.question || '').trim();
            // 지문 없음, 본문 없음 등 다양한 실패 메시지 감지
            const isPlaceholder = text === '' || 
                                 text.includes('이미지에 지문이 없습니다') || 
                                 text.includes('이미지에 문제 본문 없음') ||
                                 text.includes('내용을 확인할 수 없습니다');
            const hasImage = !!(q.question_img || q.image);
            return !isPlaceholder || hasImage;
          })
          .map(q => ({
            ...q,
            sub_unit: classifyQuestion(subject, q)
          }));

        allQuestions = [...allQuestions, ...fileQuestions];
      });

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

      const sorted = allQuestions.sort((a, b) => {
        const orderA = UNIT_ORDER[a.sub_unit] || 99;
        const orderB = UNIT_ORDER[b.sub_unit] || 99;
        
        if (orderA !== orderB) return orderA - orderB;
        
        // 같은 단원 내에서는 회차(round) 순서로 정렬
        const roundA = parseInt(a.round) || 0;
        const roundB = parseInt(b.round) || 0;
        if (roundA !== roundB) return roundA - roundB;

        return (a.number || 0) - (b.number || 0);
      });

      return NextResponse.json({
        subject,
        total: sorted.length,
        questions: sorted
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
