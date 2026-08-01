import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFavorites } from '@/lib/hooks/useFavorites';

const STORAGE_KEY = 'prompt-gallery-favorites';

describe('useFavorites', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty on the first render so SSR and hydration agree', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['preexisting']));

    let firstRenderCount: number | undefined;
    renderHook(() => {
      const { favoriteCount } = useFavorites();
      firstRenderCount ??= favoriteCount;
      return favoriteCount;
    });

    expect(firstRenderCount).toBe(0);
  });

  it('loads persisted favorites after mount', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['a', 'b']));

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => expect(result.current.favoriteCount).toBe(2));
    expect(result.current.isFavorite('a')).toBe(true);
    expect(result.current.isFavorite('zzz')).toBe(false);
  });

  it('toggles a slug on and off and persists it', async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favoriteCount).toBe(0));

    act(() => result.current.toggleFavorite('slug-1'));
    expect(result.current.isFavorite('slug-1')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(['slug-1']);

    act(() => result.current.toggleFavorite('slug-1'));
    expect(result.current.isFavorite('slug-1')).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  it('keeps separate consumers in sync', async () => {
    const a = renderHook(() => useFavorites());
    const b = renderHook(() => useFavorites());
    await waitFor(() => expect(a.result.current.favoriteCount).toBe(0));

    act(() => a.result.current.toggleFavorite('shared'));

    expect(b.result.current.isFavorite('shared')).toBe(true);
  });

  it('clears all favorites', async () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite('x'));
    await waitFor(() => expect(result.current.favoriteCount).toBe(1));

    act(() => result.current.clearFavorites());

    expect(result.current.favoriteCount).toBe(0);
  });

  it('recovers from corrupted storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => expect(result.current.favoriteCount).toBe(0));
  });

  it('ignores a persisted value that is not an array', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => expect(result.current.favoriteCount).toBe(0));
  });

  it('survives storage writes failing (quota / privacy mode)', async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favoriteCount).toBe(0));

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    act(() => result.current.toggleFavorite('still-works'));

    // 内存态照常更新，不能因为写盘失败就抛出去。
    expect(result.current.isFavorite('still-works')).toBe(true);
    setItem.mockRestore();
  });
});
