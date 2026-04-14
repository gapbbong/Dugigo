import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    
    // Read directories in src/data
    const items = fs.readdirSync(dataDir, { withFileTypes: true });
    
    // Filter only directories that actually contain files
    const subjects = items
      .filter(item => {
        if (!item.isDirectory()) return false;
        const subDirPath = path.join(dataDir, item.name);
        const files = fs.readdirSync(subDirPath);
        return files.length > 0; // Only show if not empty
      })
      .map(item => item.name);
      
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Failed to read subjects:', error);
    return NextResponse.json({ subjects: [] }, { status: 500 });
  }
}
