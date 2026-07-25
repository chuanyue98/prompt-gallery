'use client';

import React, { useEffect, useRef } from 'react';
import { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl, isVideoAsset } from '@/lib/gallery';
import { useMediaNavigation } from '@/lib/hooks/useMediaNavigation';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { IconArrowLeft, IconArrowRight } from '@/components/icons';

interface LightboxProps {
  item: GalleryItem;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose }) => {
  const { index: currentIndex, next: nextMedia, prev: prevMedia, swipeHandlers } = useMediaNavigation(item.media.length);
  const currentMedia = item.media[currentIndex] || item.media[0];
  const mediaUrl = getGalleryMediaUrl(item, 'src', currentIndex);
  const coverUrl = getGalleryMediaUrl(item, 'cover', currentIndex);
  const isVideo = currentMedia?.type === 'video' || (!currentMedia?.type && isVideoAsset(mediaUrl));

  const hasMultipleMedia = item.media.length > 1;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useFocusTrap(containerRef, true);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && hasMultipleMedia) {
        e.preventDefault();
        nextMedia();
      } else if (e.key === 'ArrowLeft' && hasMultipleMedia) {
        e.preventDefault();
        prevMedia();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, nextMedia, prevMedia, hasMultipleMedia]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.title || item.slug || '媒体预览'}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200 cursor-zoom-out"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        {mediaUrl ? (
          isVideo ? (
            <video
              key={mediaUrl}
              src={mediaUrl}
              className="max-w-full max-h-full"
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster={coverUrl && !isVideoAsset(coverUrl) ? coverUrl : undefined}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={mediaUrl} src={mediaUrl} alt={item.description || item.title || item.slug} className="max-w-full max-h-full object-contain" loading="eager" />
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
              className="absolute left-4 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <IconArrowLeft size={24} />
            </button>
            <button
              type="button"
              onClick={nextMedia}
              aria-label="Next media"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <IconArrowRight size={24} />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-white backdrop-blur-md">
              {currentIndex + 1} / {item.media.length}
            </div>
          </>
        )}
      </div>
      <button
        ref={closeBtnRef}
        aria-label="关闭预览"
        onClick={onClose}
        className="absolute top-6 right-6 flex size-12 items-center justify-center rounded-full bg-white/10 text-white text-2xl opacity-70 hover:opacity-100 hover:bg-white/20 z-[210] transition-all"
      >
        ✕
      </button>
    </div>
  );
};

export default Lightbox;
