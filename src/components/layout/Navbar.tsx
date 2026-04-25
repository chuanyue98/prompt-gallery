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

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    // 延迟状态更新以避免 Hydration 冲突和 Lint 报错
    const timer = setTimeout(() => {
      setMounted(true);
      const stored = readStoredTheme();
      setTheme(stored);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mounted) {
      applyThemeToDocument(theme);
    }
  }, [theme, mounted]);

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

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isThemeOpen]);

  const handleThemeChange = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
    setIsThemeOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface-panel)_92%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-18 sm:h-20 max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-6">
          {/* Logo */}
          <div className="group flex cursor-pointer items-center gap-2 sm:gap-4" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="theme-panel flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[1.2rem] sm:rounded-[1.6rem] border border-[color-mix(in_srgb,var(--border-soft)_60%,transparent)] bg-[color-mix(in_srgb,var(--surface-panel-strong)_78%,transparent)] shadow-[var(--shadow-ambient)] transition-all duration-500 group-hover:scale-105 group-hover:rotate-6">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[radial-gradient(circle_at_30%_30%,var(--accent),transparent_80%)] shadow-[0_0_15px_rgba(var(--accent),0.2)]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-heading text-[0.95rem] sm:text-[1.1rem] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                Prompt <span className="hidden xs:inline">Gallery</span>
              </span>
              <span className="mt-1.5 hidden sm:block text-[9px] font-heading font-black tracking-[0.3em] text-[var(--text-muted)] opacity-60">
                INSPIRATION ARCHIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div
              ref={themeMenuRef}
              data-testid="theme-switcher"
              className="relative"
            >
              <button
                type="button"
                aria-label="主题切换选项框"
                aria-expanded={isThemeOpen}
                aria-haspopup="listbox"
                data-testid="theme-trigger"
                onClick={() => setIsThemeOpen((open) => !open)}
                className="theme-option-trigger flex min-w-fit sm:min-w-[12rem] items-center justify-between gap-3 rounded-[1.1rem] sm:rounded-[1.4rem] px-4 sm:px-5 py-2.5 sm:py-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="min-w-0 text-left">
                  <p className="hidden sm:block font-heading text-[8px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] opacity-70">
                    THEME
                  </p>
                  <p className="truncate pt-1 font-heading text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">
                    <span className="sm:hidden">✨ </span>
                    {THEME_OPTIONS.find((option) => option.id === theme)?.label}
                  </p>
                </div>
                <span className={`text-[10px] text-[var(--text-muted)] transition-transform duration-300 ${isThemeOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {isThemeOpen && (
                <div
                  role="listbox"
                  aria-label="主题列表"
                  data-testid="theme-options"
                  className="theme-option-list absolute top-[calc(100%+0.75rem)] right-0 min-w-[15rem] sm:min-w-[16rem] rounded-[1.5rem] p-2.5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
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
                        className={`theme-option-item flex w-full items-start justify-between rounded-[1.1rem] px-4 py-3 text-left transition-all duration-200 ${
                          isActive ? 'theme-option-item-active' : 'hover:translate-x-1'
                        }`}
                      >
                        <span className="pr-3">
                          <span className="block font-heading text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
                            {option.label}
                          </span>
                          <span className="mt-1 block text-[9px] sm:text-[10px] font-medium leading-relaxed text-[var(--text-muted)] opacity-80">
                            {option.description}
                          </span>
                        </span>
                        {isActive && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[8px] text-[var(--text-contrast)] shadow-[0_0_10px_rgba(var(--accent),0.4)] animate-in zoom-in duration-300">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsContributeOpen(true)}
              className="theme-primary-button relative overflow-hidden flex h-10 sm:h-auto items-center gap-2 rounded-[1.1rem] sm:rounded-[1.3rem] px-4 sm:px-8 py-3 sm:py-3.5 font-heading text-[10px] sm:text-[11px] font-black tracking-[0.25em] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="sm:hidden text-lg">+</span>
              <span className="hidden sm:inline relative z-10">我要投稿</span>
            </button>
          </div>
        </div>
      </nav>

      <ContributeModal isOpen={isContributeOpen} onClose={() => setIsContributeOpen(false)} />
    </>
  );
}
