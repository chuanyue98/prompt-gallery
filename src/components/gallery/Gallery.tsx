'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { GalleryItem } from '@/types/gallery';
import { copyToClipboard } from '@/lib/utils';

export function isExternalUrl(value: string) {
  return /^https?:\/\//.test(value);
}

export function isVideoAsset(value: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(value);
}

export function filterGalleryItems(items: GalleryItem[], search: string, category: 'all' | 'video' | 'image') {
  const normalizedSearch = search.toLowerCase();

  return items.filter((item) => {
    const matchesSearch = item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      || item.description.toLowerCase().includes(normalizedSearch);
    const matchesCategory = category === 'all' || item.media[0].type === category;

    return matchesSearch && matchesCategory;
  });
}

export function getGalleryMediaUrl(item: GalleryItem, field: 'src' | 'cover') {
  const asset = item.media?.[0]?.[field] || item.mediaUrl;

  if (!asset) {
    return '';
  }

  if (isExternalUrl(asset)) {
    return asset;
  }

  return `${item.mediaPath}${asset}`;
}

function safelyPlayVideo(video: HTMLVideoElement) {
  const playPromise = video.play();

  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Ignore codec/source failures for hover previews.
    });
  }
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'video' | 'image'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  // 删除相关状态
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // 全屏预览状态
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
        /* v8 ignore start */
        console.error("Failed to load gallery data:", error);

        if (!isMounted) {
          return;
        }

        setItems([]);
        setLoadError('内容数据加载失败，请稍后刷新重试。');
        /* v8 ignore stop */
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

  /* v8 ignore start */
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      if (isLightboxOpen) {
        document.body.classList.add('lightbox-active');
      } else {
        document.body.classList.remove('lightbox-active');
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('lightbox-active');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('lightbox-active');
    };
  }, [selectedItem, isLightboxOpen]);
  /* v8 ignore stop */

  const handleCopy = async (text: string, slug: string) => {
    if (await copyToClipboard(text)) {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleDeleteRequest = async (item: GalleryItem) => {
    if (!deleteReason.trim()) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/contribute?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: item.slug,
          type: item.media[0].type,
          reason: deleteReason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '删除申请提交失败');
      }

      setDeleteSuccess(true);
      setDeleteReason('');
      
      // 3秒后关闭弹窗并重置状态
      setTimeout(() => {
        setSelectedItem(null);
        setDeleteSuccess(false);
        setShowDeleteForm(false);
      }, 3000);
    } catch (error) {
      console.error('Delete Request Error:', error);
      alert(error instanceof Error ? error.message : '提交失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = filterGalleryItems(items, search, category);

  const Lightbox = ({ item, onClose }: { item: GalleryItem, onClose: () => void }) => (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {item.media[0].type === 'video' ? (
          <video src={getGalleryMediaUrl(item, 'src')} className="max-w-full max-h-full" controls autoPlay />
        ) : (
          <Image src={getGalleryMediaUrl(item, 'cover')} alt={item.description} className="object-contain" fill unoptimized />
        )}
      </div>
      <button className="absolute top-6 right-6 text-white text-3xl opacity-50 hover:opacity-100">✕</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6">
      <div className="mx-auto mb-10 max-w-3xl space-y-4">
        <div className="relative group">
          <input
            data-testid="gallery-search"
            type="text"
            placeholder="搜索灵感..."
            onChange={(e) => setSearch(e.target.value)}
            className="theme-input w-full rounded-[1.75rem] py-4 pr-5 pl-13 backdrop-blur-md"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
        </div>

        <div className="theme-panel mx-auto flex w-fit justify-center rounded-[1.5rem] p-1.5 backdrop-blur-md" data-testid="gallery-category-switcher">
          {(['all', 'video', 'image'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-[1rem] px-6 py-2 text-xs font-bold uppercase tracking-[0.18em] sm:px-8 sm:text-sm ${
                category === cat ? 'theme-chip-active' : 'theme-chip'
              }`}
            >
              {cat === 'all' ? '全部' : cat === 'video' ? '视频' : '图片'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 max-[350px]:grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
        {filteredItems.map(item => (
          <div key={item.slug} className="group relative">
            <div className="absolute -inset-0.5 rounded-[1.5rem] sm:rounded-[2rem] opacity-0 blur-xl transition duration-500 group-hover:opacity-30" style={{ background: 'var(--surface-accent)' }} />
            <div className="theme-card theme-card-hover relative flex h-full flex-col overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-500">
              <div
                data-testid={`gallery-card-${item.slug}`}
                className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                role="button"
                tabIndex={0}
                aria-label={`打开作品详情: ${item.slug}`}
                onClick={() => setSelectedItem(item)}
                onKeyDown={(event) => {
                  /* v8 ignore start */
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedItem(item);
                  }
                  /* v8 ignore stop */
                }}
              >
                {item.media[0].type === 'video' && isVideoAsset(getGalleryMediaUrl(item, 'cover')) ? (
                  <video src={getGalleryMediaUrl(item, 'cover')} className="w-full h-full object-cover" muted playsInline />
                ) : isExternalUrl(getGalleryMediaUrl(item, 'cover')) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getGalleryMediaUrl(item, 'cover')} alt={item.description || item.slug} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <Image src={getGalleryMediaUrl(item, 'cover')} alt={item.description || item.slug} className="object-cover transition-transform duration-700 group-hover:scale-110" fill unoptimized />
                )}
                {item.media[0].type === 'video' && (
                  <video
                    src={getGalleryMediaUrl(item, 'src')}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    muted
                    loop
                    onMouseEnter={(e) => {
                      safelyPlayVideo(e.currentTarget);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                    }}
                  />
                )}
                {item.media[0].type === 'video' && <div className="theme-panel absolute top-2 right-2 sm:top-3 sm:right-3 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-tighter">Motion</div>}
                
                {/* 模型标签：左上角 */}
                {item.model && (
                  <div
                    data-testid={`model-badge-${item.slug}`}
                    className="theme-model-badge absolute top-2 left-2 sm:top-3 sm:left-3 rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] backdrop-blur-md"
                  >
                    {item.model}
                  </div>
                )}

                {/* 快捷复制按钮：仅在悬停时显示 */}
                <button 
                  aria-label={`${item.slug} quick copy`}
                  onClick={(e) => { e.stopPropagation(); handleCopy(item.content, item.slug); }}
                  className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 translate-y-2 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-[7px] sm:text-[9px] font-bold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 ${
                    copiedSlug === item.slug ? 'theme-success-surface' : 'theme-copy-button'
                  }`}
                >
                  {copiedSlug === item.slug ? 'SUCCESS' : 'QUICK COPY'}
                </button>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {item.tags.slice(0, 3).map(tag => <span key={tag} className="theme-tag rounded-full px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em]">{tag}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && loadError && (
        <div className="theme-danger-button mt-10 rounded-[2rem] px-6 py-5 text-center text-sm">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && filteredItems.length === 0 && (
        <div className="theme-panel mt-10 rounded-[2rem] px-6 py-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">No Results</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {items.length === 0 ? '当前还没有可展示的内容。' : '没有匹配当前筛选条件的内容。'}
          </p>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => { setSelectedItem(null); setShowDeleteForm(false); setIsLightboxOpen(false); }}>
          <div className="theme-modal flex h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[3rem] md:flex-row" onClick={e => e.stopPropagation()}>
              <div 
                className="relative flex w-full items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface-panel-strong)_88%,black)] md:w-3/5 shrink-0 aspect-square sm:aspect-auto sm:min-h-[400px] max-h-[35vh] sm:max-h-none cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              >
                {selectedItem.media[0].type === 'video' ? (
                  <video src={getGalleryMediaUrl(selectedItem, 'src')} className="w-full h-full object-contain" controls autoPlay loop onClick={(e) => e.stopPropagation()} />
              ) : isExternalUrl(getGalleryMediaUrl(selectedItem, 'cover')) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getGalleryMediaUrl(selectedItem, 'cover')} className="w-full h-full object-contain" alt={selectedItem.description || selectedItem.slug} />
              ) : (
                <Image src={getGalleryMediaUrl(selectedItem, 'cover')} className="object-contain" alt={selectedItem.description || selectedItem.slug} fill unoptimized />
              )}
              <div className="absolute bottom-4 right-4 rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md sm:hidden">
                🔍
              </div>
            </div>
            <div className="w-full md:w-2/5 flex flex-col p-6 sm:p-8 lg:p-10 overflow-hidden">
              <div className="flex justify-between items-start gap-4 mb-6 shrink-0">
                <div className="flex flex-wrap gap-2">
                  {selectedItem.model && (
                    <span className="theme-model-badge rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
                      {selectedItem.model}
                    </span>
                  )}
                  {selectedItem.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="theme-tag rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em]">
                      {tag}
                    </span>
                  ))}
                </div>
                <button aria-label="关闭详情弹层" onClick={() => { setSelectedItem(null); setShowDeleteForm(false); }} className="theme-secondary-button flex h-11 w-11 items-center justify-center rounded-full shrink-0">✕</button>
              </div>
              
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-8">
                  <p className="text-base leading-relaxed text-[var(--text-secondary)]">{selectedItem.description}</p>
                </div>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">提示词 (Prompt)</h4>
                    <button aria-label="复制详情提示词" onClick={() => handleCopy(selectedItem.content, 'modal')} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase transition-all ${copiedSlug === 'modal' ? 'theme-success-surface' : 'theme-copy-button'}`}>
                      {copiedSlug === 'modal' ? 'Copied ✓' : 'Copy Prompt'}
                    </button>
                  </div>
                  <div className="relative group/code">
                    <div className="absolute -inset-1 rounded-2xl opacity-15 blur" style={{ background: 'var(--surface-accent)' }} />
                    <div className="theme-panel-strong relative max-h-[300px] sm:max-h-[400px] overflow-y-auto rounded-2xl p-5 sm:p-6 text-sm font-mono whitespace-pre-wrap leading-loose text-[var(--text-primary)] custom-scrollbar">
                      {selectedItem.content.replace(/[\s\S]*?###[^\n]*\n?/, '').trim()}
                    </div>
                  </div>
                </div>

                {selectedItem.sourceUrl && (
                  <div className="mb-10">
                    <a
                      href={selectedItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="theme-secondary-button inline-flex h-12 items-center justify-center rounded-2xl px-6 py-3 text-sm font-bold w-full md:w-auto"
                    >
                      查看来源 (VIEW SOURCE)
                    </a>
                  </div>
                )}
                
                {/* 申请下架入口 */}
                <div className="mt-4 border-t border-[var(--border-soft)] pt-6 pb-2">
                  {deleteSuccess ? (
                    <div className="theme-success-surface flex items-center justify-center rounded-2xl py-6 animate-in zoom-in-95 duration-500">
                      <div className="text-center">
                        <span className="mb-1 block text-sm font-black uppercase tracking-widest">✅ 申请已提交</span>
                        <p className="text-[10px] opacity-80">GitHub PR 已创建，请等待管理员审核</p>
                      </div>
                    </div>
                  ) : !showDeleteForm ? (
                    <div className="text-right">
                      <button
                        onClick={() => setShowDeleteForm(true)}
                        className="cursor-pointer min-h-[44px] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--danger-text)]"
                      >
                        申请下架 (TAKE DOWN)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">申请下架原因</label>
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text" 
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="例如：图片失效、侵权..."
                          className="theme-input w-full rounded-xl px-4 py-3 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isDeleting || !deleteReason.trim()}
                            onClick={() => handleDeleteRequest(selectedItem)}
                            className="theme-danger-button flex-grow h-11 rounded-xl px-4 py-2 text-[10px] font-black uppercase disabled:opacity-50"
                          >
                            {isDeleting ? '提交中' : '确认申请'}
                          </button>
                          <button
                            onClick={() => { setShowDeleteForm(false); setDeleteReason(''); }}
                            className="theme-secondary-button h-11 rounded-xl px-4 py-2 text-[10px] font-black uppercase"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedItem && isLightboxOpen && (
        <Lightbox item={selectedItem} onClose={() => setIsLightboxOpen(false)} />
      )}
    </div>
  );
}
