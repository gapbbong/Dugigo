import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    // Dynamic import to avoid Turbopack build error with CJS module
    // @ts-ignore
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF
    const data = await pdf(buffer);
    const text = data.text;

    // Split into lines and process
    const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    
    interface QuestionData {
      id: number;
      page: number;
      text: string;
      options: string[];
      explanation: string;
      image: string | null;
      explanation_image: string | null;
    }

    const structuredData: QuestionData[] = [];
    const questionPattern = /^(\d+)\.\s*(.*)/;
    const optionPattern = /^[①②③④]\s*(.*)/;
    const explanationPattern = /^해설\s*(.*)/i;

    let currentQ: QuestionData | null = null;

    for (const line of lines) {
      const qMatch = line.match(questionPattern);
      const oMatch = line.match(optionPattern);
      const eMatch = line.match(explanationPattern);

      if (qMatch) {
        if (currentQ) structuredData.push(currentQ);
        currentQ = {
          id: parseInt(qMatch[1]),
          page: 1, // pdf-parse doesn't easily give pages per line
          text: qMatch[2],
          options: [],
          explanation: "",
          image: null,
          explanation_image: null
        };
      } else if (currentQ) {
        if (oMatch) {
          currentQ.options.push(oMatch[1]);
        } else if (eMatch) {
          currentQ.explanation = eMatch[1];
        } else if (currentQ.explanation) {
          currentQ.explanation += " " + line;
        } else {
          currentQ.text += " " + line;
        }
      }
    }
    if (currentQ) structuredData.push(currentQ);

    // Format for DB
    const finalOutput = {
      metadata: {
        title: file.name,
        extracted_at: new Date().toISOString()
      },
      questions: structuredData.map(q => ({
        ...q,
        options: q.options.map((text: string, i: number) => ({
          number: i + 1,
          text,
          image: null
        }))
      }))
    };

    return NextResponse.json(finalOutput);
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
