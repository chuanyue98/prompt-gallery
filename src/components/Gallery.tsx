'use client';

import React, { useState, useEffect } from 'react';

interface GalleryItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  mediaPath: string;
  media: { type: string; src: string; cover: string }[];
  content: string;
  model?: string;
  seed?: string | number;
}

import ContributeModal from './ContributeModal';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'video' | 'image'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isContributeOpen, setIsContributeOpen] = useState(false);

  // ... (previous logic)

  return (
    <div className="container mx-auto px-6">
      {/* 搜索与导航控制面板 */}
      <div className="max-w-4xl mx-auto mb-16 space-y-6">
        <div className="relative group">
          {/* ... */}
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 w-fit mx-auto">
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
            {(['all', 'video', 'image'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-8 py-2.5 rounded-xl font-bold transition-all text-sm tracking-wide ${
                  category === cat 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat === 'all' ? '全部作品' : cat === 'video' ? '动态视频' : '精美图片'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsContributeOpen(true)}
            className="px-8 py-3.5 rounded-2xl bg-white text-black font-black text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            + 我要投稿
          </button>
        </div>
      </div>

      <ContributeModal isOpen={isContributeOpen} onClose={() => setIsContributeOpen(false)} />

      {/* 画廊网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredItems.map(item => (
          <div key={item.slug} className="group relative">
            {/* 卡片背景阴影效果 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] opacity-0 group-hover:opacity-20 blur-xl transition duration-500" />
            
            <div className="relative h-full bg-[#0F0F0F] rounded-[2rem] overflow-hidden border border-white/5 flex flex-col transition-all duration-500 hover:-translate-y-2">
              {/* 媒体预览区 */}
              <div 
                className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                onClick={() => setSelectedItem(item)}
              >
                <img 
                  src={`${item.mediaPath}${item.media[0].cover}`} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {item.media[0].type === 'video' && (
                  <video 
                    src={`${item.mediaPath}${item.media[0].src}`}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    muted loop onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                )}
                {/* 视频标识 */}
                {item.media[0].type === 'video' && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-tighter border border-white/10">
                    Motion
                  </div>
                )}
              </div>

              {/* 内容区 */}
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item.content, item.slug); }}
                    className={`shrink-0 ml-4 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      copiedSlug === item.slug 
                        ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {copiedSlug === item.slug ? 'SUCCESS' : 'COPY'}
                  </button>
                </div>
                
                <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-auto pt-6 border-t border-white/5 flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full group-hover:border-white/10 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 详情弹窗 (Modal) */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl transition-all animate-in fade-in duration-300"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-6xl max-h-[85vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)]" 
            onClick={e => e.stopPropagation()}
          >
            {/* 左侧：大屏媒体 */}
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative border-r border-white/5">
              {selectedItem.media[0].type === 'video' ? (
                <video src={`${selectedItem.mediaPath}${selectedItem.media[0].src}`} className="w-full h-full object-contain" controls autoPlay loop />
              ) : (
                <img src={`${selectedItem.mediaPath}${selectedItem.media[0].cover}`} className="w-full h-full object-contain" alt={selectedItem.title} />
              )}
            </div>
            
            {/* 右侧：精美详情 */}
            <div className="w-full md:w-2/5 p-12 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white leading-none">{selectedItem.title}</h2>
                  <p className="text-blue-500 text-xs font-black uppercase tracking-[0.2em]">Source Code Available</p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors border border-white/10">✕</button>
              </div>
              
              <div className="mb-10 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 block">Perspective</label>
                <p className="text-slate-300 text-base leading-relaxed">{selectedItem.description}</p>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">Prompt Syntax</label>
                  <button 
                    onClick={() => copyToClipboard(selectedItem.content, 'modal')}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${
                      copiedSlug === 'modal' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10'
                    }`}
                  >
                    {copiedSlug === 'modal' ? 'Copied' : 'Instant Copy'}
                  </button>
                </div>
                <div className="relative group/code">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover/code:opacity-100 transition duration-500" />
                  <div className="relative bg-black border border-white/10 rounded-2xl p-6 text-slate-300 text-sm font-mono whitespace-pre-wrap leading-loose ring-1 ring-white/5">
                    {selectedItem.content.replace(/###.*?\n/g, '').trim()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block">Engine</label>
                  <p className="text-white font-bold text-sm">{selectedItem.model || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block">Static Seed</label>
                  <p className="text-white font-mono text-sm">{selectedItem.seed || 'Auto'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-8">
                {selectedItem.tags.map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
