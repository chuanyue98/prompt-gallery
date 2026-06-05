import { describe, expect, it } from 'vitest';
import { normalizeModelName } from '@/lib/models';

describe('model normalization', () => {
  it('normalizes common model aliases and typos', () => {
    expect(normalizeModelName('GPT-image-2')).toBe('GPT-Image 2');
    expect(normalizeModelName('GPT-IMAGE-2')).toBe('GPT-Image 2');
    expect(normalizeModelName('GTP-Image 2')).toBe('GPT-Image 2');
    expect(normalizeModelName('p-image')).toBe('GPT-Image 2');
    expect(normalizeModelName('NanoBananoPro')).toBe('Nano Banana Pro');
    expect(normalizeModelName('Seedance2.0 Fast  ')).toBe('Seedance 2.0 Fast');
  });

  it('normalizes slash-separated model combinations', () => {
    expect(normalizeModelName('seedance 2.0 / midjourney')).toBe('Seedance 2.0 / Midjourney');
  });

  it('preserves unknown model names with trimmed spacing', () => {
    expect(normalizeModelName('  Custom   Model  ')).toBe('Custom Model');
  });
});
