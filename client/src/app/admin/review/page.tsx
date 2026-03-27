"use client";

import { useState, useEffect } from "react";
import { Check, Edit3, Image as ImageIcon, Search, Filter, ArrowLeft, Crop } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: number;
  page: number;
  text: string;
  options: { number: number; text: string; image?: string | null }[];
  image?: string;
  answer?: number;
  explanation?: string;
  explanation_image?: string;
}

export default function ReviewPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "missing_img" | "has_img">("all");

  useEffect(() => {
    const fetchData = async () => {

      // 1. Check if there's data from a recent upload in localStorage
      const localData = localStorage.getItem("latest_extraction");
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.questions) {
          setQuestions(parsed.questions);
          setMetadata(parsed.metadata);
          return;
        }
      }


      // 2. Fallback to fetching the last saved result
      try {
        const response = await fetch("/api/save"); // Or wherever the persistent JSON is stored
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.questions);
          setMetadata(data.metadata);
        } else {

          throw new Error("Last session data not found");
        }
      } catch (e) {

        // 3. Last fallback: Mock data
        const mockData: Question[] = [
          { 
            id: 1, page: 1, text: "유효 전력의 식으로 옳은 것은?", 
            options: [
              { number: 1, text: "EIcosθ" },
              { number: 2, text: "EIsinθ" },
              { number: 3, text: "EItanθ" },
              { number: 4, text: "EI" }
            ], 
            answer: 1,
            explanation: "유효전력 P = EI cosθ [W] 입니다."
          },
          { 
            id: 4, page: 1, text: "전원과 부하가 다같이 Δ결선된 3상 평행 회로가 있다...", 
            options: [
              { number: 1, text: "20" },
              { number: 2, text: "20/√3" },
              { number: 3, text: "20√3" },
              { number: 4, text: "10√3" }
            ], 
            image: "/images/exam2015/q_4_auto.png", answer: 3,
            explanation: "절대전값 Z = 10, 선전류 IL = √3 Ip = 20√3 A.",
            explanation_image: "/images/exam2015/q_4_explanation_auto.png"
          },
        ];
        setQuestions(mockData);
      }
    };
    fetchData();
  }, []);

  const saveToDatabase = async () => {
    try {
      const payload = {
        metadata: { 
          ...metadata, 
          saved_at: new Date().toISOString() 
        }, 
        questions 
      };
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully saved as ${result.filename}!`);
      }
    } catch (e) {
      alert("Failed to save to server.");
    }
  };




  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "missing_img" && !q.image) || (filter === "has_img" && q.image);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Link href="/admin/extract" className="text-zinc-500 hover:text-white transition-colors">
                 <ArrowLeft size={16} />
               </Link>
               <h1 className="text-3xl font-black tracking-tight">REVIEW DATA</h1>
            </div>
            <p className="text-zinc-500">Validate extracted questions and fix any cropping issues.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search questions..."
                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Items</option>
              <option value="missing_img">Missing Image</option>
              <option value="has_img">Has Image</option>
            </select>
            <button 
              onClick={saveToDatabase}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              Save to Database
            </button>

          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.map((q, idx) => (
              <motion.div 
                key={`${q.id}-${idx}`}
                layout

                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group hover:border-orange-500/30 transition-colors"
              >
                {/* Question Preview Area */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded font-black tracking-widest text-zinc-400">Q{q.id} · PAGE {q.page}</span>
                    {q.image && <Check className="text-green-500" size={16} />}
                  </div>
                  
                  <p className="text-sm font-medium leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    {q.text}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, i) => (
                      <div key={i} className="text-[10px] bg-zinc-950/50 p-2 rounded border border-zinc-800/50 text-zinc-400 truncate">
                        {opt.number}. {opt.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation Area */}
                {(q.explanation || q.explanation_image) && (
                  <div className="px-5 pb-5 pt-0 border-t border-zinc-800/30">
                    <div className="flex items-center gap-1.5 mt-4 mb-2 text-rose-400">
                      <Edit3 size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Explanation</span>
                    </div>
                    {q.explanation && <p className="text-[10px] text-zinc-500 leading-relaxed italic">{q.explanation}</p>}
                    {q.explanation_image && (
                      <div className="mt-2 bg-zinc-950/30 rounded-lg p-2 border border-rose-500/10">
                        <img src={q.explanation_image} className="max-h-24 mx-auto object-contain mix-blend-lighten" alt="Exp Diagram" />
                      </div>
                    )}
                  </div>
                )}
                <div className="h-40 bg-zinc-950 border-t border-zinc-800 relative flex items-center justify-center overflow-hidden">
                  {q.image ? (
                    <img src={q.image} className="max-h-full object-contain mix-blend-lighten p-4" alt="Diagram" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-700">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Image Detected</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                     <Link 
                      href={`/admin/crop?qId=${q.id}&page=${q.page}&exam=${metadata?.title?.replace(".pdf", "") || "exam2015"}`}
                      className="bg-white text-black p-2 rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-xl"
                      title="Manual Crop"
                    >
                      <Crop size={20} />
                    </Link>

                    <button className="bg-zinc-800 p-2 rounded-full hover:bg-zinc-700 transition-all shadow-xl">
                      <Edit3 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="py-24 text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
               <ImageIcon className="text-zinc-700" />
             </div>
             <p className="text-zinc-500 font-medium">No items matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
