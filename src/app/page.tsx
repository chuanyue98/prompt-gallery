'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Navbar, { type NavbarHandle } from '@/components/layout/Navbar';
import Gallery from '@/components/gallery/Gallery';
import { ToastContainer } from '@/components/ui/Toast';
import { ShortcutsPanel } from '@/components/ui/ShortcutsPanel';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useUrlState } from '@/lib/hooks/useUrlState';

export default function Home() {
  // 搜索词由 useUrlState 统一持有，Gallery 通过同一个共享状态读取，
  // 这样搜索条件才能真正同步进 URL。
  const { search, setSearch } = useUrlState();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navbarRef = useRef<NavbarHandle>(null);

  const shortcutHandlers = useMemo(() => ({
    // 快捷键面板打开时焦点被 focus trap 锁在面板内，
    // 此时再把焦点拽去搜索框会和 trap 打架。
    onSearchFocus: () => {
      if (shortcutsOpen) return;
      navbarRef.current?.focusSearch();
    },
    onToggleShortcuts: () => setShortcutsOpen((open) => !open),
  }), [shortcutsOpen]);

  useKeyboardShortcuts(shortcutHandlers);

  const handleCloseShortcuts = useCallback(() => setShortcutsOpen(false), []);
  const handleOpenShortcuts = useCallback(() => setShortcutsOpen(true), []);

  return (
    <main className="relative min-h-screen overflow-x-hidden text-[var(--text-primary)]">
      <Navbar ref={navbarRef} search={search} onSearchChange={setSearch} onToggleShortcuts={handleOpenShortcuts} />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]" style={{
        backgroundImage:
          'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative z-10 pt-24">
        <Gallery />
      </div>
      <ToastContainer />
      <ShortcutsPanel isOpen={shortcutsOpen} onClose={handleCloseShortcuts} />
    </main>
  );
}
