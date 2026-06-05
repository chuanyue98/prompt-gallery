'use client';

import React from 'react';

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

function FlameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c2 4-2 5-2 9a4 4 0 0 0 8 0c0-2-1-3-2-4 0 2-1 3-2 3 1-3-1-6-2-8z" />
      <path d="M10 14a2 2 0 1 0 4 0" />
    </svg>
  );
}

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
          <FlameIcon /> Trending
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
