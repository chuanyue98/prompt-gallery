'use client';

import React, { useEffect, useRef, useState } from 'react';
import ContributeModal from '@/components/gallery/ContributeModal';
import {
  applyThemeToDocument,
  DEFAULT_THEME,
  persistTheme,
  readStoredTheme,
  THEME_OPTIONS,
  type ThemeId,
} from '@/lib/theme';

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

interface NavbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
}

export default function Navbar({ search, onSearchChange }: NavbarProps = {}) {
  const [mounted, setMounted] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const searchValue = search ?? localSearch;

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
            <span className="brand-tag hidden sm:inline">/ archive</span>
          </button>

          <div className="search">
            <IconSearch />
            <input
              aria-label="搜索灵感"
              value={searchValue}
              placeholder="搜索标题、模型、标签或提示词..."
              spellCheck={false}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>

          <div className="nav-right">
            <div ref={themeMenuRef} data-testid="theme-switcher" className="relative">
              <button
                type="button"
                aria-label="主题切换选项框"
                aria-expanded={isThemeOpen}
                aria-haspopup="listbox"
                data-testid="theme-trigger"
                onClick={() => setIsThemeOpen((open) => !open)}
                className="theme-trigger-lite"
              >
                <span className="hidden sm:block">THEME</span>
                <span>{THEME_OPTIONS.find((option) => option.id === theme)?.label}</span>
                <IconChevronDown />
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
              className="primary-btn"
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
}
