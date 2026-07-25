'use client';

import React from 'react';
import type { GalleryItem } from '@/types/gallery';
import {
  getGalleryMediaUrl,
  getPrimaryMediaType,
  isVideoAsset,
  safelyPlayVideo,
} from '@/lib/gallery';
import { IconCopy } from '@/components/icons';
import { useVideoPreview } from '@/lib/hooks/useVideoPreview';

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
  const primaryMediaType = getPrimaryMediaType(item);
  const isVideo = primaryMediaType === 'video' || (!primaryMediaType && isVideoAsset(srcUrl));
  const videoRef = useVideoPreview(isVideo);

  const playVideoPreview = () => {
    if (videoRef.current) {
      safelyPlayVideo(videoRef.current);
    }
  };

  const resetVideoPreview = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.pause();
    video.currentTime = 0;
  };

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
        onMouseEnter={isVideo ? playVideoPreview : undefined}
        onMouseLeave={isVideo ? resetVideoPreview : undefined}
      >
        {isVideo && srcUrl ? (
          <video
            ref={videoRef}
            src={srcUrl}
            className="h-auto w-full"
            muted
            loop
            playsInline
            preload="metadata"
            poster={coverUrl && !isVideoAsset(coverUrl) ? coverUrl : undefined}
          />
        ) : coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={item.description || item.title || item.slug} loading="lazy" decoding="async" />
        ) : (
          <div className="theme-panel flex min-h-[320px] items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            暂无媒体内容
          </div>
        )}

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
                className="copy-btn min-h-[44px] inline-flex items-center gap-1 px-3 py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(item.content, item.slug);
                }}
              >
                <IconCopy size={12} /> {isCopied ? 'SUCCESS ✓' : 'Copy'}
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
