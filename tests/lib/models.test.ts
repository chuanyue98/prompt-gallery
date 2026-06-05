import { describe, expect, it } from 'vitest';
import { buildModelOptions, normalizeModelName } from '@/lib/models';

describe('model normalization', () => {
  it('normalizes common model aliases and typos', () => {
    expect(normalizeModelName('GPT-image-2')).toBe('GPT-Image 2');
    expect(normalizeModelName('GPT-IMAGE-2')).toBe('GPT-Image 2');
    expect(normalizeModelName('GTP-Image 2')).toBe('GPT-Image 2');
    expect(normalizeModelName('NanoBananoPro')).toBe('Nano Banana Pro');
    expect(normalizeModelName('Seedance2.0 Fast  ')).toBe('Seedance 2.0 Fast');
  });

  it('preserves p-image as its own model', () => {
    expect(normalizeModelName('p-image')).toBe('p-image');
  });

  it('normalizes slash-separated model combinations', () => {
    expect(normalizeModelName('seedance 2.0 / midjourney')).toBe('Seedance 2.0 / Midjourney');
  });

  it('preserves unknown model names with trimmed spacing', () => {
    expect(normalizeModelName('  Custom   Model  ')).toBe('Custom Model');
  });

  it('ignores non-string values defensively', () => {
    expect(normalizeModelName(undefined)).toBe('');
    expect(normalizeModelName(new File(['x'], 'model.txt'))).toBe('');
  });

  it('merges existing model names into suggestions', () => {
    expect(buildModelOptions(['Gemini 2.5 Flash Image', 'GPT-image-2'])).toEqual(expect.arrayContaining([
      'GPT-Image 2',
      'Gemini 2.5 Flash Image',
    ]));
  });
});
