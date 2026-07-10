'use client';

import React from 'react';
import { IconFlame } from '@/components/icons';

interface GalleryHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: 'all' | 'video' | 'image';
  onCategoryChange: (cat: 'all' | 'video' | 'image') => void;
  totalCount?: number;
  filteredCount?: number;
}

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'video', label: '视频' },
  { id: 'image', label: '图片' },
] as const;

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  totalCount,
  filteredCount,
}) => {
  const count = filteredCount ?? totalCount ?? 0;

  return (
    <div className="catstrip">
      <div className="cats" data-testid="gallery-category-switcher">
        <span className="cat trending on" aria-label="Trending collection">
          <IconFlame size={13} /> Trending
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`cat ${category === cat.id ? 'on' : ''}`}
          >
            {cat.label}
          </button>
        ))}
        <div className="cat-divider" />
        <div className="search search-inline">
          <input
            data-testid="gallery-search"
            aria-label="筛选图库内容"
            type="text"
            value={search}
            placeholder="搜索灵感 (SEARCH INSPIRATION)..."
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="catstrip-right">
        <span className="counter">{count.toLocaleString()} prompts</span>
      </div>
    </div>
  );
};

export default GalleryHeader;
