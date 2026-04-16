import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const subject = searchParams.get("subject");
    const examFile = searchParams.get("examFile");

    // Local HEAD logic for crop tool
    if (examFile) {
      const DATA_PATH = path.join(process.cwd(), "src/data", examFile);
      const data = await fsPromises.readFile(DATA_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      return NextResponse.json(questions);
    }

    // Remote incoming logic for study
    if (subject) {
      const dataDir = path.join(process.cwd(), "src", "data", subject);

      if (!fs.existsSync(dataDir)) {
        return NextResponse.json({ error: "Subject folder not found" }, { status: 404 });
      }

      // 폴더 내 모든 JSON 파일 읽기 (하위 폴더 고려 안함)
      const files = fs.readdirSync(dataDir).filter(file => file.endsWith(".json"));
      let allQuestions: any[] = [];

      files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);
        
        // 파일 내의 questions 배열 합치기
        if (Array.isArray(jsonData)) {
          allQuestions = [...allQuestions, ...jsonData];
        } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
          allQuestions = [...allQuestions, ...jsonData.questions];
        }
      });

      // 문제 섞기 (랜덤 학습을 위해)
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);

      return NextResponse.json({
        subject,
        total: shuffled.length,
        questions: shuffled
      });
    }

    // Default to examFile logic if no params provided (for backward compatibility)
    const DEFAULT_DATA_PATH = path.join(process.cwd(), "src/data", "2015_01_questions.json");
    if (fs.existsSync(DEFAULT_DATA_PATH)) {
      const data = await fsPromises.readFile(DEFAULT_DATA_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      return NextResponse.json(questions);
    }

    return NextResponse.json({ error: "Either subject or examFile is required" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
