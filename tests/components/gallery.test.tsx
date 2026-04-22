import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import Gallery, { filterGalleryItems, getGalleryMediaUrl } from '@/components/gallery/Gallery';
import ContributeModal, { readFileAsDataURL } from '@/components/gallery/ContributeModal';
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
    await user.type(screen.getByPlaceholderText('搜索灵感...'), 'nomatch');
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
    expect(await screen.findByText('✅ 申请已提交')).toBeInTheDocument();
  });

  it('covers safelyPlayVideo catch and video events', async () => {
    render(<Gallery />);
    // 使用精准选择器避开快捷复制按钮
    const video = (await screen.findByTestId('gallery-card-video-item')).querySelector('video[src="/media/video-item/clip.mp4"]')!;
    vi.spyOn(video, 'play').mockRejectedValue(new Error());
    fireEvent.mouseEnter(video);
    fireEvent.mouseLeave(video);
  });

  it('locks body scroll when detail modal is open', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    
    expect(document.body.style.overflow).toBe('');
    
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    expect(document.body.style.overflow).toBe('hidden');
    
    await user.click(screen.getByRole('button', { name: '关闭详情弹层' }));
    expect(document.body.style.overflow).toBe('');
  });

  it('opens and closes lightbox from detail modal', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    
    // 点击图片区域进入全屏（现在通过 testid 定位，避免与搜索框冲突）
    const mediaTrigger = screen.getByTestId('mobile-fullscreen-hint');
    await user.click(mediaTrigger);
    
    expect(document.body.classList.contains('lightbox-active')).toBe(true);
    
    // 点击关闭（Lightbox 的关闭按钮）
    const closeBtns = screen.getAllByText('✕');
    // Lightbox 通常是最后渲染的，所以取最后一个，或者通过 cursor-zoom-out 找容器
    await user.click(closeBtns[closeBtns.length - 1]);
    
    expect(document.body.classList.contains('lightbox-active')).toBe(false);
  });
});

describe('ContributeModal component', () => {
  it('handles successful Media URL submission', async () => {
    const user = userEvent.setup();
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ success: true, prUrl: 'http://github.com/pr' }) 
    }));

    render(<ContributeModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'T');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'P');
    // 使用精确选择器
    const mediaInput = screen.getByPlaceholderText('https://example.com/your-image.png');
    await user.type(mediaInput, 'https://a.png');
    
    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));
    
    expect(await screen.findByText('投稿已发起')).toBeInTheDocument();
    expect(setTimeoutSpy).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });
});
