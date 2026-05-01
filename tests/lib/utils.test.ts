import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard, slugify } from '@/lib/utils';

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('removes markdown headings before writing text', async () => {
    const result = await copyToClipboard('### Title\nPrompt body');

    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Prompt body');
  });

  it('returns false when clipboard write fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const result = await copyToClipboard('content');

    expect(result).toBe(false);
    expect(writeText).toHaveBeenCalledWith('content');
    consoleErrorSpy.mockRestore();
  });
});

describe('slugify', () => {
  it('normalizes the title and appends a 5-char hex suffix', () => {
    const result = slugify('Hello Prompt Gallery!!');
    expect(result).toMatch(/^hello-prompt-gallery---[0-9a-f]{5}$/);
  });

  it('generates a unique suffix on each call', () => {
    const slug1 = slugify('same');
    const slug2 = slugify('same');
    expect(slug1).not.toBe(slug2);
  });
});
