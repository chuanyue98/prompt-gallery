import { useCallback, useEffect, useState } from 'react';

export type CategoryFilter = 'all' | 'video' | 'image';

interface UrlState {
  search: string;
  category: CategoryFilter;
  favoritesOnly: boolean;
}

function readFromUrl(): UrlState {
  if (typeof window === 'undefined') {
    return { search: '', category: 'all', favoritesOnly: false };
  }

  const params = new URLSearchParams(window.location.search);
  const search = params.get('q') || '';
  const cat = params.get('cat');
  const favs = params.get('favs');

  const category: CategoryFilter = cat === 'video' || cat === 'image' ? cat : 'all';
  const favoritesOnly = favs === '1';

  return { search, category, favoritesOnly };
}

function writeToUrl(state: UrlState) {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams();
  if (state.search) params.set('q', state.search);
  if (state.category !== 'all') params.set('cat', state.category);
  if (state.favoritesOnly) params.set('favs', '1');

  const queryString = params.toString();
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  window.history.replaceState(null, '', newUrl);
}

export function useUrlState() {
  const [state, setState] = useState<UrlState>(() => readFromUrl());

  useEffect(() => {
    const handlePopState = () => {
      setState(readFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSearch = useCallback((search: string) => {
    setState((prev) => {
      const next = { ...prev, search };
      writeToUrl(next);
      return next;
    });
  }, []);

  const setCategory = useCallback((category: CategoryFilter) => {
    setState((prev) => {
      const next = { ...prev, category };
      writeToUrl(next);
      return next;
    });
  }, []);

  const setFavoritesOnly = useCallback((favoritesOnly: boolean) => {
    setState((prev) => {
      const next = { ...prev, favoritesOnly };
      writeToUrl(next);
      return next;
    });
  }, []);

  return {
    search: state.search,
    category: state.category,
    favoritesOnly: state.favoritesOnly,
    setSearch,
    setCategory,
    setFavoritesOnly,
  };
}
