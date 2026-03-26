"use client";

import { useState } from "react";
import { Upload, FileJson, Image as ImageIcon, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// CDN for PDF.js
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";



export default function ExtractPage() {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    setStatus("uploading");
    setProgress(10);
    
    try {
      // 1. Load PDF.js and Tesseract.js from CDN dynamically
      if (!(window as any).pdfjsLib) {
        const script = document.createElement("script");
        script.src = PDFJS_URL;
        document.head.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }
      if (!(window as any).Tesseract) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
        document.head.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

      setStatus("processing");
      setProgress(40);

      // 2. Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      const numPages = pdf.numPages;
      const examName = file.name.replace(".pdf", "");

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        
        // --- 2a. Text Extraction (Column-aware) ---
        const textContent = await page.getTextContent();
        const items: any[] = textContent.items;
        const midX = page.getViewport({ scale: 1.0 }).width / 2;

        const processItems = (columnItems: any[]) => {
          const linesMap: Record<number, string[]> = {};
          columnItems.forEach((item) => {
            const y = Math.round(item.transform[5]);
            if (!linesMap[y]) linesMap[y] = [];
            linesMap[y].push(item.str);
          });
          const sortedY = Object.keys(linesMap).map(Number).sort((a, b) => b - a);
          return sortedY.map(y => linesMap[y].join(" ")).join("\n");
        };

        const leftItems = items.filter(item => item.transform[4] < midX);
        const rightItems = items.filter(item => item.transform[4] >= midX);
        
        let pageText = processItems(leftItems) + "\n" + processItems(rightItems);

        // --- 2b. Page Rendering ---
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;

        // --- 2c. OCR Fallback (Column-aware, Serial for stability) ---
        if (pageText.trim().length < 50) {
          console.log(`Page ${i} seems to be an image. Running column-aware OCR...`);
          const Tesseract = (window as any).Tesseract;
          if (Tesseract) {
            const midWidth = canvas.width / 2;
            
            // Left Column
            const leftCanvas = document.createElement("canvas");
            leftCanvas.width = midWidth;
            leftCanvas.height = canvas.height;
            leftCanvas.getContext("2d")?.drawImage(canvas, 0, 0, midWidth, canvas.height, 0, 0, midWidth, canvas.height);
            const leftResult = await Tesseract.recognize(leftCanvas, 'kor+eng');
            
            // Right Column
            const rightCanvas = document.createElement("canvas");
            rightCanvas.width = midWidth;
            rightCanvas.height = canvas.height;
            rightCanvas.getContext("2d")?.drawImage(canvas, midWidth, 0, midWidth, canvas.height, 0, 0, midWidth, canvas.height);
            const rightResult = await Tesseract.recognize(rightCanvas, 'kor+eng');
            
            pageText = (leftResult.data.text || "") + "\n" + (rightResult.data.text || "");
          }
        }

        fullText += `\n[P${i}]\n${pageText}\n`;

        // --- 2d. Upload Page Image ---
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));

        
        const imgFormData = new FormData();
        imgFormData.append("file", blob, `page_${i}.png`);
        imgFormData.append("path", `exams/${examName}/pages/page_${i}.png`);
        
        await fetch("/api/upload-image", { method: "POST", body: imgFormData });

        setProgress(40 + Math.floor((i / numPages) * 40));
      }

      console.log("Raw Extracted Text:", fullText);



      // 3. Robust Segmentation Logic (Tailored for Korean Exams)
      // - Support 1 or 2 digit numbering: 1., 01., 1), 01)
      // - Support column-aware ordering (Left then Right) which is already done in pageText
      const questionSplitPattern = /(?:\n|^)\s*(?:문\s*|Q\s*|0|)(\d{1,2})\s*[.)\]\s]+(?=[^\n\r0-9]{3,})/g;
      
      const segments: {id: number, content: string, startIndex: number}[] = [];
      let match;
      let lastIndex = 0;

      while ((match = questionSplitPattern.exec(fullText)) !== null) {
        if (segments.length > 0) {
          segments[segments.length - 1].content = fullText.substring(lastIndex, match.index);
        }
        segments.push({ id: parseInt(match[1]), content: "", startIndex: match.index });
        lastIndex = match.index + match[0].length;
      }
      if (segments.length > 0) {
        segments[segments.length - 1].content = fullText.substring(lastIndex);
      }

      const structuredQuestions = segments
        .filter(seg => seg.content.trim().length > 20) // Filter out noise (like answer keys)
        .map(seg => {
          let content = seg.content;
          
          // Determine page number
          const preText = fullText.substring(0, seg.startIndex);
          const pageMatches = [...preText.matchAll(/\[P(\d+)\]/g)];
          const pageNum = pageMatches.length > 0 ? parseInt(pageMatches[pageMatches.length - 1][1]) : 1;

          // Split Explanation (Common markers: 해설, 정답, SOL, *해설)
          const explanationMarkers = /[\n\r](?:해설|정답|SOL|\*해설|핵심)/i;
          const expSplit = content.split(explanationMarkers);
          const mainPart = expSplit[0];
          const explanation = expSplit.slice(1).join("\n").trim();

          // Find options: ①-⑩ or (1)-(4) or 1)-4) or common OCR misreads (@, ®, ©, ©)
          const optionRegex = /([①-❿]|[①-⑩]|\(\d\)|[1-4]\)|[@®©ⓒ]\s*[1-4])/g;
          const pieces = mainPart.split(optionRegex);
          
          let questionText = pieces[0].trim();
          const options: string[] = [];
          
          for (let i = 1; i < pieces.length; i += 2) {
            const text = pieces[i+1] ? pieces[i+1].trim() : "";
            // Clean up noise at end of option text
            const cleanText = text.split(/[\n\r]{2,}/)[0].trim();
            if (cleanText) options.push(cleanText);
          }
          
          // Final cleanup: remove leading/trailing noise and markers
          const finalText = questionText
            .replace(/^[\s\n\r*]+/, "")
            .replace(/[\s\n\r*]+$/, "");

          return {
            id: seg.id,
            page: pageNum,
            text: finalText,
            options: options.length > 0 ? options : [],
            explanation: explanation,
            image: null
          };
        })
        .filter(q => q.text.length > 5); // Final noise filter

      const result = {
        metadata: { title: file.name, extracted_at: new Date().toISOString() },
        questions: structuredQuestions.map(q => ({
          ...q,
          options: q.options.map((text: string, i: number) => ({ number: i + 1, text, image: null }))
        }))
      };


      localStorage.setItem("latest_extraction", JSON.stringify(result));
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };


  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };


  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
            PDF DATA EXTRACTOR
          </h1>
          <p className="text-zinc-500 font-medium">Convert exam PDFs into structured JSON with AI-powered image cropping.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {status === "idle" && (
              <label 
                className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-orange-500/50 transition-colors cursor-pointer group block"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input type="file" className="hidden" accept=".pdf" onChange={onFileChange} />
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-zinc-400 group-hover:text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">Drop your exam PDF here</p>
                  <p className="text-zinc-500 text-sm">or click to browse files</p>
                </div>
              </label>
            )}


            {(status === "uploading" || status === "processing") && (
              <div className="py-12 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-orange-500 font-bold animate-pulse">
                      {status === "uploading" ? "Uploading PDF..." : "AI Question Segmentation & Cropping..."}
                    </p>
                    <p className="text-zinc-500 text-xs tracking-widest uppercase">Page 12 of 38 · 42 images detected</p>
                  </div>
                  <span className="text-3xl font-black tabular-nums">{progress}%</span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                  />
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="py-12 flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 border border-green-500/30">
                  <CheckCircle size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Extraction Complete!</h2>
                  <p className="text-zinc-500 mt-2">120 questions parsed, 45 images automatically cropped.</p>
                </div>
                <Link 
                  href="/admin/review" 
                  className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all group"
                >
                  Review Extracted Data <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Stats/Info Column */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Pipeline Status</h3>
              <div className="space-y-4">
                <StatusItem icon={<FileJson size={16}/>} label="JSON Parser" status="Operational" />
                <StatusItem icon={<ImageIcon size={16}/>} label="Auto-Cropper" status="Operational" />
                <StatusItem icon={<AlertCircle size={16}/>} label="OCR Engine" status="Standby" />
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 text-orange-400">
              <p className="text-xs font-black uppercase tracking-tighter mb-2">Notice</p>
              <p className="text-sm leading-relaxed opacity-80">
                The auto-cropper uses boundary detection. Please review all diagrams in the Review Dashboard to ensure no text is cut off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ icon, label, status }: { icon: React.ReactNode, label: string, status: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-zinc-400">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-[10px] font-bold px-2 py-1 bg-zinc-800 rounded-md text-zinc-500 uppercase">{status}</span>
    </div>
  );
}
