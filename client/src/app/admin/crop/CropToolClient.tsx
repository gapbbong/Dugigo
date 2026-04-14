"use client";

import { useState, useRef, useEffect } from "react";
import { Move, Copy, RotateCcw, Image as ImageIcon, Check, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";

export function CropToolContent({ searchParamsProps }: { searchParamsProps: any }) {
  const [qId, setQId] = useState<string | null>(null);
  const [examName, setExamName] = useState("exam2015");
  const [selectedPage, setSelectedPage] = useState(1);
  const [paramsReady, setParamsReady] = useState(false);

  useEffect(() => {
    const s = searchParamsProps || {};
    const qIdParam = s.qId || null;
    const examParam = s.exam || "exam2015";
    const pageParam = Number(s.page) || 1;
    
    setQId(qIdParam);
    setExamName(examParam);
    setSelectedPage(pageParam);
    setParamsReady(true);
  }, [searchParamsProps]);

  const [crop, setCrop] = useState({ top: 20, left: 20, width: 20, height: 20 });
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!paramsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const pages = Array.from({ length: 30 }, (_, i) => i + 1);
  const imageSrc = `/images/exams/${examName}/pages/page_${selectedPage}.png`;

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

  const handleSaveCrop = async () => {
    setIsSaving(true);
    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

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
      const cropName = `q${qId}_page${selectedPage}.jpg`;
      const formData = new FormData();
      formData.append("file", blob, cropName);
      formData.append("path", `exams/${examName}/crops/${cropName}`);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetch("/api/update-question-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qId, imagePath: `/images/exams/${examName}/crops/${cropName}` }),
        });

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col gap-8 font-sans">
      <header className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/review" className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <ArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 italic">
              <ImageIcon className="text-orange-500" /> MANUAL CROP TOOL
            </h1>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">
              {qId ? `Precise cropping for Question ${qId}` : "General Page Cropping"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
           <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ZoomOut size={18}/></button>
           <span className="text-xs font-bold text-zinc-500 w-12 text-center">100%</span>
           <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ZoomIn size={18}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 space-y-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Target Page</label>
              <select 
                value={selectedPage} 
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer"
              >
                {pages.map(p => (
                  <option key={p} value={p}>Page {p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Crop Metadata (%)</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(crop).map(([key, value]) => (
                  <div key={key} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="block text-[10px] text-zinc-600 uppercase font-black">{key}</span>
                    <span className="block font-mono text-orange-500 font-bold">{value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSaveCrop}
              disabled={isSaving}
              className="w-full bg-white text-black hover:bg-orange-500 hover:text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {isSaving ? <RotateCcw className="animate-spin" size={18} /> : (copied ? <Check size={18} /> : <Copy size={18} />)}
              {isSaving ? "Saving..." : (copied ? "Saved to Server!" : "Apply & Save Crop")}
            </button>
          </div>

          <div className="flex-1" />

          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
             <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Crop Preview</h3>
             <div className="aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center p-2">
                <div className="relative w-full h-full overflow-hidden rounded-lg bg-zinc-900">
                   <img 
                    src={imageSrc} 
                    style={{
                      position: 'absolute',
                      top: `-${crop.top * 100 / crop.height}%`,
                      left: `-${crop.left * 100 / crop.width}%`,
                      width: `${100 * 100 / crop.width}%`,
                      height: `${100 * 100 / crop.height}%`,
                      maxWidth: 'none',
                    }}
                    className="mix-blend-lighten"
                    alt="Preview"
                   />
                </div>
             </div>
             <p className="text-[10px] text-zinc-600 leading-relaxed text-center">
                This shows how the diagram will appear in the CBT interface.
             </p>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-12rem)]">
          <div 
            ref={containerRef}
            className="relative bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-auto select-none grow scrollbar-hide"
          >
            <div className="relative inline-block w-full">
              <img 
                src={imageSrc} 
                alt="Full Page Source" 
                className="w-full h-auto mix-blend-lighten pointer-events-none" 
              />
              <div className="absolute inset-0 bg-black/40" />
              
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
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-orange-500 rounded-full cursor-nwse-resize shadow-2xl flex items-center justify-center border-4 border-zinc-950 group-hover:scale-125 transition-transform"
                  onMouseDown={(e) => handleMouseDown(e, "resize")}
                >
                   <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />
                </div>
                
                <div className="absolute top-0 left-1/3 w-px h-full bg-orange-500/20" />
                <div className="absolute top-0 left-2/3 w-px h-full bg-orange-500/20" />
                <div className="absolute left-0 top-1/3 w-full h-px bg-orange-500/20" />
                <div className="absolute left-0 top-2/3 w-full h-px bg-orange-500/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
