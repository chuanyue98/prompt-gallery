import { useCallback, useSyncExternalStore } from 'react';

export type CategoryFilter = 'all' | 'video' | 'image';

export interface UrlState {
  search: string;
  category: CategoryFilter;
  favoritesOnly: boolean;
}

const DEFAULT_STATE: UrlState = { search: '', category: 'all', favoritesOnly: false };

/**
 * 筛选条件是模块级共享的：Navbar 的搜索框和 Gallery 的分类/收藏筛选
 * 分别在不同组件里调用本 hook，必须看到同一份状态，否则会各写各的。
 */
let currentState: UrlState = DEFAULT_STATE;
const listeners = new Set<() => void>();
let popStateBound = false;
let initialized = false;

function readFromUrl(): UrlState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');

  return {
    search: params.get('q') || '',
    category: cat === 'video' || cat === 'image' ? cat : 'all',
    favoritesOnly: params.get('favs') === '1',
  };
}

function writeToUrl(state: UrlState) {
  if (typeof window === 'undefined') return;

  // 基于现有 query 增删，而不是重新构造，
  // 否则 UTM 之类的第三方参数会在用户第一次改筛选时被抹掉。
  const params = new URLSearchParams(window.location.search);

  if (state.search) params.set('q', state.search);
  else params.delete('q');

  if (state.category !== 'all') params.set('cat', state.category);
  else params.delete('cat');

  if (state.favoritesOnly) params.set('favs', '1');
  else params.delete('favs');

  const queryString = params.toString();
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  window.history.replaceState(null, '', newUrl);
}

function broadcast(next: UrlState) {
  currentState = next;
  for (const listener of listeners) listener();
}

/** 写 URL 属于副作用，必须留在渲染与快照读取之外。 */
function publish(next: UrlState) {
  writeToUrl(next);
  broadcast(next);
}

function ensurePopStateBinding() {
  if (popStateBound || typeof window === 'undefined') return;
  popStateBound = true;
  window.addEventListener('popstate', () => broadcast(readFromUrl()));
}

function subscribe(onStoreChange: () => void) {
  // 首个订阅者到来时才读 URL：此时 hydration 已经用过 server snapshot，
  // React 会立刻重新取一次快照并切换到真实值。
  if (!initialized) {
    initialized = true;
    currentState = readFromUrl();
    ensurePopStateBinding();
  }

  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => currentState;
const getServerSnapshot = () => DEFAULT_STATE;

export function useUrlState() {
  // 服务端与 hydration 首帧统一返回默认值，避免 mismatch；
  // 订阅建立后才切到真实的 URL 参数。
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 一律基于 currentState 计算，避免闭包里的陈旧快照。
  const setSearch = useCallback((search: string) => {
    publish({ ...currentState, search });
  }, []);

  const setCategory = useCallback((category: CategoryFilter) => {
    publish({ ...currentState, category });
  }, []);

  const setFavoritesOnly = useCallback((favoritesOnly: boolean) => {
    publish({ ...currentState, favoritesOnly });
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

/** 仅供测试使用：重置模块级共享状态。 */
export function __resetUrlStateForTests() {
  currentState = DEFAULT_STATE;
  listeners.clear();
  initialized = false;
}
