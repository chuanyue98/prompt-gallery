import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'prompt-gallery-favorites';

let cachedFavorites: Set<string> | null = null;
const listeners = new Set<(favorites: Set<string>) => void>();

function readFromStorage(): Set<string> {
  if (cachedFavorites) return cachedFavorites;

  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    cachedFavorites = new Set(Array.isArray(arr) ? arr : []);
  } catch {
    cachedFavorites = new Set();
  }
  return cachedFavorites;
}

function writeToStorage(next: Set<string>) {
  cachedFavorites = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Ignore storage failures (quota / privacy mode).
    }
  }
  for (const listener of listeners) listener(next);
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => readFromStorage());

  useEffect(() => {
    const listener = (next: Set<string>) => setFavorites(new Set(next));
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.has(slug),
    [favorites]
  );

  const toggleFavorite = useCallback((slug: string) => {
    const next = new Set(readFromStorage());
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    writeToStorage(next);
  }, []);

  const clearFavorites = useCallback(() => {
    writeToStorage(new Set());
  }, []);

  return {
    favorites,
    favoriteCount: favorites.size,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
