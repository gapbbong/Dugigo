import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// PATCH /api/questions/edit — JSON 파일에서 문항 수정
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { subject, question_id, updates } = body;
    // updates: { question?, options?, answer?, explanation? }

    if (!subject || !question_id || !updates) {
      return NextResponse.json({ error: 'subject, question_id, updates required' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'src', 'data', subject);
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: 'Subject folder not found' }, { status: 404 });
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    let found = false;

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const questions: any[] = content.questions || content;

      const idx = questions.findIndex((q: any) => q.id === question_id);
      if (idx !== -1) {
        questions[idx] = { ...questions[idx], ...updates };
        const newContent = content.questions
          ? { ...content, questions }
          : questions;
        fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2), 'utf-8');
        found = true;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
