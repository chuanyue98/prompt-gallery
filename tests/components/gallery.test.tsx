import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import Gallery from '@/components/gallery/Gallery';
import { filterGalleryItems, getGalleryMediaUrl, readFileAsDataURL, isExternalUrl, isVideoAsset, safelyPlayVideo } from '@/lib/gallery';
import type { GalleryItem } from '@/types/gallery';

vi.mock('@/lib/utils', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

const galleryItems: GalleryItem[] = [
  {
    slug: 'video-item',
    description: 'Cyberpunk video prompt',
    tags: ['video', 'neon'],
    mediaPath: '/media/video-item/',
    media: [{ type: 'video', src: 'clip.mp4', cover: 'cover.mp4' }],
    content: '### Prompt\nFast car',
    model: 'sora',
  },
  {
    slug: 'image-item',
    description: 'Soft portrait lighting',
    tags: ['portrait', 'image'],
    mediaPath: '/media/image-item/',
    media: [{ type: 'image', src: 'cover.png', cover: 'cover.png' }],
    content: '### Prompt\nPortrait',
    model: 'gpt-image-1',
  },
];

describe('Gallery component helpers', () => {
  it('readFileAsDataURL reads file', async () => {
    const file = new File(['h'], 't.txt', { type: 'text/plain' });
    expect(await readFileAsDataURL(file)).toContain('data:text/plain;base64');
  });

  it('readFileAsDataURL rejects', async () => {
    const file = new File([''], 'e');
    const spy = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function(this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as unknown as ProgressEvent<FileReader>);
    });
    await expect(readFileAsDataURL(file)).rejects.toThrow();
    spy.mockRestore();
  });

  it('filterGalleryItems covers all branches', () => {
    expect(filterGalleryItems(galleryItems, 'portrait', 'all')).toHaveLength(1);
    expect(filterGalleryItems(galleryItems, '', 'image')).toHaveLength(1);
    expect(filterGalleryItems(galleryItems, '', 'invalid' as unknown as 'all')).toHaveLength(0);
  });


  it('getGalleryMediaUrl handles branches', () => {
    expect(getGalleryMediaUrl(galleryItems[0], 'src')).toBe('/media/video-item/clip.mp4');
    // 当 media[0] 为空或字段缺失时，才应退而求其次取 mediaUrl
    expect(getGalleryMediaUrl({ ...galleryItems[1], media: [], mediaUrl: 'http://a.com' }, 'src')).toBe('http://a.com');
    // 没有 asset 返回空
    expect(getGalleryMediaUrl({ ...galleryItems[0], media: [], mediaUrl: undefined }, 'src')).toBe('');
  });

  it('isExternalUrl and isVideoAsset handle branches', () => {
    expect(isExternalUrl('http://a.com')).toBe(true);
    expect(isExternalUrl('/a.png')).toBe(false);
    expect(isVideoAsset('a.mp4')).toBe(true);
    expect(isVideoAsset('a.png')).toBe(false);
  });

  it('safelyPlayVideo catches error', async () => {
    const mockVideo = {
      play: () => Promise.reject(new Error('play error')),
    } as unknown as HTMLVideoElement;
    // Should not throw
    safelyPlayVideo(mockVideo);
    
    const mockVideoNoPromise = {
      play: () => ({}), // no .catch
    } as unknown as HTMLVideoElement;
    safelyPlayVideo(mockVideoNoPromise);
  });
});

describe('Gallery component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'cyber-obsidian';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => galleryItems,
    }));
  });

  it('loads gallery items and filters them in the UI', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: '视频' }));
    expect(screen.queryByRole('button', { name: '打开作品详情: image-item' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '全部' }));
    await user.type(screen.getByPlaceholderText('搜索灵感 (SEARCH INSPIRATION)...'), 'nomatch');
    expect(await screen.findByText('没有匹配当前筛选条件的内容。')).toBeInTheDocument();
  });

  it('switches between themes', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole('button', { name: '主题切换选项框' }));
    await user.click(screen.getByTestId('theme-options').querySelector('[data-theme-option="soft-ui"]') as HTMLElement);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('soft-ui'));
  });

  it('handles take down requests', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    await user.click(screen.getByRole('button', { name: '申请下架 (TAKE DOWN)' }));
    await user.type(screen.getByPlaceholderText(/例如：图片失效/), 'Broken');
    await user.click(screen.getByRole('button', { name: '确认申请' }));
    
    await waitFor(() => {
      expect(screen.getByText('✅ 申请已提交')).toBeInTheDocument();
    });
  });

  it('triggers hover logic in GalleryCard', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    const card = await screen.findByTestId('gallery-card-video-item');
    
    // Hover triggers play
    await user.hover(card);
    // Unhover triggers pause
    await user.unhover(card);
  });
});
