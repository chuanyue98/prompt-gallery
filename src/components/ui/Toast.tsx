'use client';

import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function showToast(message: string, variant: ToastVariant = 'success', durationMs = 2800) {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(variant === 'error' ? 30 : 10); } catch {}
  }
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, durationMs);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: ToastListener = (next) => setItems(next);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex min-h-[44px] items-center rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            item.variant === 'error'
              ? 'theme-danger-button'
              : item.variant === 'info'
                ? 'theme-secondary-button'
                : 'theme-success-surface'
          }`}
          onClick={() => dismissToast(item.id)}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
