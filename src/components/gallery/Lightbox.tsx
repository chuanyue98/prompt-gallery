'use client';

import React from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl } from '@/lib/gallery';

interface LightboxProps {
  item: GalleryItem;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose }) => {
  return (
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
};

export default Lightbox;
