'use client';

import React, { useState } from 'react';
import ContributeModal from '@/components/gallery/ContributeModal';

export default function Navbar() {
  const [isContributeOpen, setIsContributeOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-black text-white text-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
              P
            </div>
            <span className="text-white font-black tracking-tighter text-xl group-hover:text-blue-400 transition-colors">
              PROMPT <span className="text-slate-500 font-medium">GALLERY</span>
            </span>
          </div>

          {/* Contribute Button */}
          <button 
            onClick={() => setIsContributeOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>+</span> 我要投稿
          </button>
        </div>
      </nav>

      <ContributeModal isOpen={isContributeOpen} onClose={() => setIsContributeOpen(false)} />
    </>
  );
}
