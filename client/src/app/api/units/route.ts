import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  }

  try {
    const dataDir = path.join(process.cwd(), 'src/data', subject);
    
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ units: [] });
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    const unitMap = new Map<string, number>();

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

    const examsMap = new Map<string, number>();

    files.forEach(file => {
      try {
        const fileContent = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const data = JSON.parse(fileContent);
        const questions = Array.isArray(data) ? data : (data.questions || []);
        
        questions.forEach((q: any) => {
          const subUnit = classifyQuestion(subject, q);
          unitMap.set(subUnit, (unitMap.get(subUnit) || 0) + 1);

          // 연도별 기출 집계 추가 (연도가 없으면 회차만이라도 표시)
          const y = q.year || data.year;
          const r = q.round || data.round || q.id?.split('_')[1];
          if (r) {
            const examKey = y ? `${y}년 ${r}회` : `${r}회 기출`;
            examsMap.set(examKey, (examsMap.get(examKey) || 0) + 1);
          }
        });
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    });

    const sortedExams = Array.from(examsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
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
      return 99;
    };

    const prioritizedUnits = Array.from(unitMap.entries()).sort((a, b) => {
      const wa = getWeight(a[0]);
      const wb = getWeight(b[0]);
      if (wa !== wb) return wa - wb;
      return a[0].localeCompare(b[0]);
    });

    // 단원 쪼개기 로직 (한국사는 쪼개지 않고 전체 노출)
    const MAX_PER_UNIT = (subject === '한국사검정시험' || subject === '한국사능력검정시험') ? 9999 : 150;
    const finalUnits: { 
      name: string; 
      count: number; 
      isPart?: boolean; 
      originalName?: string; 
      range?: [number, number] 
    }[] = [];
    
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
