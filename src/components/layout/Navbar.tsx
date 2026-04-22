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
          <div className="group flex cursor-pointer items-center gap-2 sm:gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="theme-panel flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-[1.2rem] sm:rounded-[1.5rem] border border-[color-mix(in_srgb,var(--border-soft)_60%,transparent)] bg-[color-mix(in_srgb,var(--surface-panel-strong)_78%,transparent)] shadow-[var(--shadow-ambient)] transition-transform group-hover:scale-[1.03]">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-[color-mix(in_srgb,var(--accent)_18%,transparent)] bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--accent)_26%,transparent),transparent_68%)]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[0.85rem] sm:text-[0.98rem] font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                Prompt <span className="hidden xs:inline">Gallery</span>
              </span>
              <span className="mt-1 hidden sm:block text-[8px] font-medium tracking-[0.18em] text-[var(--text-muted)]">
                灵感提示画廊
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
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
                className="theme-option-trigger flex min-w-fit sm:min-w-[11.5rem] items-center justify-between gap-2 sm:gap-3 rounded-[1rem] sm:rounded-[1.2rem] px-3 sm:px-4 py-2 sm:py-2.5"
              >
                <div className="min-w-0 text-left">
                  <p className="hidden sm:block text-[8px] font-black uppercase tracking-[0.34em] text-[var(--text-muted)]">
                    THEME
                  </p>
                  <p className="truncate pt-0.5 sm:pt-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] sm:tracking-[0.14em] text-[var(--text-primary)]">
                    <span className="sm:hidden">✨ </span>
                    {THEME_OPTIONS.find((option) => option.id === theme)?.label}
                  </p>
                </div>
                <span className={`text-[10px] text-[var(--text-muted)] transition-transform ${isThemeOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {isThemeOpen && (
                <div
                  role="listbox"
                  aria-label="主题列表"
                  data-testid="theme-options"
                  className="theme-option-list absolute top-[calc(100%+0.55rem)] right-0 min-w-[14rem] sm:min-w-[15rem] rounded-[1.2rem] sm:rounded-[1.35rem] p-2"
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
                        className={`theme-option-item flex w-full items-start justify-between rounded-[0.9rem] sm:rounded-[1rem] px-3 py-2.5 sm:py-3 text-left ${
                          isActive ? 'theme-option-item-active' : ''
                        }`}
                      >
                        <span className="pr-3">
                          <span className="block text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em]">
                            {option.label}
                          </span>
                          <span className="mt-1 block text-[9px] sm:text-[10px] leading-relaxed text-[var(--text-muted)]">
                            {option.description}
                          </span>
                        </span>
                        {isActive ? (
                          <span className="pt-0.5 text-[10px] font-black uppercase tracking-[0.22em]">
                            On
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsContributeOpen(true)}
              className="theme-primary-button flex h-9 sm:h-auto items-center gap-2 rounded-[1rem] sm:rounded-[1.1rem] px-3 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-black tracking-[0.18em] sm:tracking-[0.24em]"
            >
              <span>+</span> <span className="hidden sm:inline">我要投稿</span>
            </button>
          </div>
        </div>
      </nav>

      <ContributeModal isOpen={isContributeOpen} onClose={() => setIsContributeOpen(false)} />
    </>
  );
}
