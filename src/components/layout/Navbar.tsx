'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ContributeModal from '@/components/gallery/ContributeModal';
import {
  applyThemeToDocument,
  DEFAULT_THEME,
  persistTheme,
  readStoredTheme,
  THEME_OPTIONS,
  type ThemeId,
} from '@/lib/theme';
import { IconChevronDown, IconKeyboard, IconSearch } from '@/components/icons';

export interface NavbarHandle {
  focusSearch: () => void;
}

interface NavbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  onToggleShortcuts?: () => void;
}

const Navbar = forwardRef<NavbarHandle, NavbarProps>(function Navbar(
  { search, onSearchChange, onToggleShortcuts },
  ref
) {
  const [mounted, setMounted] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchValue = search ?? localSearch;

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setTheme(readStoredTheme());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyThemeToDocument(theme);
    }
  }, [mounted, theme]);

  useEffect(() => {
    if (!isThemeOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isThemeOpen]);

  const handleThemeChange = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
    setIsThemeOpen(false);
  };

  const handleSearchChange = (value: string) => {
    if (search === undefined) {
      setLocalSearch(value);
    }
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <>
      <nav className="topnav fixed top-0 right-0 left-0 z-[100]">
        <div className="topnav-inner">
          <button
            type="button"
            className="brand"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="brand-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="url(#pg-brand-gradient)" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3.5" fill="url(#pg-brand-gradient)" />
                <defs>
                  <linearGradient id="pg-brand-gradient" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent-2)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="brand-name">
              Prompt <span className="hidden xs:inline">Gallery</span>
            </span>
            <span className="brand-tag hidden sm:inline">/ 提示词集</span>
          </button>

          <div className="search">
            <IconSearch />
            <input
              ref={searchInputRef}
              aria-label="搜索灵感"
              value={searchValue}
              placeholder="搜索标题、模型、标签或提示词..."
              spellCheck={false}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
            <kbd className="search-kbd" aria-hidden="true">/</kbd>
          </div>

          <div className="nav-right">
            <button
              type="button"
              aria-label="键盘快捷键"
              title="键盘快捷键 (?)"
              onClick={onToggleShortcuts}
              className="theme-trigger-lite min-h-[44px]"
            >
              <IconKeyboard size={16} />
            </button>

            <div ref={themeMenuRef} data-testid="theme-switcher" className="relative">
              <button
                type="button"
                aria-label="主题切换选项框"
                aria-expanded={isThemeOpen}
                aria-haspopup="listbox"
                data-testid="theme-trigger"
                onClick={() => setIsThemeOpen((open) => !open)}
                className="theme-trigger-lite min-h-[44px]"
              >
                <span className="hidden sm:block">主题</span>
                <span>{THEME_OPTIONS.find((option) => option.id === theme)?.label}</span>
                <IconChevronDown size={16} />
              </button>

              {isThemeOpen ? (
                <div
                  role="listbox"
                  aria-label="主题列表"
                  data-testid="theme-options"
                  className="theme-option-list absolute top-[calc(100%+0.75rem)] right-0 min-w-[15rem] rounded-[16px] p-2"
                >
                  {THEME_OPTIONS.map((option) => {
                    const isActive = option.id === theme;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-theme-option={option.id}
                        onClick={() => handleThemeChange(option.id)}
                        className={`theme-option-item flex w-full items-start justify-between rounded-[12px] px-3 py-2.5 text-left ${isActive ? 'theme-option-item-active' : ''}`}
                      >
                        <span className="pr-3">
                          <span className="block text-[12px] font-medium">{option.label}</span>
                          <span className="mt-1 block text-[10px] text-[var(--text-muted)]">{option.description}</span>
                        </span>
                        {isActive ? <span>●</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="打开投稿弹层"
              onClick={() => setIsContributeOpen(true)}
              className="primary-btn min-h-[44px]"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">我要投稿</span>
            </button>
          </div>
        </div>
      </nav>

      <ContributeModal isOpen={isContributeOpen} onClose={() => setIsContributeOpen(false)} />
    </>
  );
});

export default Navbar;
