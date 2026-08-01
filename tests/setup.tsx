import { createElement, type ImgHTMLAttributes } from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { __resetUrlStateForTests } from '@/lib/hooks/useUrlState';
import { __resetFavoritesForTests } from '@/lib/hooks/useFavorites';

vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    return createElement('img', { ...props, alt: props.alt ?? '' });
  },
}));

afterEach(() => {
  cleanup();
  // 筛选条件同时活在 URL 和模块级共享状态里，
  // 不重置的话上一个用例的筛选会漏进下一个用例。
  window.history.replaceState(null, '', '/');
  __resetUrlStateForTests();
  __resetFavoritesForTests();
});

Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}
(globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
