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

    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      // 파일 내의 questions 배열 합치기 (파일 구조가 { questions: [...] } 형태라고 가정)
      if (Array.isArray(jsonData)) {
        allQuestions = [...allQuestions, ...jsonData];
      } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
        allQuestions = [...allQuestions, ...jsonData.questions];
      }
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
