import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import Gallery, { filterGalleryItems, getGalleryMediaUrl } from '@/components/gallery/Gallery';
import ContributeModal from '@/components/gallery/ContributeModal';
import { THEME_STORAGE_KEY, getThemeLabel } from '@/lib/theme';
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
    expect(screen.getByRole('button', { name: '打开作品详情: image-item' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '视频' }));

    expect(screen.getByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '打开作品详情: image-item' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '全部' }));
    await user.type(screen.getByPlaceholderText('搜索灵感...'), 'portrait');

    expect(screen.getByRole('button', { name: '打开作品详情: image-item' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '打开作品详情: video-item' })).not.toBeInTheDocument();
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

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'video-item quick copy' }));

    await waitFor(() => {
      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    });
  });

  it('uses the denser desktop grid and does not render a title field in detail view', async () => {
    const user = userEvent.setup();

    render(<Gallery />);

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();
    expect(document.querySelector('.xl\\:grid-cols-5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '打开作品详情: video-item' }));

    expect(screen.queryByRole('heading', { name: 'Neon Runner' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Cyberpunk video prompt').length).toBeGreaterThan(0);
    expect(screen.queryByText('Perspective')).not.toBeInTheDocument();
    expect(screen.queryByText('Syntax')).not.toBeInTheDocument();
    expect(screen.queryByText('Source Code Available')).not.toBeInTheDocument();
  });

  it('does not render prompt text in cards', async () => {
    render(<Gallery />);

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();
    expect(screen.queryByText('Cyberpunk video prompt')).not.toBeInTheDocument();
    expect(screen.queryByText('Soft portrait lighting')).not.toBeInTheDocument();
  });

  it('renders the model badge with stronger visual emphasis than regular tags', async () => {
    render(<Gallery />);

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();

    const modelBadge = screen.getByTestId('model-badge-video-item');
    expect(modelBadge).toHaveTextContent('sora');
    expect(modelBadge.className).toContain('theme-model-badge');

    const regularTag = screen.getByText('video');
    expect(regularTag.className).toContain('theme-tag');
  });

  it('switches between themes from the navbar and persists the selection', async () => {
    const user = userEvent.setup();

    render(<Home />);

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('cyber-obsidian');

    await user.click(screen.getByRole('button', { name: '主题切换选项框' }));
    await user.click(screen.getByTestId('theme-options').querySelector('[data-theme-option="soft-ui"]') as HTMLElement);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('soft-ui');
    });

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('soft-ui');
    expect(screen.getByTestId('theme-trigger')).toHaveTextContent(getThemeLabel('soft-ui'));
    expect(screen.getByText('THEME')).toBeInTheDocument();
    expect(screen.getByText('灵感提示画廊')).toBeInTheDocument();
  });

  it('restores stored theme preferences and falls back to the default theme for invalid values', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'soft-ui');
    render(<Home />);

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('soft-ui');
    });

    document.documentElement.dataset.theme = 'cyber-obsidian';
    window.localStorage.setItem(THEME_STORAGE_KEY, 'broken-theme');

    render(<Home />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('cyber-obsidian');
    });
  });

  it('applies soft ui surface classes to key gallery controls and overlays', async () => {
    const user = userEvent.setup();

    render(<Home />);

    expect(await screen.findByRole('button', { name: '打开作品详情: video-item' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '主题切换选项框' }));
    await user.click(screen.getByTestId('theme-options').querySelector('[data-theme-option="soft-ui"]') as HTMLElement);
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('soft-ui');
    });

    expect(screen.getByTestId('theme-trigger').className).toContain('theme-option-trigger');
    expect(screen.getByTestId('gallery-search').className).toContain('theme-input');
    expect(screen.getByTestId('gallery-category-switcher').className).toContain('theme-panel');
    expect(screen.getByTestId('gallery-card-video-item').parentElement?.className).toContain('theme-card');

    await user.click(screen.getByRole('button', { name: '打开作品详情: video-item' }));

    expect(screen.getByRole('button', { name: '复制详情提示词' }).className).toContain('theme-copy-button');
    expect(screen.getByRole('button', { name: '关闭详情弹层' }).className).toContain('theme-secondary-button');

    await user.click(screen.getByRole('button', { name: /我要投稿/i }));

    expect(screen.getByTestId('contribute-mode-switcher').className).toContain('theme-panel');
    expect(screen.getByPlaceholderText('Seedance 2.0').className).toContain('theme-input');
    expect((screen.getByPlaceholderText('Seedance 2.0') as HTMLInputElement).value).toBe('');
  });
});

describe('ContributeModal component', () => {
  it('renders the title input and other form fields correctly', () => {
    render(<ContributeModal isOpen onClose={() => {}} />);

    expect(screen.getByTestId('contribute-modal-shell').className).toContain('theme-modal');
    expect(screen.getByPlaceholderText('例如：赛博朋克猫咪')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '上传文件' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Media URL' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('补充画面风格、主体或用途，帮助区分作品。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭投稿弹层' })).toBeInTheDocument();
  });
});
