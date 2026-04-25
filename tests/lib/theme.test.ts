import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  getThemeLabel,
  isThemeId,
  resolveTheme,
  applyThemeToDocument,
  readStoredTheme,
  persistTheme,
  initializeTheme,
  ThemeId,
  getThemeInitScript,
} from '@/lib/theme';

describe('theme utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    document.documentElement.dataset.theme = '';
    document.documentElement.style.colorScheme = '';
  });

  describe('getThemeLabel', () => {
    it('returns the correct label for a valid theme id', () => {
      expect(getThemeLabel('cyber-obsidian')).toBe('暗曜');
      expect(getThemeLabel('soft-ui')).toBe('Soft UI');
    });

    it('returns the default theme label for invalid ids', () => {
      expect(getThemeLabel('invalid' as unknown as ThemeId)).toBe('暗曜');
    });
  });

  describe('isThemeId', () => {
    it('identifies valid theme ids', () => {
      expect(isThemeId('cyber-obsidian')).toBe(true);
      expect(isThemeId('soft-ui')).toBe(true);
      expect(isThemeId('invalid')).toBe(false);
      expect(isThemeId(null)).toBe(false);
      expect(isThemeId(undefined)).toBe(false);
      expect(isThemeId('')).toBe(false);
    });
  });

  describe('resolveTheme', () => {
    it('resolves valid themes to themselves', () => {
      expect(resolveTheme('soft-ui')).toBe('soft-ui');
    });

    it('resolves invalid themes to the default theme', () => {
      expect(resolveTheme('invalid')).toBe(DEFAULT_THEME);
      expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
    });
  });

  describe('applyThemeToDocument', () => {
    it('sets the data-theme attribute and color-scheme', () => {
      applyThemeToDocument('soft-ui');
      expect(document.documentElement.dataset.theme).toBe('soft-ui');
      expect(document.documentElement.style.colorScheme).toBe('light');

      applyThemeToDocument('cyber-obsidian');
      expect(document.documentElement.dataset.theme).toBe('cyber-obsidian');
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('returns theme and does nothing if target is missing', () => {
      expect(applyThemeToDocument('soft-ui', null)).toBe('soft-ui');
    });

    it('applies theme to a custom root element', () => {
      const div = document.createElement('div');
      applyThemeToDocument('cyber-obsidian', div);
      expect(div.dataset.theme).toBe('cyber-obsidian');
      expect(div.style.colorScheme).toBe('dark');
    });
  });

  describe('readStoredTheme', () => {
    it('reads from the provided storage', () => {
      const mockStorage = { getItem: vi.fn().mockReturnValue('soft-ui') };
      expect(readStoredTheme(mockStorage)).toBe('soft-ui');
      expect(mockStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    });

    it('falls back to default in SSR environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error: Simulate non-browser environment
      delete global.window;
      expect(readStoredTheme()).toBe(DEFAULT_THEME);
      global.window = originalWindow;
    });

    it('handles localStorage errors', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => { throw new Error('Security Error'); })
      });
      expect(readStoredTheme()).toBe(DEFAULT_THEME);
    });
  });

  describe('persistTheme', () => {
    it('writes to the provided storage', () => {
      const mockStorage = { setItem: vi.fn() };
      persistTheme('soft-ui', mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'soft-ui');
    });

    it('does nothing in SSR environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error: Simulate non-browser environment
      delete global.window;
      expect(persistTheme('soft-ui')).toBeUndefined();
      global.window = originalWindow;
    });

    it('ignores localStorage errors', () => {
      vi.stubGlobal('localStorage', {
        setItem: vi.fn(() => { throw new Error('Quota Exceeded'); })
      });
      expect(() => persistTheme('soft-ui')).not.toThrow();
    });
  });

  describe('initializeTheme', () => {
    it('reads from storage and applies the theme', () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue('soft-ui'),
        setItem: vi.fn(),
      };
      const theme = initializeTheme(mockStorage);
      expect(theme).toBe('soft-ui');
      expect(document.documentElement.dataset.theme).toBe('soft-ui');
    });
  });

  describe('getThemeInitScript', () => {
    it('returns a script string', () => {
      expect(getThemeInitScript()).toContain('window.localStorage.getItem');
    });
  });
});
