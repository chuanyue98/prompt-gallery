'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { GalleryItem } from '@/types/gallery';
import { copyToClipboard } from '@/lib/utils';

function isExternalUrl(value: string) {
  return /^https?:\/\//.test(value);
}

function isVideoAsset(value: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(value);
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'video' | 'image'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGalleryData() {
      try {
        const response = await fetch('/gallery-data.json');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as GalleryItem[];

        if (!isMounted) {
          return;
        }

        setItems(data);
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load gallery data:", error);

        if (!isMounted) {
          return;
        }

        setItems([]);
        setLoadError('内容数据加载失败，请稍后刷新重试。');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGalleryData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = async (text: string, slug: string) => {
    if (await copyToClipboard(text)) {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || item.media[0].type === category;
    return matchesSearch && matchesCategory;
  });

  const getMediaUrl = (item: GalleryItem, field: 'src' | 'cover') => {
    const asset = item.mediaUrl || item.media[0][field];

    if (isExternalUrl(asset)) {
      return asset;
    }

    return `${item.mediaPath}${asset}`;
  };

  return (
    <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
      <div className="max-w-4xl mx-auto mb-16 space-y-6">
        <div className="relative group">
          <input type="text" placeholder="搜索灵感..." onChange={(e) => setSearch(e.target.value)} className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-md transition-all" />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        </div>

        <div className="flex justify-center p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit mx-auto backdrop-blur-md">
          {(['all', 'video', 'image'] as const).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-8 py-2.5 rounded-xl font-bold transition-all text-sm ${category === cat ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {cat === 'all' ? '全部' : cat === 'video' ? '视频' : '图片'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredItems.map(item => (
          <div key={item.slug} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] opacity-0 group-hover:opacity-20 blur-xl transition duration-500" />
            <div className="relative h-full bg-[#0F0F0F] rounded-[2rem] overflow-hidden border border-white/5 flex flex-col transition-all duration-500 hover:-translate-y-2 shadow-2xl">
              <div className="relative aspect-[4/3] cursor-pointer overflow-hidden" onClick={() => setSelectedItem(item)}>
                {item.media[0].type === 'video' && isVideoAsset(getMediaUrl(item, 'cover')) ? (
                  <video src={getMediaUrl(item, 'cover')} className="w-full h-full object-cover" muted playsInline />
                ) : isExternalUrl(getMediaUrl(item, 'cover')) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getMediaUrl(item, 'cover')} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <Image src={getMediaUrl(item, 'cover')} alt={item.title} className="object-cover transition-transform duration-700 group-hover:scale-110" fill unoptimized />
                )}
                {item.media[0].type === 'video' && (
                  <video
                    src={getMediaUrl(item, 'src')}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    muted
                    loop
                    onMouseEnter={(e) => {
                      void e.currentTarget.play();
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                    }}
                  />
                )}
                {item.media[0].type === 'video' && <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-tighter border border-white/10">Motion</div>}
                
                {/* 模型标签：左上角 */}
                {item.model && (
                  <div className="absolute top-4 left-4 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-white/5">
                    {item.model}
                  </div>
                )}

                {/* 快捷复制按钮：仅在悬停时显示 */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopy(item.content, item.slug); }}
                  className={`absolute bottom-4 right-4 px-4 py-2 rounded-xl text-[10px] font-bold backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 border ${copiedSlug === item.slug ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-black/50 text-white border-white/20 hover:bg-white hover:text-black'}`}
                >
                  {copiedSlug === item.slug ? 'SUCCESS' : 'QUICK COPY'}
                </button>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 leading-tight mb-3 cursor-pointer" onClick={() => setSelectedItem(item)}>{item.title}</h3>
                <div className="mt-auto pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
                  {item.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-white/5 text-slate-500 text-[9px] font-bold uppercase rounded-full border border-white/5">{tag}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && loadError && (
        <div className="mt-10 rounded-[2rem] border border-red-500/20 bg-red-500/10 px-6 py-5 text-center text-sm text-red-200">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && filteredItems.length === 0 && (
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">No Results</p>
          <p className="mt-3 text-sm text-slate-400">
            {items.length === 0 ? '当前还没有可展示的内容。' : '没有匹配当前筛选条件的内容。'}
          </p>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-6xl max-h-[85vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative border-r border-white/5">
              {selectedItem.media[0].type === 'video' ? (
                <video src={getMediaUrl(selectedItem, 'src')} className="w-full h-full object-contain" controls autoPlay loop />
              ) : isExternalUrl(getMediaUrl(selectedItem, 'cover')) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getMediaUrl(selectedItem, 'cover')} className="w-full h-full object-contain" alt={selectedItem.title} />
              ) : (
                <Image src={getMediaUrl(selectedItem, 'cover')} className="object-contain" alt={selectedItem.title} fill unoptimized />
              )}
            </div>
            <div className="w-full md:w-2/5 p-12 overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white leading-none">{selectedItem.title}</h2>
                  <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Source Code Available</p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white border border-white/10">✕</button>
              </div>
              <div className="mb-10"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 block">Perspective</label><p className="text-slate-300 text-base leading-relaxed">{selectedItem.description}</p></div>
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Syntax</label>
                  <button onClick={() => handleCopy(selectedItem.content, 'modal')} className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${copiedSlug === 'modal' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'text-blue-400 border-blue-500/30'}`}>{copiedSlug === 'modal' ? 'Copied' : 'Instant Copy'}</button>
                </div>
                <div className="relative group/code">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-20" />
                  <div className="relative bg-black border border-white/10 rounded-2xl p-6 text-slate-300 text-sm font-mono whitespace-pre-wrap leading-loose ring-1 ring-white/5">{selectedItem.content.replace(/###.*?\n/g, '').trim()}</div>
                </div>
              </div>
              {selectedItem.sourceUrl && (
                <div className="mb-10">
                  <a
                    href={selectedItem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-300 transition-all hover:border-blue-400 hover:bg-blue-500/20 hover:text-white"
                  >
                    查看来源
                  </a>
                </div>
              )}
              <div className="grid grid-cols-1 gap-8 py-8 border-t border-white/5">
                <div><label className="text-[9px] text-slate-600 uppercase block tracking-widest mb-1">Engine</label><p className="text-white font-bold">{selectedItem.model || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

