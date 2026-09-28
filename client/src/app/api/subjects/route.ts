import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// v2.0.3: Ensure the subject list is always fresh by forcing dynamic scanning
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let dataDir = path.resolve(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      dataDir = path.resolve(process.cwd(), 'client', 'src', 'data');
    }
    
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ subjects: [] });
    }

    // Read directories in src/data
    const items = fs.readdirSync(dataDir, { withFileTypes: true });
    
    // Filter only directories that actually contain files (and exclude backup folders)
    const subjects = items
      .filter(item => {
        if (!item.isDirectory()) return false;
        if (item.name.includes('_backup') || item.name.includes('_BACKUP') || item.name.includes('.bak')) return false;
        // 3D프린터운용기능사는 추출 진행 중이므로 폴더가 비어있어도 서비스 노출 허용
        if (item.name.includes('3D프린터')) return true;
        const subDirPath = path.join(dataDir, item.name);
        try {
          const files = fs.readdirSync(subDirPath);
          return files.length > 0;
        } catch (e) {
          return false;
        }
      })
      .map(item => item.name);

    if (!subjects.some(s => s.includes('3D프린터'))) {
      subjects.push('3D프린터운용기능사');
    }
      
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Failed to read subjects:', error);
    return NextResponse.json({ subjects: [] }, { status: 500 });
  }
}
