import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'prompt-gallery-favorites';

const EMPTY_FAVORITES: Set<string> = new Set<string>();

let currentFavorites: Set<string> = EMPTY_FAVORITES;
const listeners = new Set<() => void>();
let initialized = false;

function readFromStorage(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeToStorage(next: Set<string>) {
  currentFavorites = next;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Ignore storage failures (quota / privacy mode).
    }
  }

  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  // 首个订阅者到来时才读 localStorage：hydration 首帧用的是 server snapshot，
  // React 随后会重新取快照并切到真实收藏，因此不会出现 mismatch。
  if (!initialized) {
    initialized = true;
    currentFavorites = readFromStorage();
  }

  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => currentFavorites;
const getServerSnapshot = () => EMPTY_FAVORITES;

/** 仅供测试使用：清空模块级缓存与订阅者。 */
export function __resetFavoritesForTests() {
  currentFavorites = EMPTY_FAVORITES;
  listeners.clear();
  initialized = false;
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback(
    (slug: string) => favorites.has(slug),
    [favorites]
  );

  const toggleFavorite = useCallback((slug: string) => {
    const next = new Set(currentFavorites);
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
