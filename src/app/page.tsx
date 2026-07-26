'use client';

import { useRef, useState } from 'react';
import Navbar, { type NavbarHandle } from '@/components/layout/Navbar';
import Gallery from '@/components/gallery/Gallery';
import { ToastContainer } from '@/components/ui/Toast';
import { ShortcutsPanel } from '@/components/ui/ShortcutsPanel';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

export default function Home() {
  const [search, setSearch] = useState('');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navbarRef = useRef<NavbarHandle>(null);

  useKeyboardShortcuts({
    onSearchFocus: () => navbarRef.current?.focusSearch(),
    onToggleShortcuts: () => setShortcutsOpen((open) => !open),
  });

  return (
    <main className="relative min-h-screen overflow-x-hidden text-[var(--text-primary)]">
      <Navbar ref={navbarRef} search={search} onSearchChange={setSearch} onToggleShortcuts={() => setShortcutsOpen(true)} />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]" style={{
        backgroundImage:
          'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative z-10 pt-24">
        <Gallery search={search} onSearchChange={setSearch} />
      </div>
      <ToastContainer />
      <ShortcutsPanel isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </main>
  );
}
