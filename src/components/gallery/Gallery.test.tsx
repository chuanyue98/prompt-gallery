import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Gallery, { filterGalleryItems, getGalleryMediaUrl } from './Gallery';
import type { GalleryItem } from '@/types/gallery';

vi.mock('@/lib/utils', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

const galleryItems: GalleryItem[] = [
  {
    slug: 'video-item',
    title: 'Neon Runner',
    description: 'Cyberpunk video prompt',
    tags: ['video', 'neon'],
    mediaPath: '/media/video-item/',
    media: [{ type: 'video', src: 'clip.mp4', cover: 'cover.mp4' }],
    content: '### Prompt\nFast car',
    model: 'sora',
  },
  {
    slug: 'image-item',
    title: 'Quiet Portrait',
    description: 'Soft portrait lighting',
    tags: ['portrait', 'image'],
    mediaPath: '/media/image-item/',
    media: [{ type: 'image', src: 'cover.png', cover: 'cover.png' }],
    content: '### Prompt\nPortrait',
    model: 'gpt-image-1',
  },
];

describe('filterGalleryItems', () => {
  it('filters by search text and category', () => {
    expect(filterGalleryItems(galleryItems, 'portrait', 'all')).toEqual([galleryItems[1]]);
    expect(filterGalleryItems(galleryItems, '', 'video')).toEqual([galleryItems[0]]);
  });
});

describe('getGalleryMediaUrl', () => {
  it('returns external urls directly and prefixes local assets', () => {
    expect(getGalleryMediaUrl(galleryItems[0], 'cover')).toBe('/media/video-item/cover.mp4');
    expect(getGalleryMediaUrl({
      ...galleryItems[1],
      mediaUrl: 'https://cdn.example.com/image.png',
    }, 'cover')).toBe('https://cdn.example.com/image.png');
  });
});

describe('Gallery component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => galleryItems,
    }));
  });

  it('loads gallery items and filters them in the UI', async () => {
    const user = userEvent.setup();

    render(<Gallery />);

    expect(await screen.findByText('Neon Runner')).toBeInTheDocument();
    expect(screen.getByText('Quiet Portrait')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '视频' }));

    expect(screen.getByText('Neon Runner')).toBeInTheDocument();
    expect(screen.queryByText('Quiet Portrait')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '全部' }));
    await user.type(screen.getByPlaceholderText('搜索灵感...'), 'portrait');

    expect(screen.getByText('Quiet Portrait')).toBeInTheDocument();
    expect(screen.queryByText('Neon Runner')).not.toBeInTheDocument();
  });

  it('shows an error message when gallery data fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => [],
    }));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Gallery />);

    expect(await screen.findByText('内容数据加载失败，请稍后刷新重试。')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('updates the quick copy state after copying prompt content', async () => {
    const user = userEvent.setup();

    render(<Gallery />);

    expect(await screen.findByText('Neon Runner')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'QUICK COPY' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'SUCCESS' })).toBeInTheDocument();
    });
  });
});
