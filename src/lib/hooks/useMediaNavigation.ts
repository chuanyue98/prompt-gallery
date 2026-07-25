import { useCallback, useState } from 'react';

export function useMediaNavigation(total: number, initial = 0) {
  const [index, setIndex] = useState(initial);

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

  return { index, setIndex, next, prev };
}