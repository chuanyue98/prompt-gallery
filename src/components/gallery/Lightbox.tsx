'use client';

import React from 'react';
import { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl, getPrimaryMediaType, isVideoAsset } from '@/lib/gallery';

interface LightboxProps {
  item: GalleryItem;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const currentMedia = item.media[currentIndex] || item.media[0];
  const mediaUrl = getGalleryMediaUrl(item, 'src', currentIndex);
  const coverUrl = getGalleryMediaUrl(item, 'cover', currentIndex);
  const isVideo = currentMedia?.type === 'video' || (!currentMedia?.type && isVideoAsset(mediaUrl));

  const hasMultipleMedia = item.media.length > 1;

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % item.media.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + item.media.length) % item.media.length);
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {mediaUrl ? (
          isVideo ? (
            <video key={mediaUrl} src={mediaUrl} className="max-w-full max-h-full" controls autoPlay />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={mediaUrl} src={coverUrl} alt={item.description || item.title || item.slug} className="max-w-full max-h-full object-contain" />
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
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextMedia}
              aria-label="Next media"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-white backdrop-blur-md">
              {currentIndex + 1} / {item.media.length}
            </div>
          </>
        )}
      </div>
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-3xl opacity-50 hover:opacity-100 z-[210]"
      >
        ✕
      </button>
    </div>
  );
};

export default Lightbox;
