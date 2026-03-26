"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, FileCode2 } from "lucide-react";
import { examData2015 } from "../data";

export default function ExamViewer() {
  const [currentPage, setCurrentPage] = useState(0);

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(examData2015.length - 1, prev + 1));
  };

  if (!examData2015 || examData2015.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  const currentData = examData2015[currentPage];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <FileCode2 size={18} />
          </div>
          <h1 className="text-lg font-medium tracking-tight">
            Electric Exam 2015
          </h1>
        </div>
        <div className="text-sm text-zinc-400">
          Page {currentPage + 1} of {examData2015.length}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Question Text */}
              <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-sm">
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-300">
                  {currentData.text || "텍스트 내용이 없습니다."}
                </p>
              </div>

              {/* Images */}
              {currentData.images && currentData.images.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                    첨부 이미지
                  </h3>
                  <div className="grid gap-6">
                    {currentData.images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2"
                      >
                        <img
                          src={imgSrc}
                          alt={`Page ${currentData.page} Image ${idx + 1}`}
                          className="w-full object-contain mix-blend-lighten opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 w-full border-t border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900"
          >
            <ChevronLeft size={16} />
            이전
          </button>
          
          <div className="flex gap-1">
             {/* Pagination Dots (Optional, truncated for large numbers) */}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === examData2015.length - 1}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500"
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
