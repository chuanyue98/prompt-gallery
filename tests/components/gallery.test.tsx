import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import Gallery from '@/components/gallery/Gallery';
import ContributeModal from '@/components/gallery/ContributeModal';
import GalleryCard from '@/components/gallery/GalleryCard';
import { Lightbox } from '@/components/gallery/Lightbox';
import { DetailModal } from '@/components/gallery/DetailModal';
import { filterGalleryItems, getGalleryMediaUrl, readFileAsDataURL, isExternalUrl, isVideoAsset, safelyPlayVideo } from '@/lib/gallery';
import { copyToClipboard } from '@/lib/utils';
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
    sourceUrl: 'https://example.com/source',
  },
];

const externalImageItem: GalleryItem = {
  slug: 'external-item',
  description: 'External hosted image',
  tags: ['external'],
  mediaPath: '/media/external-item/',
  media: [{ type: 'image', src: 'https://example.com/img.png', cover: 'https://example.com/img.png' }],
  content: '### Prompt\nExternal',
};

const emptyMediaItem: GalleryItem = {
  slug: 'empty-media-item',
  description: 'Missing media',
  tags: ['broken'],
  mediaPath: '/media/empty-media-item/',
  media: [],
  content: '### Prompt\nBroken',
};

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
    // description-match branch: 'lighting' is not in any tag but is in image-item description
    expect(filterGalleryItems(galleryItems, 'lighting', 'all')).toHaveLength(1);
  });


  it('getGalleryMediaUrl handles branches', () => {
    expect(getGalleryMediaUrl(galleryItems[0], 'src')).toBe('/media/video-item/clip.mp4');
    // 当 media[0] 为空或字段缺失时，才应退而求其次取 mediaUrl
    expect(getGalleryMediaUrl({ ...galleryItems[1], media: [], mediaUrl: 'http://a.com' }, 'src')).toBe('http://a.com');
    // 没有 asset 返回空
    expect(getGalleryMediaUrl({ ...galleryItems[0], media: [], mediaUrl: undefined }, 'src')).toBe('');
  });

  it('gracefully handles items without media', () => {
    expect(filterGalleryItems([emptyMediaItem], '', 'all')).toHaveLength(1);
    expect(filterGalleryItems([emptyMediaItem], '', 'image')).toHaveLength(0);
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

    // Clear search and try a search that matches something to ensure the message disappears
    await user.clear(screen.getByPlaceholderText('搜索灵感 (SEARCH INSPIRATION)...'));
    expect(screen.queryByText('没有匹配当前筛选条件的内容。')).not.toBeInTheDocument();
  });

  it('handles submission error with non-Error object', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    // Mock fetch to reject with a string
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('String Error'));
    
    render(<ContributeModal isOpen={true} onClose={() => {}} />);
    
    // Switch to Media URL mode first
    fireEvent.click(screen.getByRole('button', { name: 'Media URL' }));

    const titleInput = screen.getByPlaceholderText('例如：赛博朋克猫咪');
    const promptInput = screen.getByPlaceholderText('完整咒语...');
    const urlInput = screen.getByPlaceholderText('https://example.com/your-image.png');
    
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(promptInput, { target: { value: 'Test Prompt' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com/img.png' } });
    });

    const submitBtn = screen.getByRole('button', { name: /确认提交|SUBMIT/ });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(alertMock).toHaveBeenCalledWith('❌ 提交失败：未知错误');
    vi.unstubAllGlobals();
  });

  it('triggers setSubmissionMode when file is changed', async () => {
    render(<ContributeModal isOpen={true} onClose={() => {}} />);
    
    // Switch to Media URL mode first
    fireEvent.click(screen.getByRole('button', { name: 'Media URL' }));
    const urlInput = screen.getByPlaceholderText('https://example.com/your-image.png') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'http://old.png' } });
    
    // Switch back to upload mode to make file input visible
    fireEvent.click(screen.getByRole('button', { name: '上传文件' }));
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['data'], 'test.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    // Internal state should be 'upload', and URL input should not be in document
    expect(screen.queryByPlaceholderText('https://example.com/your-image.png')).not.toBeInTheDocument();
  });

  it('handles validation alert branch by manually triggering submit', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    render(<ContributeModal isOpen={true} onClose={() => {}} />);
    
    const titleInput = screen.getByPlaceholderText('例如：赛博朋克猫咪');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Test' } });
    });

    const form = document.querySelector('form')!;
    // Directly fire submit to bypass button disabled state for coverage
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(alertMock).toHaveBeenCalledWith('请在上传图片/视频与填写 mediaUrl 之间二选一。');
    vi.unstubAllGlobals();
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
    render(<Gallery />);
    const card = await screen.findByTestId('gallery-card-video-item');
    
    // Hover triggers play
    fireEvent.mouseEnter(card);
    // Unhover triggers pause
    fireEvent.mouseLeave(card);
  });

  it('handles drag and drop in ContributeModal', async () => {
    // 模拟 URL.createObjectURL
    const mockObjectUrl = 'blob:test';
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl);
    
    render(<ContributeModal isOpen={true} onClose={() => {}} />);

    const dropZone = screen.getByText(/点击或拖拽上传/).closest('label')!;
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    // 1. 测试 DragEnter
    fireEvent.dragEnter(dropZone, {
      dataTransfer: {
        files: [file],
        types: ['Files']
      }
    });
    expect(screen.getByText('松开即刻上传')).toBeInTheDocument();

    // 2. 测试 DragLeave
    fireEvent.dragLeave(dropZone);
    expect(screen.getByText('点击或拖拽上传')).toBeInTheDocument();

    // 3. 测试 Drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      }
    });

    // 验证预览图是否出现
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
      expect(screen.getByAltText('Preview')).toHaveAttribute('src', mockObjectUrl);
    });

    createObjectURLSpy.mockRestore();
  });
});

