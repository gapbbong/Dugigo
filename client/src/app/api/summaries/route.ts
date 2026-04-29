import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const unit = searchParams.get('unit');
  const set = searchParams.get('set');

  if (!subject || !unit || !set) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const summaryPath = path.join(process.cwd(), 'src', 'data', 'summaries', subject, `${unit}_${set}세트.json`);
    
    if (!fs.existsSync(summaryPath)) {
      return NextResponse.json({ slides: [] }, { status: 404 });
    }

    const fileContent = fs.readFileSync(summaryPath, 'utf-8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
