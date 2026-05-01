'use client';

import React from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl, getPrimaryMediaType, isVideoAsset } from '@/lib/gallery';

interface LightboxProps {
  item: GalleryItem;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose }) => {
  const mediaUrl = getGalleryMediaUrl(item, 'src');
  const coverUrl = getGalleryMediaUrl(item, 'cover');
  const primaryMediaType = getPrimaryMediaType(item);
  const isVideo = primaryMediaType === 'video' || (!primaryMediaType && isVideoAsset(mediaUrl));

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} className="max-w-full max-h-full" controls autoPlay />
          ) : (
            <Image src={coverUrl} alt={item.description} className="object-contain" fill unoptimized />
          )
        ) : (
          <div className="theme-panel flex h-full w-full items-center justify-center px-6 text-center text-sm font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
            暂无媒体内容
          </div>
        )}
      </div>
      <button className="absolute top-6 right-6 text-white text-3xl opacity-50 hover:opacity-100">✕</button>
    </div>
  );
};

export default Lightbox;
