"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Copy, RotateCcw, Image as ImageIcon, Check, ArrowLeft, ZoomIn, ZoomOut, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CropToolContent() {
  const searchParams = useSearchParams();
  const initExam = searchParams.get("exam") || "ElectricExam2015";
  const initJson = searchParams.get("file") || "2015_01_questions.json";

  const [examName, setExamName] = useState(initExam);
  const [jsonName, setJsonName] = useState(initJson);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQIndex, setSelectedQIndex] = useState<number>(0);
  const selectedQuestion = questions[selectedQIndex];

  // Default image source logic
  const [selectedPage, setSelectedPage] = useState(1);
  const [useJpeg, setUseJpeg] = useState(false);

  const [crop, setCrop] = useState({ top: 20, left: 20, width: 20, height: 20 });
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load questions
  useEffect(() => {
    fetch(`/api/questions?examFile=${jsonName}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          setQuestions([]);
        }
      })
      .catch(e => console.error("Failed to load questions", e));
  }, [jsonName]);

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize") => {
    setIsDragging(true);
    setDragType(type);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (dragType === "move") {
        setCrop((prev) => ({
          ...prev,
          left: Math.max(0, Math.min(100 - prev.width, x - prev.width / 2)),
          top: Math.max(0, Math.min(100 - prev.height, y - prev.height / 2)),
        }));
      } else if (dragType === "resize") {
        setCrop((prev) => ({
          ...prev,
          width: Math.max(1, Math.min(100 - prev.left, x - prev.left)),
          height: Math.max(1, Math.min(100 - prev.top, y - prev.top)),
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragType]);

  const imageSrc = useJpeg 
    ? `/images/exam2015/page_${selectedPage}_img_1.jpeg` 
    : `/images/exams/${examName}/pages/page_${selectedPage}.png`;

  const handleSaveCrop = async () => {
    if (!selectedQuestion) return alert("Select a question first!");
    
    setIsSaving(true);
    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      const pixelX = (crop.left / 100) * img.width;
      const pixelY = (crop.top / 100) * img.height;
      const pixelW = (crop.width / 100) * img.width;
      const pixelH = (crop.height / 100) * img.height;

      canvas.width = pixelW;
      canvas.height = pixelH;
      ctx?.drawImage(img, pixelX, pixelY, pixelW, pixelH, 0, 0, pixelW, pixelH);

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
      
      const qId = selectedQuestion.id;
      const cropName = `q_${qId}_page${selectedPage}.jpg`;
      const saveRelativePath = `crops/${jsonName.replace('.json', '')}/${cropName}`;

      const formData = new FormData();
      formData.append("file", blob, cropName);
      formData.append("path", saveRelativePath);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const finalUrl = `/images/${saveRelativePath}`;
        
        await fetch("/api/update-question-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qId, imagePath: finalUrl, examFile: jsonName }),
        });

        // Optimistically update local state
        setQuestions(prev => {
          const newQ = [...prev];
          newQ[selectedQIndex].image = finalUrl;
          return newQ;
        });

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("Upload failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving: " + e);
    } finally {
      setIsSaving(false);
    }
  };

  const pages = Array.from({ length: 40 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex overflow-hidden font-sans">
      {/* Sidebar - Questions List */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen shrink-0 relative z-20">
        <div className="p-4 border-b border-zinc-800 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-black text-zinc-500 mb-1 block">JSON Data File</label>
            <input 
              value={jsonName} 
              onChange={e => setJsonName(e.target.value)} 
              className="w-full bg-zinc-950 px-3 py-2 text-sm rounded-lg border border-zinc-800 focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-zinc-500 mb-1 block">Image Folder Name</label>
            <input 
              value={examName} 
              onChange={e => setExamName(e.target.value)} 
              className="w-full bg-zinc-950 px-3 py-2 text-sm rounded-lg border border-zinc-800 focus:outline-none focus:border-orange-500" 
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="useJpeg" 
              checked={useJpeg} 
              onChange={e => setUseJpeg(e.target.checked)} 
            />
            <label htmlFor="useJpeg" className="text-xs text-zinc-400">Use basic page_N_img_1.jpeg</label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 flex flex-col gap-1">
          {questions.map((q, idx) => {
            const hasGraphics = q.question.includes("그림") || q.question.includes("다음 회로") || q.question.includes("회로도");
            const isSelected = selectedQIndex === idx;
            return (
              <button
                key={String(q.id) + idx}
                onClick={() => setSelectedQIndex(idx)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isSelected ? "bg-orange-500/20 border border-orange-500/50" : "hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold ${isSelected ? "text-orange-400" : "text-zinc-500"}`}>
                    ID: {q.id}
                  </span>
                  {hasGraphics && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <AlertCircle size={10} /> 필요
                    </span>
                  )}
                  {q.image && !hasGraphics && (
                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      완료
                    </span>
                  )}
                </div>
                <p className="text-sm line-clamp-2 text-zinc-300">
                  {q.question}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Question Info */}
        <div className="bg-zinc-900/80 p-6 border-b border-zinc-800 shrink-0">
          {selectedQuestion ? (
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold mb-3">{selectedQuestion.question}</h2>
              <div className="flex gap-4 mb-4 text-sm text-zinc-400">
                {selectedQuestion.options?.map((opt: string|any, oIdx: number) => {
                  const text = typeof opt === "string" ? opt : opt.text;
                  return <span key={oIdx}>({oIdx+1}) {text}</span>
                })}
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSaveCrop}
                  disabled={isSaving}
                  className="bg-orange-500 text-black hover:bg-orange-400 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving ? <RotateCcw className="animate-spin" size={16} /> : (copied ? <Check size={16} /> : <Copy size={16} />)}
                  {isSaving ? "저장 중..." : (copied ? "저장 완료!" : "크롭 및 연결")}
                </button>
                {selectedQuestion.image && (
                  <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                    <Check size={16} /> Image linked: {selectedQuestion.image.split("/").pop()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-zinc-600 font-bold italic">문제를 선택해주세요.</div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button 
              onClick={() => setSelectedPage(p => Math.max(1, p - 1))}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold w-16 text-center text-zinc-300">Pg {selectedPage}</span>
            <button 
              onClick={() => setSelectedPage(p => p + 1)}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <select 
            value={selectedPage} 
            onChange={(e) => setSelectedPage(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none"
          >
            {pages.map(p => <option key={p} value={p}>Page {p}</option>)}
          </select>
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto bg-zinc-950 relative p-8">
          <div 
            ref={containerRef}
            className="relative inline-block mx-auto min-w-[600px] border border-zinc-800 shadow-2xl select-none"
          >
            <img 
              src={imageSrc} 
              alt="Source page" 
              className="block w-full h-auto max-w-[1000px] pointer-events-none" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; 
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            
            {/* Crop Box */}
            <div 
              style={{
                position: "absolute",
                top: `${crop.top}%`,
                left: `${crop.left}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
                border: "2px solid #f97316",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
                zIndex: 10,
              }}
              className="group"
            >
              <div 
                className="absolute inset-0 cursor-move"
                onMouseDown={(e) => handleMouseDown(e, "move")}
              />
              <div 
                className="absolute -bottom-3 -right-3 w-6 h-6 bg-orange-500 rounded-full cursor-nwse-resize shadow-lg flex items-center justify-center border-[3px] border-white"
                onMouseDown={(e) => handleMouseDown(e, "resize")}
              />
              
              {/* Reference Grid */}
              <div className="absolute top-0 left-1/3 w-px h-full bg-orange-500/30 pointer-events-none" />
              <div className="absolute top-0 left-2/3 w-px h-full bg-orange-500/30 pointer-events-none" />
              <div className="absolute left-0 top-1/3 w-full h-px bg-orange-500/30 pointer-events-none" />
              <div className="absolute left-0 top-2/3 w-full h-px bg-orange-500/30 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CropTool() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CropToolContent />
    </Suspense>
  );
}
