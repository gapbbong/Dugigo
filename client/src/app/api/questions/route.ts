import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const examFile = searchParams.get("examFile") || "2015_01_questions.json";
  
  try {
    const DATA_PATH = path.join(process.cwd(), "src/data", examFile);
    const data = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(data);
    
    // Handle both array and { questions: [] } formats
    const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
    
    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
