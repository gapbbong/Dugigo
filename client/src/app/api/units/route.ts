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

          // 연도별 기출 집계 추가
          if (q.year && q.round) {
            const examKey = `${q.year}년 ${q.round}회`;
            examsMap.set(examKey, (examsMap.get(examKey) || 0) + 1);
          }
        });
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    });

    // 연도별 기출 정렬 (최신순)
    const sortedExams = Array.from(examsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.name.localeCompare(a.name));

    // 가나다 순으로 먼저 정렬
    const sortedEntries = Array.from(unitMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    // [이론] -> [기기] -> [설비] 순서로 가중치 부여하여 재정렬
    const getWeight = (name: string): number => {
      if (name.includes('[이론]')) return 1;
      if (name.includes('[기기]')) return 2;
      if (name.includes('[설비]')) return 3;
      return 4;
    };

    const prioritizedUnits = sortedEntries.sort((a, b) => {
      const wa = getWeight(a[0]);
      const wb = getWeight(b[0]);
      if (wa !== wb) return wa - wb;
      return a[0].localeCompare(b[0]);
    });

    // 150문항(5세트) 초과 단원 쪼개기 로직
    const MAX_PER_UNIT = 150;
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

    return NextResponse.json({ units: finalUnits });
  } catch (err) {
    console.error('Failed to get units:', err);
    return NextResponse.json({ error: 'Failed to load units' }, { status: 500 });
  }
}
