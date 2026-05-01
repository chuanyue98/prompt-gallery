'use client';

import React from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl, isExternalUrl, getPrimaryMediaType, isVideoAsset } from '@/lib/gallery';

interface DetailModalProps {
  item: GalleryItem;
  onClose: () => void;
  onCopy: (text: string, slug: string) => void;
  copiedSlug: string | null;
  onLightboxOpen: () => void;
  // Delete request related
  showDeleteForm: boolean;
  setShowDeleteForm: (show: boolean) => void;
  deleteReason: string;
  setDeleteReason: (reason: string) => void;
  onDeleteRequest: (item: GalleryItem) => void;
  isDeleting: boolean;
  deleteSuccess: boolean;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  onClose,
  onCopy,
  copiedSlug,
  onLightboxOpen,
  showDeleteForm,
  setShowDeleteForm,
  deleteReason,
  setDeleteReason,
  onDeleteRequest,
  isDeleting,
  deleteSuccess,
}) => {
  const mediaUrl = getGalleryMediaUrl(item, 'src');
  const coverUrl = getGalleryMediaUrl(item, 'cover');
  const primaryMediaType = getPrimaryMediaType(item);
  const isVideo = primaryMediaType === 'video' || (!primaryMediaType && isVideoAsset(mediaUrl));

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6 backdrop-blur-xl animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="theme-modal flex h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[3rem] md:flex-row" 
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="relative flex w-full items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface-panel-strong)_88%,black)] md:w-3/5 shrink-0 aspect-square sm:aspect-auto sm:min-h-[400px] max-h-[35vh] sm:max-h-none cursor-zoom-in"
          onClick={onLightboxOpen}
        >
          {mediaUrl ? (
            isVideo ? (
              <video src={mediaUrl} className="w-full h-full object-contain" controls autoPlay loop onClick={(e) => e.stopPropagation()} />
            ) : isExternalUrl(coverUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} className="w-full h-full object-contain" alt={item.description || item.slug} />
            ) : (
              <Image src={coverUrl} className="object-contain" alt={item.description || item.slug} fill unoptimized />
            )
          ) : (
            <div className="theme-panel flex h-full w-full items-center justify-center px-6 text-center text-sm font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
              暂无媒体内容
            </div>
          )}
          <div data-testid="mobile-fullscreen-hint" className="absolute bottom-4 right-4 rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md sm:hidden">
            🔍
          </div>
        </div>

        <div className="w-full md:w-2/5 flex flex-col p-6 sm:p-8 lg:p-10 overflow-hidden">
          <div className="flex justify-between items-start gap-4 mb-6 shrink-0">
            <div className="flex flex-wrap gap-2">
              {item.model && (
                <span className="theme-model-badge rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
                  {item.model}
                </span>
              )}
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="theme-tag rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em]">
                  {tag}
                </span>
              ))}
            </div>
            <button aria-label="关闭详情弹层" onClick={onClose} className="theme-secondary-button flex h-11 w-11 items-center justify-center rounded-full shrink-0">✕</button>
          </div>
          
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <div className="mb-8">
              <p className="text-base leading-relaxed text-[var(--text-secondary)]">{item.description}</p>
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-heading text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-80">提示词 (PROMPT ARCHIVE)</h4>
                <button 
                  aria-label="复制详情提示词" 
                  onClick={() => onCopy(item.content, 'modal')} 
                  className={`rounded-xl px-4 py-2 font-heading text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${
                    copiedSlug === 'modal' ? 'theme-success-surface shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'theme-copy-button'
                  }`}
                >
                  {copiedSlug === 'modal' ? 'COPIED ✓' : 'COPY PROMPT'}
                </button>
              </div>
              <div className="relative group/code">
                <div className="absolute -inset-1 rounded-2xl opacity-10 blur-xl transition-opacity duration-500 group-hover/code:opacity-20" style={{ background: 'var(--surface-accent)' }} />
                <div className="theme-panel-strong relative max-h-[300px] sm:max-h-[400px] overflow-y-auto rounded-2xl p-6 text-sm font-mono whitespace-pre-wrap leading-loose text-[var(--text-primary)] custom-scrollbar border-[color-mix(in_srgb,var(--border-soft)_50%,transparent)]">
                  {item.content.replace(/[\s\S]*?###[^\n]*\n?/, '').trim()}
                </div>
              </div>
            </div>

            {item.sourceUrl && (
              <div className="mb-10">
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="theme-secondary-button inline-flex h-12 items-center justify-center rounded-2xl px-8 py-4 font-heading text-[10px] font-black uppercase tracking-[0.3em] w-full md:w-auto transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent)]"
                >
                  VIEW SOURCE
                </a>
              </div>
            )}
            
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
                        onClick={() => onDeleteRequest(item)}
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
  );
};

export default DetailModal;
