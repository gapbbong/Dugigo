import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 제공된 4개의 API 키 로테이션
const API_KEYS = [
  'AIzaSyC7eSC6oHybcq4Ur4iXeNcFOPksgu9B8Ws',
  'AIzaSyBmOXFE5M24K8ZcYFjT03TllLTMVW3IZro',
  'AIzaSyBYJGLkcxh4JlmtiJanqVz-Jn4GNNpP2zY',
  'AIzaSyCdSeRWrIsuMgMhTNRCAJSXf7ZSxZLCvAk'
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
  const summaryFileName = `${unit}_${set}세트.json`;
  const summaryPath = path.join(process.cwd(), 'src', 'summaries', subject, summaryFileName);

  // 1. 이미 파일이 있으면 반환
  if (fs.existsSync(summaryPath)) {
    const fileContent = fs.readFileSync(summaryPath, 'utf-8');
    return NextResponse.json(JSON.parse(fileContent));
  }

  // 2. 파일이 없으면 생성 로직 시작
  try {
    // 디렉토리 생성
    const targetDir = path.dirname(summaryPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // 관련 문제 데이터 가져오기 (컨텍스트용)
    const dbPath = path.join(process.cwd(), 'src', 'data', subject, 'MASTER_DB.json');
    let contextQuestions = "";
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      // 해당 단원 문제 필터링 (간략화를 위해 상위 15개 정도만 컨텍스트로 사용)
      const filtered = dbContent
        .filter((q: any) => q.sub_unit === unit || !unit)
        .slice((parseInt(set) - 1) * 10, parseInt(set) * 10);
      contextQuestions = JSON.stringify(filtered);
    }

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      당신은 자격증 학습을 돕는 전문 교육 콘텐츠 제작자입니다.
      제공된 문제를 바탕으로 '${subject}' 과목의 '${unit}' 단원 '${set}세트'를 위한 핵심 요약 슬라이드 10장 내외(필요시 추가)를 생성하세요.

      [반드시 준수해야 할 규칙]
      1. **비유(Metaphor) 활용**: 어려운 개념을 도서관, 우체국, 요리, 도로 등 일상적인 상황에 비유하여 설명하세요.
      2. **대상 수준**: 매우 쉽게 설명하되, "초등학생 수준"이나 "중학생용"이라는 단어는 절대 직접적으로 언급하지 마세요.
      3. **실사 이미지 묘사**: 각 슬라이드에 어울리는 실사 풍의 이미지 컨셉을 'visual' 필드에 상세히 적어주세요.
      4. **문제 풀이 전략**: 'exam_point' 필드에는 실제 시험 문제에서 이 개념이 어떻게 정답으로 연결되는지 팁을 적어주세요.
      5. **구조**: 10장 내외의 슬라이드 객체를 포함하는 JSON 형식으로 응답하세요.
      6. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${unit}_${set}_slide_{id}.png" 형식으로 지정하세요.

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
            "image": "/summaries/${subject}/${unit}_${set}_slide_1.png",
            "title": "슬라이드 제목",
            "content": "비유를 섞은 친절한 설명",
            "visual": "이미지 생성용 상세 묘사 (실사 풍)",
            "exam_point": "시험 출제 포인트 및 풀이 팁"
          },
          ... (10장 내외)
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON 추출 (마크다운 태그 제거)
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const generatedData = JSON.parse(jsonStr);

    // 파일 저장
    fs.writeFileSync(summaryPath, JSON.stringify(generatedData, null, 2));

    return NextResponse.json(generatedData);
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
