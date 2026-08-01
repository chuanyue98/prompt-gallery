'use client';

import React, { useEffect, useRef } from 'react';
import { KEYBOARD_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { IconX } from '@/components/icons';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useFocusTrap(containerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const grouped = KEYBOARD_SHORTCUTS.reduce<Record<string, typeof KEYBOARD_SHORTCUTS>>((acc, item) => {
    const scope = item.scope || '全局';
    if (!acc[scope]) acc[scope] = [];
    acc[scope].push(item);
    return acc;
  }, {});

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="键盘快捷键"
      className="theme-overlay fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="theme-modal w-full max-w-md rounded-[1.5rem] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">
            键盘快捷键
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="关闭快捷键面板"
            onClick={onClose}
            className="theme-secondary-button flex size-9 items-center justify-center rounded-full"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {Object.entries(grouped).map(([scope, items]) => (
            <div key={scope}>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {scope}
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.keys + item.description}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-[var(--text-secondary)]">{item.description}</span>
                    <kbd className="theme-secondary-button rounded-md px-2 py-0.5 text-[11px] font-mono">
                      {item.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[10px] text-[var(--text-muted)]">
          在输入框内输入时，除 Esc 外的快捷键不会触发。
        </p>
      </div>
    </div>
  );
};

export default ShortcutsPanel;
