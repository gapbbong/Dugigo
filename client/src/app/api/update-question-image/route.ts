import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "src/data/extracted_result.json");

export async function POST(req: NextRequest) {
  try {
    const { qId, imagePath } = await req.json();

    const data = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(data);

    const questionIndex = parsed.questions.findIndex((q: any) => q.id === parseInt(qId));
    if (questionIndex !== -1) {
      parsed.questions[questionIndex].image = imagePath;
      await fs.writeFile(DATA_PATH, JSON.stringify(parsed, null, 2), "utf-8");
      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
