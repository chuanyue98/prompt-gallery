import { describe, expect, it } from 'vitest';
import {
  buildContributionIndexMd,
  inferMediaTypeFromUrl,
  normalizeTagList,
  validateCreateContributionInput,
} from '@/app/api/contribute/route';

describe('inferMediaTypeFromUrl', () => {
  it('detects image and video assets from direct URLs', () => {
    expect(inferMediaTypeFromUrl('https://cdn.example.com/demo.MP4?token=1')).toBe('video');
    expect(inferMediaTypeFromUrl('https://cdn.example.com/demo.png')).toBe('image');
  });

  it('returns null for unsupported URLs', () => {
    expect(inferMediaTypeFromUrl('https://cdn.example.com/demo')).toBeNull();
  });
});

describe('validateCreateContributionInput', () => {
  it('rejects empty titles', () => {
    expect(validateCreateContributionInput({
      title: '   ',
      mediaUrl: 'https://cdn.example.com/demo.png',
      file: null,
    })).toEqual({
      error: 'Missing required fields',
      mediaType: null,
    });
  });

  it('rejects invalid file and url combinations', () => {
    const file = new File(['demo'], 'demo.png', { type: 'image/png' });

    expect(validateCreateContributionInput({
      title: 'Demo',
      mediaUrl: '',
      file: null,
    }).error).toBe('Provide either a media file or a media URL');

    expect(validateCreateContributionInput({
      title: 'Demo',
      mediaUrl: 'https://cdn.example.com/demo.png',
      file,
    }).error).toBe('Provide either a media file or a media URL');
  });

  it('accepts direct media files and valid media URLs', () => {
    const videoFile = new File(['demo'], 'demo.mp4', { type: 'video/mp4' });

    expect(validateCreateContributionInput({
      title: 'Demo',
      mediaUrl: '',
      file: videoFile,
    })).toEqual({
      error: null,
      mediaType: 'video',
    });

    expect(validateCreateContributionInput({
      title: 'Demo',
      mediaUrl: 'https://cdn.example.com/demo.webp',
      file: null,
    })).toEqual({
      error: null,
      mediaType: 'image',
    });
  });

  it('rejects media urls without a direct asset extension', () => {
    expect(validateCreateContributionInput({
      title: 'Demo',
      mediaUrl: 'https://cdn.example.com/demo',
      file: null,
    })).toEqual({
      error: 'Media URL must point directly to an image or video file',
      mediaType: null,
    });
  });
});

describe('normalizeTagList', () => {
  it('trims whitespace and drops empty tags', () => {
    expect(normalizeTagList('portrait,  cinematic , ,  neon  ')).toEqual([
      'portrait',
      'cinematic',
      'neon',
    ]);
  });
});

describe('buildContributionIndexMd', () => {
  it('builds frontmatter with optional urls and normalized tags', () => {
    const markdown = buildContributionIndexMd({
      title: 'Demo',
      description: 'A demo prompt',
      prompt: '### Prompt\nDraw a city',
      tags: 'portrait,  cinematic , ,  neon  ',
      model: 'gpt-image-1',
      mediaUrl: 'https://cdn.example.com/demo.png',
      sourceUrl: 'https://example.com/source',
      mediaType: 'image',
      assetReference: 'https://cdn.example.com/demo.png',
    });

    expect(markdown).toContain('tags: ["portrait", "cinematic", "neon"]');
    expect(markdown).toContain('mediaUrl: "https://cdn.example.com/demo.png"');
    expect(markdown).toContain('sourceUrl: "https://example.com/source"');
    expect(markdown).toContain('### 提示词 (Prompt)\n### Prompt\nDraw a city');
  });
});
