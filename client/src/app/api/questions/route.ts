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
      const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
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

        fileQuestions = fileQuestions.map(q => ({
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
        "승강기 점검 및 보수": 33
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
