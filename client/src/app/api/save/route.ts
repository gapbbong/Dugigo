import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename") || "extracted_result.json";
    
    // Sanitize filename
    const safeName = filename.replace(/[^a-z0-9_\-\.]/gi, "_");
    const filePath = path.join(DATA_DIR, safeName);
    
    const data = await fs.readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ questions: [], metadata: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metadata, questions } = body;
    
    // Use metadata.title or a default name
    const rawName = metadata?.title || "extracted_result";
    const safeName = rawName.replace(/[^a-z0-9_\-\.]/gi, "_").replace(/\.pdf$/i, "") + "_structured.json";
    const filePath = path.join(DATA_DIR, safeName);

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
    
    return NextResponse.json({ status: "success", filename: safeName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
