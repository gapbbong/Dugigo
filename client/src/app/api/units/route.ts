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
    const finalUnits = [];
    
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
