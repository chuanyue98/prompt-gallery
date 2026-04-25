'use client';

import React from 'react';

interface GalleryHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: 'all' | 'video' | 'image';
  onCategoryChange: (cat: 'all' | 'video' | 'image') => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}) => {
  return (
    <div className="mx-auto mb-16 max-w-3xl space-y-6">
      <div className="relative group">
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-[var(--accent)] to-[var(--border-strong)] opacity-0 blur-xl transition duration-500 group-focus-within:opacity-20" />
        <input
          data-testid="gallery-search"
          type="text"
          value={search}
          placeholder="搜索灵感 (SEARCH INSPIRATION)..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="theme-input relative w-full rounded-[1.75rem] py-5 pr-6 pl-14 font-heading text-sm font-medium tracking-wide backdrop-blur-md transition-all duration-300 focus:scale-[1.01]"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg text-[var(--text-muted)] group-focus-within:scale-110 transition-transform duration-300">🔍</span>
      </div>

      <div className="theme-panel mx-auto flex w-fit justify-center rounded-[1.5rem] p-1.5 backdrop-blur-md" data-testid="gallery-category-switcher">
        {(['all', 'video', 'image'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`rounded-[1rem] px-6 py-2.5 text-[10px] sm:px-10 sm:text-xs font-heading font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              category === cat ? 'theme-chip-active scale-105' : 'theme-chip hover:scale-105'
            }`}
          >
            {cat === 'all' ? '全部' : cat === 'video' ? '视频' : '图片'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GalleryHeader;
