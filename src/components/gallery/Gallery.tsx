'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GalleryItem } from '@/types/gallery';
import { copyToClipboard } from '@/lib/utils';
import { filterGalleryItems } from '@/lib/gallery';

import GalleryHeader from './GalleryHeader';
import GalleryCard from './GalleryCard';
import DetailModal from './DetailModal';
import Lightbox from './Lightbox';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'video' | 'image'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  // Delete related state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // Lightbox state
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

        /* v8 ignore next 3 */
        if (!isMounted) {
          return;
        }

        setItems(data);
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load gallery data:", error);

        /* v8 ignore next 3 */
        if (!isMounted) {
          return;
        }

        setItems([]);
        setLoadError('内容数据加载失败，请稍后刷新重试。');
      } finally {
        /* v8 ignore next 3 */
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
      if (isLightboxOpen) {
        document.body.classList.add('lightbox-active');
      } else {
        document.body.classList.remove('lightbox-active');
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('lightbox-active');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('lightbox-active');
    };
  }, [selectedItem, isLightboxOpen]);

  /* v8 ignore next 7 */
  const handleCopy = useCallback(async (text: string, slug: string) => {
    if (await copyToClipboard(text)) {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  }, []);

  const handleDeleteRequest = useCallback(async (item: GalleryItem) => {
    /* v8 ignore next 3 */
    if (!deleteReason.trim()) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/contribute?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: item.slug,
          type: item.media[0].type,
          reason: deleteReason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '删除申请提交失败');
      }

      setDeleteSuccess(true);
      setDeleteReason('');
      
      /* v8 ignore next 5 */
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

  const filteredItems = useMemo(() => 
    filterGalleryItems(items, search, category),
    [items, search, category]
  );

  const handleSelect = useCallback((item: GalleryItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
    setShowDeleteForm(false);
    setIsLightboxOpen(false);
  }, []);

  const handleOpenLightbox = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6">
      <GalleryHeader 
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      />

      <div className="grid grid-cols-2 max-[350px]:grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
        {filteredItems.map(item => (
          <GalleryCard 
            key={item.slug}
            item={item}
            onSelect={handleSelect}
            onCopy={handleCopy}
            isCopied={copiedSlug === item.slug}
          />
        ))}
      </div>

      {!isLoading && loadError && (
        <div className="theme-danger-button mt-10 rounded-[2rem] px-6 py-5 text-center text-sm">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && filteredItems.length === 0 && (
        <div className="theme-panel mt-10 rounded-[2rem] px-6 py-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">No Results</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {items.length === 0 ? '当前还没有可展示的内容。' : '没有匹配当前筛选条件的内容。'}
          </p>
        </div>
      )}

      {selectedItem && (
        <DetailModal 
          item={selectedItem}
          onClose={handleCloseModal}
          onCopy={handleCopy}
          copiedSlug={copiedSlug}
          onLightboxOpen={handleOpenLightbox}
          showDeleteForm={showDeleteForm}
          setShowDeleteForm={setShowDeleteForm}
          deleteReason={deleteReason}
          setDeleteReason={setDeleteReason}
          onDeleteRequest={handleDeleteRequest}
          isDeleting={isDeleting}
          deleteSuccess={deleteSuccess}
        />
      )}

      {selectedItem && isLightboxOpen && (
        <Lightbox item={selectedItem} onClose={handleCloseLightbox} />
      )}
    </div>
  );
}