describe('GalleryCard direct tests', () => {
  const onSelect = vi.fn();
  const onCopy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not crash when media is missing', () => {
    render(<GalleryCard item={emptyMediaItem} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    expect(screen.getByText('暂无媒体内容')).toBeInTheDocument();
  });

  it('shows SUCCESS text when isCopied is true', () => {
    render(<GalleryCard item={galleryItems[0]} onSelect={onSelect} onCopy={onCopy} isCopied={true} />);
    expect(screen.getByText('SUCCESS ✓')).toBeInTheDocument();
  });

  it('triggers onCopy when quick copy button is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryCard item={galleryItems[0]} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    await user.click(screen.getByRole('button', { name: 'video-item quick copy' }));
    expect(onCopy).toHaveBeenCalledWith(galleryItems[0].content, 'video-item');
  });

  it('selects item on Enter keydown', () => {
    const user = userEvent.setup();
    render(<GalleryCard item={galleryItems[0]} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    const card = screen.getByTestId('gallery-card-video-item');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(galleryItems[0]);
  });

  it('selects item on Space keydown', () => {
    render(<GalleryCard item={galleryItems[0]} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    const card = screen.getByTestId('gallery-card-video-item');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(galleryItems[0]);
  });

  it('ignores other key presses', () => {
    render(<GalleryCard item={galleryItems[0]} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    const card = screen.getByTestId('gallery-card-video-item');
    fireEvent.keyDown(card, { key: 'Tab' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders external URL cover as img element', () => {
    render(<GalleryCard item={externalImageItem} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    const img = document.querySelector('img[src="https://example.com/img.png"]');
    expect(img).toBeInTheDocument();
  });

  it('does not render model badge when model is absent', () => {
    render(<GalleryCard item={externalImageItem} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    expect(screen.queryByTestId('model-badge-external-item')).not.toBeInTheDocument();
  });

  it('triggers video mouseEnter and mouseLeave handlers', () => {
    render(<GalleryCard item={galleryItems[0]} onSelect={onSelect} onCopy={onCopy} isCopied={false} />);
    const videos = document.querySelectorAll('video');
    // The hover overlay video (second video) has the mouse handlers
    if (videos.length > 1) {
      fireEvent.mouseEnter(videos[1]);
      fireEvent.mouseLeave(videos[1]);
    }
  });
});

describe('Lightbox direct tests', () => {
  it('renders image lightbox', () => {
    render(<Lightbox item={galleryItems[1]} onClose={vi.fn()} />);
    expect(document.querySelector('.cursor-zoom-out')).toBeInTheDocument();
  });

  it('renders video lightbox', () => {
    render(<Lightbox item={galleryItems[0]} onClose={vi.fn()} />);
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('shows fallback when media is missing', () => {
    render(<Lightbox item={emptyMediaItem} onClose={vi.fn()} />);
    expect(screen.getByText('暂无媒体内容')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Lightbox item={galleryItems[1]} onClose={onClose} />);
    await user.click(document.querySelector('.cursor-zoom-out')!);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('DetailModal direct tests', () => {
  const baseProps = {
    onClose: vi.fn(),
    onCopy: vi.fn(),
    copiedSlug: null as string | null,
    onLightboxOpen: vi.fn(),
    showDeleteForm: false,
    setShowDeleteForm: vi.fn(),
    deleteReason: '',
    setDeleteReason: vi.fn(),
    onDeleteRequest: vi.fn(),
    isDeleting: false,
    deleteSuccess: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element for video items', () => {
    render(<DetailModal item={galleryItems[0]} {...baseProps} />);
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('shows fallback when media is missing', () => {
    render(<DetailModal item={emptyMediaItem} {...baseProps} />);
    expect(screen.getByText('暂无媒体内容')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DetailModal item={galleryItems[1]} {...baseProps} onClose={onClose} />);
    // Click the outer overlay (not inner content)
    const overlay = document.querySelector('.fixed.inset-0') as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('stops propagation when video is clicked', () => {
    const onClose = vi.fn();
    render(<DetailModal item={galleryItems[0]} {...baseProps} onClose={onClose} />);
    const video = document.querySelector('video')!;
    fireEvent.click(video);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders external URL cover as img', () => {
    render(<DetailModal item={externalImageItem} {...baseProps} />);
    const img = document.querySelector('img[src="https://example.com/img.png"]');
    expect(img).toBeInTheDocument();
  });

  it('calls onCopy when copy prompt button is clicked', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<DetailModal item={galleryItems[1]} {...baseProps} onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: '复制详情提示词' }));
    expect(onCopy).toHaveBeenCalledWith(galleryItems[1].content, 'modal');
  });

  it('shows COPIED state when copiedSlug is modal', () => {
    render(<DetailModal item={galleryItems[1]} {...baseProps} copiedSlug="modal" />);
    expect(screen.getByText('COPIED ✓')).toBeInTheDocument();
  });

  it('shows VIEW SOURCE link when sourceUrl is present', () => {
    render(<DetailModal item={galleryItems[1]} {...baseProps} />);
    expect(screen.getByRole('link', { name: 'VIEW SOURCE' })).toBeInTheDocument();
  });

  it('shows delete form and cancel button works', async () => {
    const user = userEvent.setup();
    const setShowDeleteForm = vi.fn();
    const setDeleteReason = vi.fn();
    render(
      <DetailModal
        item={galleryItems[0]}
        {...baseProps}
        showDeleteForm={true}
        deleteReason="test reason"
        setShowDeleteForm={setShowDeleteForm}
        setDeleteReason={setDeleteReason}
      />
    );
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(setShowDeleteForm).toHaveBeenCalledWith(false);
    expect(setDeleteReason).toHaveBeenCalledWith('');
  });

  it('shows delete success state', () => {
    render(<DetailModal item={galleryItems[0]} {...baseProps} deleteSuccess={true} />);
    expect(screen.getByText('✅ 申请已提交')).toBeInTheDocument();
  });
});

describe('Gallery error and edge cases', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')));
    render(<Gallery />);
    expect(await screen.findByText('内容数据加载失败，请稍后刷新重试。')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('shows error message when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    render(<Gallery />);
    expect(await screen.findByText('内容数据加载失败，请稍后刷新重试。')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('shows empty items message when gallery returns no data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    render(<Gallery />);
    expect(await screen.findByText('当前还没有可展示的内容。')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('handles copy failure gracefully', async () => {
    vi.mocked(copyToClipboard).mockResolvedValueOnce(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => galleryItems,
    }));
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: image-item' }));
    await user.click(screen.getByRole('button', { name: '复制详情提示词' }));
    // Button text should remain COPY PROMPT (not COPIED ✓) since copy failed
    expect(screen.getByRole('button', { name: '复制详情提示词' })).toHaveTextContent('COPY PROMPT');
    vi.unstubAllGlobals();
  });

  it('copies prompt and shows COPIED state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => galleryItems,
    }));
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: image-item' }));
    await user.click(screen.getByRole('button', { name: '复制详情提示词' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '复制详情提示词' })).toHaveTextContent('COPIED ✓'));
    vi.unstubAllGlobals();
  });

  it('shows lightbox when media area is clicked and updates body styles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => galleryItems,
    }));
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.classList.contains('lightbox-active')).toBe(false);

    // Click the media panel (cursor-zoom-in div)
    const zoomPanel = document.querySelector('.cursor-zoom-in') as HTMLElement;
    await user.click(zoomPanel);
    expect(document.querySelector('.cursor-zoom-out')).toBeInTheDocument();
    
    // Lightbox open: should have lightbox-active class
    expect(document.body.classList.contains('lightbox-active')).toBe(true);

    // Close lightbox
    await user.click(document.querySelector('.cursor-zoom-out')!);
    await waitFor(() => expect(document.querySelector('.cursor-zoom-out')).not.toBeInTheDocument());
    expect(document.body.classList.contains('lightbox-active')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden'); // DetailModal still open

    // Close DetailModal
    fireEvent.click(document.querySelector('.fixed.inset-0')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
    
    vi.unstubAllGlobals();
  });

  it('closes lightbox when lightbox backdrop is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => galleryItems,
    }));
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    const zoomPanel = document.querySelector('.cursor-zoom-in') as HTMLElement;
    await user.click(zoomPanel);
    await waitFor(() => expect(document.querySelector('.cursor-zoom-out')).toBeInTheDocument());
    await user.click(document.querySelector('.cursor-zoom-out')!);
    await waitFor(() => expect(document.querySelector('.cursor-zoom-out')).not.toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it('shows error alert when delete request fails with !response.ok', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => galleryItems })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: '权限不足' }) })
    );
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    await user.click(screen.getByRole('button', { name: '申请下架 (TAKE DOWN)' }));
    await user.type(screen.getByPlaceholderText(/例如：图片失效/), 'Reason');
    await user.click(screen.getByRole('button', { name: '确认申请' }));
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('权限不足'));
    vi.unstubAllGlobals();
  });

  it('shows error alert when delete fetch throws', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => galleryItems })
      .mockRejectedValueOnce(new Error('Network crash'))
    );
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: '打开作品详情: video-item' }));
    await user.click(screen.getByRole('button', { name: '申请下架 (TAKE DOWN)' }));
    await user.type(screen.getByPlaceholderText(/例如：图片失效/), 'Reason');
    await user.click(screen.getByRole('button', { name: '确认申请' }));
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Network crash'));
    vi.unstubAllGlobals();
  });
});
