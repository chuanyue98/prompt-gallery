'use client';

import React from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/types/gallery';
import { getGalleryMediaUrl, isVideoAsset, isExternalUrl, safelyPlayVideo } from '@/lib/gallery';

interface GalleryCardProps {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
  onCopy: (text: string, slug: string) => void;
  isCopied: boolean;
}

export const GalleryCard: React.FC<GalleryCardProps> = React.memo(({
  item,
  onSelect,
  onCopy,
  isCopied,
}) => {
  const coverUrl = getGalleryMediaUrl(item, 'cover');
  const srcUrl = getGalleryMediaUrl(item, 'src');
  const isVideo = item.media[0].type === 'video';

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 rounded-[1.5rem] sm:rounded-[2rem] opacity-0 blur-2xl transition duration-500 group-hover:opacity-20" style={{ background: 'var(--surface-accent)' }} />
      <div className="theme-card theme-card-hover relative flex h-full flex-col overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.02]">
        <div
          data-testid={`gallery-card-${item.slug}`}
          className="relative aspect-[4/3] cursor-pointer overflow-hidden"
          role="button"
          tabIndex={0}
          aria-label={`打开作品详情: ${item.slug}`}
          onClick={() => onSelect(item)}
          onKeyDown={(event) => {
            /* v8 ignore next 4 */
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(item);
            }
          }}
        >
          {isVideo && isVideoAsset(coverUrl) ? (
            <video src={coverUrl} className="w-full h-full object-cover" muted playsInline />
          ) : isExternalUrl(coverUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={item.description || item.slug} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" />
          ) : (
            <Image src={coverUrl} alt={item.description || item.slug} className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110" fill unoptimized />
          )}
          
          {isVideo && (
            <video
              src={srcUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
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

          {isVideo && (
            <div className="theme-panel absolute top-2 right-2 sm:top-3 sm:right-3 rounded-lg px-2 py-1 text-[8px] sm:text-[9px] font-heading font-black uppercase tracking-widest backdrop-blur-md">
              Motion
            </div>
          )}
          
          {item.model && (
            <div
              data-testid={`model-badge-${item.slug}`}
              className="theme-model-badge absolute top-2 left-2 sm:top-3 left-3 rounded-lg px-2.5 py-1 text-[7px] sm:text-[9px] font-heading font-black uppercase tracking-[0.2em] backdrop-blur-md"
            >
              {item.model}
            </div>
          )}

          <button 
            aria-label={`${item.slug} quick copy`}
            onClick={(e) => { e.stopPropagation(); onCopy(item.content, item.slug); }}
            className={`absolute bottom-2 right-2 sm:bottom-4 right-4 translate-y-4 rounded-xl px-3 py-2 text-[8px] sm:text-[10px] font-heading font-black opacity-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0 group-hover:opacity-100 ${
              isCopied ? 'theme-success-surface' : 'theme-copy-button'
            }`}
          >
            {isCopied ? 'SUCCESS ✓' : 'QUICK COPY'}
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="theme-tag rounded-full px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

GalleryCard.displayName = 'GalleryCard';

export default GalleryCard;
