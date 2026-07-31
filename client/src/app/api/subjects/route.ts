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
        const subDirPath = path.join(dataDir, item.name);
        try {
          const files = fs.readdirSync(subDirPath);
          return files.length > 0;
        } catch (e) {
          return false;
        }
      })
      .map(item => item.name);
      
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Failed to read subjects:', error);
    return NextResponse.json({ subjects: [] }, { status: 500 });
  }
}
