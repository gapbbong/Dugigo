import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const targetPath = formData.get("path") as string; // e.g. "exams/exam2015/pages/page_1.png"

    if (!file || !targetPath) {
      return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fullPath = path.join(process.cwd(), "public/images", targetPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return NextResponse.json({ status: "success", url: `/images/${targetPath}` });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
