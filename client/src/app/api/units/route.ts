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

    files.forEach(file => {
      try {
        const fileContent = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const data = JSON.parse(fileContent);
        const questions = data.questions || [];
        
        questions.forEach((q: any) => {
          if (q.sub_unit) {
            unitMap.set(q.sub_unit, (unitMap.get(q.sub_unit) || 0) + 1);
          }
        });
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    });

    // 가나다 순으로 정렬하여 객체 배열로 반환
    const units = Array.from(unitMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({ units });
  } catch (err) {
    console.error('Failed to get units:', err);
    return NextResponse.json({ error: 'Failed to load units' }, { status: 500 });
  }
}
