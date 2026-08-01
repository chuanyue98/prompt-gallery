import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import Home from '@/app/page';
import { useUrlState } from '@/lib/hooks/useUrlState';

const galleryItems = [
  {
    slug: 'cat-item', title: '猫', description: '一只猫', tags: ['cat'],
    model: 'M', type: 'image', mediaPath: '/data/images/cat-item/',
    media: [{ type: 'image', src: 'a.png', cover: 'a.png' }], content: '',
  },
  {
    slug: 'dog-item', title: '狗', description: '一只狗', tags: ['dog'],
    model: 'M', type: 'video', mediaPath: '/data/videos/dog-item/',
    media: [{ type: 'video', src: 'b.mp4', cover: 'b.png' }], content: '',
  },
];

function getSearchBox() {
  return document.querySelector(
    'input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]'
  ) as HTMLInputElement;
}

describe('useUrlState', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(galleryItems),
    }));
  });

  it('reads the initial state from the URL after mount', async () => {
    window.history.replaceState(null, '', '/?q=cat&cat=video&favs=1');

    const { result } = renderHook(() => useUrlState());

    await waitFor(() => expect(result.current.search).toBe('cat'));
    expect(result.current.category).toBe('video');
    expect(result.current.favoritesOnly).toBe(true);
  });

  it('ignores unknown category values', async () => {
    window.history.replaceState(null, '', '/?cat=bogus');

    const { result } = renderHook(() => useUrlState());

    await waitFor(() => expect(result.current.category).toBe('all'));
  });

  it('starts from defaults on first render so SSR and hydration agree', () => {
    window.history.replaceState(null, '', '/?q=cat');

    let firstRenderSearch: string | undefined;
    function Probe() {
      const { search } = useUrlState();
      firstRenderSearch ??= search;
      return null;
    }
    render(<Probe />);

    // 首帧必须是空的，否则服务端渲染结果和客户端首帧对不上。
    expect(firstRenderSearch).toBe('');
  });

  it('preserves unrelated query params when writing state', async () => {
    window.history.replaceState(null, '', '/?utm_source=twitter&ref=abc');

    const { result } = renderHook(() => useUrlState());
    await waitFor(() => expect(result.current.search).toBe(''));

    act(() => result.current.setSearch('cat'));

    expect(window.location.search).toContain('utm_source=twitter');
    expect(window.location.search).toContain('ref=abc');
    expect(window.location.search).toContain('q=cat');
  });

  it('removes params when values return to their defaults', async () => {
    window.history.replaceState(null, '', '/');

    const { result } = renderHook(() => useUrlState());
    await waitFor(() => expect(result.current.search).toBe(''));

    act(() => result.current.setSearch('cat'));
    act(() => result.current.setCategory('video'));
    act(() => result.current.setFavoritesOnly(true));
    expect(window.location.search).toBe('?q=cat&cat=video&favs=1');

    act(() => result.current.setSearch(''));
    act(() => result.current.setCategory('all'));
    act(() => result.current.setFavoritesOnly(false));
    expect(window.location.search).toBe('');
  });

  it('keeps separate consumers in sync', async () => {
    window.history.replaceState(null, '', '/');

    const a = renderHook(() => useUrlState());
    const b = renderHook(() => useUrlState());
    await waitFor(() => expect(a.result.current.search).toBe(''));

    act(() => a.result.current.setSearch('shared'));

    // 两个组件分别调用 hook，必须看到同一份筛选条件。
    expect(b.result.current.search).toBe('shared');
  });

  it('picks up browser back/forward navigation', async () => {
    window.history.replaceState(null, '', '/?q=first');
    const { result } = renderHook(() => useUrlState());
    await waitFor(() => expect(result.current.search).toBe('first'));

    window.history.replaceState(null, '', '/?q=second');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.search).toBe('second');
  });
});

describe('search ↔ URL wiring (regression for PR #61)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(galleryItems),
    }));
  });

  it('restores the search term from ?q= on load', async () => {
    window.history.replaceState(null, '', '/?q=cat');

    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await waitFor(() => expect(getSearchBox().value).toBe('cat'));
  });

  it('writes the typed search term into the URL', async () => {
    window.history.replaceState(null, '', '/');
    const user = userEvent.setup();

    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await user.type(getSearchBox(), 'dog');

    await waitFor(() => expect(window.location.search).toContain('q=dog'));
  });

  it('writes the favorites filter into the URL', async () => {
    window.history.replaceState(null, '', '/');
    const user = userEvent.setup();

    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await user.click(await screen.findByTestId('favorites-filter-toggle'));

    await waitFor(() => expect(window.location.search).toContain('favs=1'));
  });
});
