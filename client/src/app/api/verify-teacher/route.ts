import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    // 환경 변수(서버 사이드)에 등록된 교사 인증 코드와 비교
    // 기본값은 '7153'으로 설정되어 클라이언트 자바스크립트 번들에 노출되지 않음
    const validCode = process.env.TEACHER_SECRET_CODE || '7153';
    
    if (code === validCode) {
      return NextResponse.json({ valid: true });
    }
    return NextResponse.json({ valid: false });
  } catch (err) {
    return NextResponse.json({ valid: false, error: 'Bad request' }, { status: 400 });
  }
}
