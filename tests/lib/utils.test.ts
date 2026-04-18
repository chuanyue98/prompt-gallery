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
  it('normalizes the title and appends a random suffix', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    expect(slugify('Hello Prompt Gallery!!')).toBe('hello-prompt-gallery---xjylrx');

    randomSpy.mockRestore();
  });
});
