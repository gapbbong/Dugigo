'use client';
import React, { useEffect } from 'react';

export default function ConfettiTest() {
  const triggerConfetti = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      const confetti = (window as any).confetti;
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    };
    document.body.appendChild(script);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
      <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">
        두기고 폭죽 효과 테스트
      </h1>
      <button 
        id="confetti-btn"
        onClick={triggerConfetti}
        className="px-12 py-6 bg-brand-600 hover:bg-brand-700 text-white text-2xl font-black rounded-[2rem] shadow-2xl shadow-brand-500/40 transition-all active:scale-95"
      >
        폭죽 터뜨리기! 🚀
      </button>
      <p className="mt-8 text-slate-400 font-bold">현재 설정값: 200 particles (multi-fire)</p>
    </div>
  );
}
