'use client';

import React from 'react';
import type { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl, isVideoAsset } from '@/lib/gallery';
import { useMediaNavigation } from '@/lib/hooks/useMediaNavigation';
import { IconCopy, IconX, IconHeart, IconBookmark, IconArrowLeft, IconArrowRight } from '@/components/icons';

interface DetailModalProps {
  item: GalleryItem;
  onClose: () => void;
  onCopy: (text: string, slug: string) => void;
  copiedSlug: string | null;
  onLightboxOpen: () => void;
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
  const { index: currentMediaIndex, next: nextMedia, prev: prevMedia } = useMediaNavigation(item.media.length);
  const currentMedia = item.media[currentMediaIndex] || item.media[0];
  const mediaUrl = getGalleryMediaUrl(item, 'src', currentMediaIndex);
  const coverUrl = getGalleryMediaUrl(item, 'cover', currentMediaIndex);
  const tags = item.tags ?? [];
  const sourceUrl = item.sourceUrl?.trim() || '';
  const safeSourceUrl = /^https?:\/\//i.test(sourceUrl) ? sourceUrl : '';
  
  const isVideo = currentMedia?.type === 'video' || (!currentMedia?.type && isVideoAsset(mediaUrl));
  const isCopied = copiedSlug === 'modal';
  const cleanedPrompt = item.content.replace(/[\s\S]*?###[^\n]*\n?/, '').trim();
  const likes = cleanedPrompt.length * 17;
  const saves = Math.max(tags.length * 41, 12);
  const promptWordCount = cleanedPrompt.split(/\s+/).filter(Boolean).length;
  const promptParams = [
    ['Media', isVideo ? 'Video' : 'Image'],
    ['Model', item.model ?? 'Prompt'],
    ['Tags', tags.length ? tags.join(', ') : 'None'],
    ['Words', String(promptWordCount)],
  ];

  const hasMultipleMedia = item.media.length > 1;

  return (
    <div className="modal-scrim fixed inset-0 z-[120]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="关闭详情弹层" className="modal-close" onClick={onClose}>
          <IconX size={18} />
        </button>

        <div className={`modal-media group relative cursor-zoom-in ${isVideo ? 'modal-media-video' : ''}`} onClick={onLightboxOpen}>
          {mediaUrl ? (
            isVideo ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                className="h-full w-full object-contain"
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={coverUrl && !isVideoAsset(coverUrl) ? coverUrl : undefined}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={mediaUrl} src={mediaUrl} alt={item.description || item.title || item.slug} />
            )
          ) : (
            <div className="theme-panel flex h-full w-full items-center justify-center px-6 text-center text-sm font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
              暂无媒体内容
            </div>
          )}

          {hasMultipleMedia && (
            <>
              <button
                type="button"
                onClick={prevMedia}
                aria-label="Previous media"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur-md transition-all hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <IconArrowLeft size={20} />
              </button>
              <button
                type="button"
                onClick={nextMedia}
                aria-label="Next media"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur-md transition-all hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <IconArrowRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md">
                {currentMediaIndex + 1} / {item.media.length}
              </div>
            </>
          )}

          {!isVideo ? (
            <button
              type="button"
              data-testid="mobile-fullscreen-hint"
              aria-label="放大查看媒体"
              className="modal-play"
              onClick={(e) => {
                e.stopPropagation();
                onLightboxOpen();
              }}
            >
              放大查看
            </button>
          ) : null}
        </div>

        <div className="modal-side">
          <div className="modal-side-scroll">
            <div className="modal-head">
              {item.model ? <div className="model-tag">{item.model}</div> : <span />}
              <div className="modal-stats">
                <span><IconHeart size={12} /> {likes.toLocaleString()}</span>
                <span><IconBookmark size={12} /> {saves.toLocaleString()}</span>
              </div>
            </div>

            <h2 className="modal-title">{item.title || item.slug}</h2>

            <div className="modal-author">
              <div className="avatar lg">{String(item.title || item.slug).slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="aname">{item.model ?? 'Prompt Archive'}</div>
                <div className="acat">{isVideo ? 'Video' : 'Image'} / {tags[0] ?? 'Reference'}</div>
              </div>
              {safeSourceUrl ? (
                <a href={safeSourceUrl} target="_blank" rel="noreferrer" className="follow-btn">Source</a>
              ) : null}
            </div>

            <div className="prompt-block">
              <div className="block-label">
                <span>Prompt</span>
                 <span className="copy-inline">
                  <IconCopy size={14} /> Prompt Copy
                </span>
              </div>
              <p className="prompt-text">{cleanedPrompt}</p>
            </div>

            <div className="params-block">
              <div className="block-label">
                <span>Parameters</span>
              </div>
              <div className="params-grid">
                {promptParams.map(([key, value]) => (
                  <div key={key} className="param">
                    <div className="pkey">{key}</div>
                    <div className="pval">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-cta-row">
              <button
                aria-label="复制详情提示词"
                type="button"
                className={`cta primary ${isCopied ? 'theme-success-surface' : ''}`}
                onClick={() => onCopy(item.content, 'modal')}
              >
                  <IconCopy size={14} /> {isCopied ? 'COPIED ✓' : 'COPY PROMPT'}
              </button>
            </div>

            <div className="mt-auto pt-2">
              {deleteSuccess ? (
                <div className="theme-success-surface rounded-[12px] px-4 py-4 text-center">
                  <span className="block text-xs font-black uppercase tracking-[0.18em]">✅ 申请已提交</span>
                  <p className="mt-1 text-[10px] opacity-80">GitHub PR 已创建，请等待管理员审核</p>
                </div>
              ) : !showDeleteForm ? (
                <button
                  onClick={() => setShowDeleteForm(true)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]"
                >
                  申请下架 (TAKE DOWN)
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    申请下架原因
                  </label>
                  <input
                    type="text"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="例如：图片失效、侵权..."
                    className="theme-input w-full rounded-xl px-4 py-2.5 text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={isDeleting || !deleteReason.trim()}
                      onClick={() => onDeleteRequest(item)}
                      className="theme-danger-button flex-1 h-10 rounded-xl px-4 text-[10px] font-black uppercase disabled:opacity-50"
                    >
                      {isDeleting ? '提交中...' : '确认申请'}
                    </button>
                    <button
                      onClick={() => { setShowDeleteForm(false); setDeleteReason(''); }}
                      className="theme-secondary-button h-10 rounded-xl px-4 text-[10px] font-black uppercase"
                    >
                      取消
                    </button>
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
