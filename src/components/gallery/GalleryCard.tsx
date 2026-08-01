'use client';

import React from 'react';
import type { GalleryItem } from '@/types/gallery';
import {
  getGalleryMediaUrl,
  getPrimaryMediaType,
  isVideoAsset,
  safelyPlayVideo,
} from '@/lib/gallery';
import { IconCopy, IconHeart, IconHeartFilled } from '@/components/icons';
import { useVideoPreview } from '@/lib/hooks/useVideoPreview';

interface GalleryCardProps {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
  onCopy: (text: string, slug: string) => void;
  isCopied: boolean;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = React.memo(({
  item,
  onSelect,
  onCopy,
  isCopied,
  isFavorite,
  onToggleFavorite,
}) => {
  const coverUrl = getGalleryMediaUrl(item, 'cover');
  const srcUrl = getGalleryMediaUrl(item, 'src');
  const primaryMediaType = getPrimaryMediaType(item);
  const isVideo = primaryMediaType === 'video' || (!primaryMediaType && isVideoAsset(srcUrl));
  const videoRef = useVideoPreview(isVideo);
  // 左上角常驻着「视频 / N 图」徽章，hover 出现的模型名要往下让一行，否则会被压住。
  const hasMediaBadge = isVideo || item.media.length > 1;

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

        {isVideo ? <div className="video-badge">视频</div> : null}
        {!isVideo && item.media.length > 1 ? <div className="video-badge">{item.media.length} 图</div> : null}

        <div className="card-overlay">
          <div className={`card-overlay-top${hasMediaBadge ? ' has-media-badge' : ''}`}>
            {item.model ? (
              <div data-testid={`model-badge-${item.slug}`} className="model-tag">{item.model}</div>
            ) : <span />}
            <button
              type="button"
              aria-label={isFavorite ? `取消收藏 ${item.slug}` : `收藏 ${item.slug}`}
              aria-pressed={isFavorite}
              data-testid={`favorite-toggle-${item.slug}`}
              className={`favorite-btn min-h-[36px] inline-flex items-center justify-center size-9 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'is-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.slug);
              }}
            >
              {isFavorite ? <IconHeartFilled size={14} /> : <IconHeart size={14} />}
            </button>
          </div>

          <div className="card-overlay-bottom">
            <div className="card-prompt">{item.description || item.slug}</div>
            <div className="card-foot">
              <div className="author">
                <span>{item.title || item.slug}</span>
              </div>
              <button
                aria-label={`${item.slug} 快速复制提示词`}
                className="copy-btn min-h-[44px] inline-flex items-center gap-1 px-3 py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(item.content, item.slug);
                }}
              >
                <IconCopy size={12} /> {isCopied ? '已复制 ✓' : '复制'}
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
