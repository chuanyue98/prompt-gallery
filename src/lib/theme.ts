export type ThemeId = 'cyber-obsidian' | 'soft-ui';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  isDefault?: boolean;
  supportsSoftSurface?: boolean;
}

export const THEME_STORAGE_KEY = 'prompt-gallery-theme';
export const DEFAULT_THEME: ThemeId = 'cyber-obsidian';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'cyber-obsidian',
    label: '暗曜',
    description: '默认深色玻璃质感',
    isDefault: true,
  },
  {
    id: 'soft-ui',
    label: 'Soft UI',
    description: '柔和浮雕效率主题',
    supportsSoftSurface: true,
  },
];

export function getThemeLabel(theme: ThemeId) {
  return THEME_OPTIONS.find((option) => option.id === theme)?.label ?? THEME_OPTIONS[0].label;
}

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'cyber-obsidian' || value === 'soft-ui';
}

export function resolveTheme(value: string | null | undefined): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME;
}

export function applyThemeToDocument(theme: ThemeId, root?: HTMLElement | null) {
  const target = root ?? (typeof document !== 'undefined' ? document.documentElement : null);

  if (!target) {
    return theme;
  }

  target.dataset.theme = theme;
  target.style.colorScheme = theme === 'soft-ui' ? 'light' : 'dark';

  return theme;
}

export function readStoredTheme(storage?: Pick<Storage, 'getItem'> | null): ThemeId {
  if (storage) {
    return resolveTheme(storage.getItem(THEME_STORAGE_KEY));
  }

  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  try {
    return resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function persistTheme(theme: ThemeId, storage?: Pick<Storage, 'setItem'> | null) {
  if (storage) {
    storage.setItem(THEME_STORAGE_KEY, theme);
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures and keep the in-memory theme active.
  }
}

export function initializeTheme(storage?: Pick<Storage, 'getItem' | 'setItem'> | null) {
  const theme = readStoredTheme(storage);
  applyThemeToDocument(theme);

  return theme;
}

export function getThemeInitScript() {
  return `(() => {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const defaultTheme = ${JSON.stringify(DEFAULT_THEME)};
    const isTheme = (value) => value === 'cyber-obsidian' || value === 'soft-ui';
    try {
      const stored = window.localStorage.getItem(storageKey);
      const theme = isTheme(stored) ? stored : defaultTheme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme === 'soft-ui' ? 'light' : 'dark';
    } catch {
      document.documentElement.dataset.theme = defaultTheme;
      document.documentElement.style.colorScheme = 'dark';
    }
  })();`;
}
