import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearchFocus?: () => void;
  onToggleShortcuts?: () => void;
  onEscape?: () => void;
}

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (INPUT_TAGS.has(target.tagName)) return true;
  return target.isContentEditable;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (handlers.onEscape) {
          handlers.onEscape();
        }
        return;
      }

      if (isEditableTarget(e.target)) return;

      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handlers.onSearchFocus?.();
        return;
      }

      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handlers.onToggleShortcuts?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}

export interface ShortcutItem {
  keys: string;
  description: string;
  scope?: string;
}

export const KEYBOARD_SHORTCUTS: ShortcutItem[] = [
  { keys: '/', description: '聚焦搜索框', scope: '全局' },
  { keys: '?', description: '显示/隐藏快捷键面板', scope: '全局' },
  { keys: 'Esc', description: '关闭弹窗 / 面板', scope: '全局' },
  { keys: '← →', description: '切换媒体（多图时）', scope: '详情/预览' },
];
