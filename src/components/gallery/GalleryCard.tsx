'use client';

import React from 'react';
import type { GalleryItem } from '@/types/gallery';
import {
  getGalleryMediaUrl,
  getPrimaryMediaType,
  isVideoAsset,
  safelyPlayVideo,
} from '@/lib/gallery';

interface GalleryCardProps {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
  onCopy: (text: string, slug: string) => void;
  isCopied: boolean;
}

function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export const GalleryCard: React.FC<GalleryCardProps> = React.memo(({
  item,
  onSelect,
  onCopy,
  isCopied,
}) => {
  const coverUrl = getGalleryMediaUrl(item, 'cover');
  const srcUrl = getGalleryMediaUrl(item, 'src');
  const primaryMediaType = getPrimaryMediaType(item);
  const isVideo = primaryMediaType === 'video' || (!primaryMediaType && isVideoAsset(srcUrl));

  return (
    <article className="card reveal-hover">
      <div
        data-testid={`gallery-card-${item.slug}`}
        className="card-media"
        role="button"
        tabIndex={0}
        aria-label={`打开作品详情: ${item.title || item.slug}`}
        onClick={() => onSelect(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={item.description || item.title || item.slug} />
        ) : (
          <div className="theme-panel flex min-h-[320px] items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            暂无媒体内容
          </div>
        )}

        {isVideo ? (
          <video
            src={srcUrl}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            muted
            loop
            onMouseEnter={(e) => safelyPlayVideo(e.currentTarget)}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        ) : null}

        {isVideo ? <div className="video-badge">Motion</div> : null}
        {!isVideo && item.media.length > 1 ? <div className="video-badge">{item.media.length} Photos</div> : null}

        <div className="card-overlay">
          <div className="card-overlay-top">
            {item.model ? (
              <div data-testid={`model-badge-${item.slug}`} className="model-tag">{item.model}</div>
            ) : <span />}
          </div>

          <div className="card-overlay-bottom">
            <div className="card-prompt">{item.description || item.slug}</div>
            <div className="card-foot">
              <div className="author">
                <span>{item.title || item.slug}</span>
              </div>
              <button
                aria-label={`${item.slug} quick copy`}
                className="copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(item.content, item.slug);
                }}
              >
                <IconCopy /> {isCopied ? 'SUCCESS ✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

GalleryCard.displayName = 'GalleryCard';

export default GalleryCard;
