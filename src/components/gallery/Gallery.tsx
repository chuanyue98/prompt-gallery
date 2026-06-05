'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GalleryItem } from '@/types/gallery';
import { copyToClipboard } from '@/lib/utils';
import { filterGalleryItems, getGalleryMediaUrl, isVideoAsset } from '@/lib/gallery';

import GalleryHeader from './GalleryHeader';
import GalleryCard from './GalleryCard';
import DetailModal from './DetailModal';
import Lightbox from './Lightbox';

function Hero({
  item,
  onOpen,
  onCopy,
}: {
  item: GalleryItem | null;
  onOpen: (item: GalleryItem) => void;
  onCopy: (item: GalleryItem) => void;
}) {
  if (!item) {
    return null;
  }

  const coverUrl = getGalleryMediaUrl(item, 'cover');
  const srcUrl = getGalleryMediaUrl(item, 'src');
  const isVideo = item.media?.[0]?.type === 'video' || isVideoAsset(srcUrl);

  return (
    <section className="hero" onClick={() => onOpen(item)}>
      {isVideo && srcUrl ? (
        <video
          key={srcUrl}
          data-testid="hero-video"
          src={srcUrl}
          autoPlay
          muted
          loop
          playsInline
          poster={coverUrl && !isVideoAsset(coverUrl) ? coverUrl : undefined}
        />
      ) : coverUrl ? (
        <img data-testid="hero-image" src={coverUrl} alt={item.title || item.slug} />
      ) : null}
      <div className="hero-grad" />
      <div className="hero-content">
        <div className="hero-tag">
          <span className="dot" /> Editor&apos;s pick / This week
        </div>
        <h2 className="hero-title">{item.title || item.slug}</h2>
        <p className="hero-prompt">{item.description}</p>
        <div className="hero-row">
          <div className="author">
            <span>{item.model ?? 'Prompt'}</span>
          </div>
          <button
            type="button"
            className="hero-copy"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(item);
            }}
          >
            Copy prompt
          </button>
        </div>
      </div>
    </section>
  );
}

interface GalleryProps {
  search?: string;
  onSearchChange?: (value: string) => void;
}

export default function Gallery({ search: controlledSearch, onSearchChange }: GalleryProps = {}) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [internalSearch, setInternalSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'video' | 'image'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGalleryData() {
      try {
        const response = await fetch('/gallery-data.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as GalleryItem[];
        if (!isMounted) {
          return;
        }

        setItems(data);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to load gallery data:', error);
        if (!isMounted) {
          return;
        }

        setItems([]);
        setLoadError('内容数据加载失败，请稍后刷新重试。');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGalleryData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('detail-modal-active');
      document.body.classList.remove('lightbox-active');
      if (isLightboxOpen) {
        document.body.classList.add('lightbox-active');
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('detail-modal-active');
      document.body.classList.remove('lightbox-active');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('detail-modal-active');
      document.body.classList.remove('lightbox-active');
    };
  }, [selectedItem, isLightboxOpen]);

  const handleCopy = useCallback(async (text: string, slug: string) => {
    if (await copyToClipboard(text)) {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  }, []);

  const handleDeleteRequest = useCallback(async (item: GalleryItem) => {
    if (!deleteReason.trim()) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/contribute?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: item.slug,
          type: item.media[0].type,
          reason: deleteReason.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '删除请求提交失败');
      }

      setDeleteSuccess(true);
      setDeleteReason('');
      setTimeout(() => {
        setSelectedItem(null);
        setDeleteSuccess(false);
        setShowDeleteForm(false);
      }, 3000);
    } catch (error) {
      console.error('Delete Request Error:', error);
      alert(error instanceof Error ? error.message : '提交失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteReason]);

  const search = controlledSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const filteredItems = useMemo(() => filterGalleryItems(items, search, category), [items, search, category]);
  const heroItem = filteredItems.length > 0 ? filteredItems[0] : null;

  return (
    <div className="main">
      <Hero
        item={heroItem}
        onOpen={setSelectedItem}
        onCopy={(item) => handleCopy(item.content, item.slug)}
      />

      <GalleryHeader
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        totalCount={isLoading ? undefined : items.length}
        filteredCount={isLoading ? undefined : filteredItems.length}
      />

      {!isLoading && loadError ? (
        <div className="theme-danger-button mt-10 rounded-[2rem] px-6 py-5 text-center text-sm">
          {loadError}
        </div>
      ) : null}

      {!isLoading && !loadError && filteredItems.length === 0 ? (
        <div className="empty">
          <div className="empty-t">Nothing matches that</div>
          <div className="empty-s">{items.length === 0 ? '当前还没有可展示的内容。' : '没有匹配当前筛选条件的内容。'}</div>
        </div>
      ) : null}

      {!loadError && filteredItems.length > 0 ? (
        <div className="masonry">
          {filteredItems.map((item) => (
            <GalleryCard
              key={item.slug}
              item={item}
              onSelect={setSelectedItem}
              onCopy={handleCopy}
              isCopied={copiedSlug === item.slug}
            />
          ))}
        </div>
      ) : null}

      {selectedItem ? (
        <DetailModal
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setShowDeleteForm(false);
            setIsLightboxOpen(false);
          }}
          onCopy={handleCopy}
          copiedSlug={copiedSlug}
          onLightboxOpen={() => setIsLightboxOpen(true)}
          showDeleteForm={showDeleteForm}
          setShowDeleteForm={setShowDeleteForm}
          deleteReason={deleteReason}
          setDeleteReason={setDeleteReason}
          onDeleteRequest={handleDeleteRequest}
          isDeleting={isDeleting}
          deleteSuccess={deleteSuccess}
        />
      ) : null}

      {selectedItem && isLightboxOpen ? (
        <Lightbox item={selectedItem} onClose={() => setIsLightboxOpen(false)} />
      ) : null}
    </div>
  );
}
