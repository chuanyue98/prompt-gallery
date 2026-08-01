'use client';

import React from 'react';
import { IconFlame, IconHeart, IconHeartFilled } from '@/components/icons';
import type { CategoryFilter } from '@/lib/hooks/useUrlState';

interface GalleryHeaderProps {
  category: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (favs: boolean) => void;
  totalCount?: number;
  filteredCount?: number;
}

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'video', label: '视频' },
  { id: 'image', label: '图片' },
];

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  category,
  onCategoryChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  totalCount,
  filteredCount,
}) => {
  const count = filteredCount ?? totalCount ?? 0;

  return (
    <div className="catstrip">
      <div className="cats" data-testid="gallery-category-switcher">
        <span className="cat trending on" aria-label="热门合集">
          <IconFlame size={13} /> 热门
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`cat ${category === cat.id ? 'on' : ''} min-h-[44px]`}
          >
            {cat.label}
          </button>
        ))}
        <div className="cat-divider" />
        <button
          type="button"
          onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
          aria-pressed={favoritesOnly}
          data-testid="favorites-filter-toggle"
          className={`cat min-h-[44px] ${favoritesOnly ? 'on fav-active' : ''}`}
        >
          {favoritesOnly ? <IconHeartFilled size={13} /> : <IconHeart size={13} />}
          收藏
        </button>
      </div>

      <div className="catstrip-right">
        <span className="counter">{count.toLocaleString()} 个作品</span>
      </div>
    </div>
  );
};

export default GalleryHeader;
