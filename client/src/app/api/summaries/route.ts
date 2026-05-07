import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 제공된 4개의 API 키 로테이션
const API_KEYS = [
  'AIzaSyAm-cbD26-Kw6D7jw_kRWwMbmSX5kdkCEA',
  'AIzaSyCJrEEApCqBKVNQkkljxg9MavVMzg7iSls',
  'AIzaSyC6eIBZxj-oCL4myZNpHmmINe0UWAoyVAc',
  'AIzaSyDm1ui58wpXnGWJWnxPmo3ZsMYMyRBqX9c'
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
  const safeUnitName = unit.replace(/[^a-z0-9가-힣]/gi, '_');
  const summaryFileName = `${safeUnitName}_${set}세트.json`;
  const summaryPath = path.join(process.cwd(), 'src', 'summaries', subject, summaryFileName);

  // 1. 이미 파일이 있으면 반환
  if (fs.existsSync(summaryPath)) {
    try {
      const fileContent = fs.readFileSync(summaryPath, 'utf-8');
      return NextResponse.json(JSON.parse(fileContent));
    } catch (e) {
      console.error('File read error, regenerating...', e);
    }
  }

  // 2. 파일이 없으면 생성 로직 시작
  try {
    // 디렉토리 생성
    const targetDir = path.dirname(summaryPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // 관련 문제 데이터 가져오기 (컨텍스트용)
    const dataDir = path.join(process.cwd(), 'src', 'data', subject);
    let dbPath = path.join(dataDir, 'MASTER_DB.json');
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(dataDir, 'history_master.json');
    }

    let contextQuestions = "";
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const allQuestions = Array.isArray(dbContent) ? dbContent : (dbContent.questions || []);
      
      // 해당 단원 문제 필터링 (간략화를 위해 상위 10개 정도만 컨텍스트로 사용)
      const filtered = allQuestions
        .filter((q: any) => q.sub_unit === unit || !unit)
        .slice((parseInt(set) - 1) * 10, parseInt(set) * 10);
      contextQuestions = JSON.stringify(filtered);
    }

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // 전기기능사 전용 고도화 프롬프트
    const subjectPrompt = subject.includes('전기') ? `
      [전기기능사 특화 규칙]
      1. **단원별 스타일 적용**:
         - '전기이론': 수식과 회로도가 중심인 'Formula' 스타일. SVG 코드로 간략한 회로도를 표현하세요.
         - '전기기기': 구조와 원리 중심의 'Structure' 스타일. 부품별 역할을 'Component Breakdown'으로 설명하세요.
         - '전기설비': 시공과 안전 중심의 'Process' 스타일. 체크리스트나 단계별 가이드를 제공하세요.
      2. **수식 표현**: 반드시 KaTeX 형식(예: $V=IR$)을 사용하고, 복잡한 식은 변수별로 색상이나 비유를 들어 해부하세요.
      3. **직관적 비유**: 전압은 수압, 전류는 물의 양처럼 전기가 눈에 보이듯 설명하세요.
    ` : '';

    const prompt = `
      당신은 전기/기술 자격증 학습을 돕는 국내 최고의 교육 콘텐츠 제작자입니다.
      제공된 문제를 바탕으로 '${subject}' 과목의 '${unit}' 단원 '${set}세트'를 위한 핵심 요약 슬라이드 10장 내외를 생성하세요.

      ${subjectPrompt}

      [반드시 준수해야 할 규칙]
      1. **이미지 경로**: 'image' 필드는 "/summaries/${subject}/${safeUnitName}_${set}_slide_{id}.png" 형식으로 지정하세요.
      2. **SVG 지원**: 'svg_overlay' 필드에 학습 내용과 관련된 간단한 회로도나 다이어그램을 나타내는 SVG 코드를 포함할 수 있습니다.
      3. **구조**: 반드시 유효한 JSON 형식으로만 응답하세요.

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
            "style": "Formula | Structure | Process",
            "image": "/summaries/${subject}/${safeUnitName}_${set}_slide_1.png",
            "svg_overlay": "<svg>...</svg>",
            "title": "슬라이드 제목",
            "content": "비유를 섞은 친절한 설명",
            "visual": "이미지 생성용 상세 묘사 (실사 풍)",
            "exam_point": "시험 출제 포인트 및 풀이 팁",
            "components": [
               { "name": "변수/부품명", "desc": "설명/비유" }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSON 추출 최적화 (정규식 사용)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to extract JSON from AI response');
    
    const generatedData = JSON.parse(jsonMatch[0]);

    // 파일 저장
    fs.writeFileSync(summaryPath, JSON.stringify(generatedData, null, 2));

    return NextResponse.json(generatedData);
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
