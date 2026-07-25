import { useCallback, useRef, useState } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useMediaNavigation(total: number, initial = 0) {
  const [index, setIndex] = useState(initial);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (total <= 0) return;
    setIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (total <= 0) return;
    setIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) { next(); } else { prev(); }
  }, [next, prev]);

  const swipeHandlers: SwipeHandlers = { onTouchStart, onTouchEnd };
  return { index, setIndex, next, prev, swipeHandlers };
}
