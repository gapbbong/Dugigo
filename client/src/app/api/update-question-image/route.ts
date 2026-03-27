import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { qId, imagePath, examFile } = await req.json();
    
    // Default to the original if not provided
    const fileName = examFile || "extracted_result.json";
    const DATA_PATH = path.join(process.cwd(), "src/data", fileName);

    const data = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(data);

    // Support both { questions: [...] } and direct array [...] formats
    let questions = Array.isArray(parsed) ? parsed : parsed.questions;

    // Find question by string match or int match
    const questionIndex = questions.findIndex(
      (q: any) => String(q.id) === String(qId)
    );

    if (questionIndex !== -1) {
      questions[questionIndex].image = imagePath;
      
      // Save back in the original format
      const finalData = Array.isArray(parsed) ? questions : { ...parsed, questions };
      
      await fs.writeFile(DATA_PATH, JSON.stringify(finalData, null, 2), "utf-8");
      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
