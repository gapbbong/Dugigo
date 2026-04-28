import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // 데이터 폴더 경로 설정
    const dataDir = path.join(process.cwd(), 'src', 'data', subject);

    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: 'Subject folder not found' }, { status: 404 });
    }

    // 폴더 내 모든 JSON 파일 읽기
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    let allQuestions: any[] = [];

    const classifyQuestion = (sub: string, q: any): string => {
      if (q.sub_unit) return q.sub_unit;
      if (sub === '정보처리기능사') {
        const text = (q.question + ' ' + (q.explanation || '')).toLowerCase();
        if (/sql|릴레이션|테이블|데이터베이스|조인|정규화|뷰|인덱스|트랜잭션|ddl|dml|dcl|select|update|delete|insert|기본키|외래키/.test(text)) return "데이터베이스 활용";
        if (/테스트|블랙박스|화이트박스|오류|결함|디버깅|검사|통합|알파|베타|유지보수|스텁|드라이버|단위|인수/.test(text)) return "애플리케이션 테스트 관리";
        if (/운영체제|리눅스|유닉스|쉘|스케줄링|프로세스|네트워크|osi|tcp|ip|라우팅|보안|통신|윈도우|dos|디렉터리/.test(text)) return "운영체제 및 네트워크 기초";
        if (/c언어|자바|파이썬|변수|배열|포인터|연산자|반복문|함수|클래스|객체|상속|알고리즘|순서도|자료구조|스택|큐|트리/.test(text)) return "프로그래밍 언어 활용";
        return "소프트웨어 개발 기초";
      }
      return "기본 단원";
    };

    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      let fileQuestions: any[] = [];
      // 파일 내의 questions 배열 합치기 (파일 구조가 { questions: [...] } 형태라고 가정)
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

    // 문제 섞기 (랜덤 학습을 위해)
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      subject,
      total: shuffled.length,
      questions: shuffled
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
