import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GalleryCard from '@/components/gallery/GalleryCard';
import type { GalleryItem } from '@/types/gallery';

function makeItem(overrides: Partial<GalleryItem> = {}): GalleryItem {
  return {
    slug: 'item',
    title: '标题',
    description: '描述',
    tags: [],
    model: 'GPT-Image 2',
    content: 'prompt',
    type: 'image',
    mediaPath: '/data/images/item/',
    media: [{ type: 'image', src: 'a.png', cover: 'a.png' }],
    ...overrides,
  } as GalleryItem;
}

function renderCard(item: GalleryItem) {
  return render(
    <GalleryCard
      item={item}
      onSelect={vi.fn()}
      onCopy={vi.fn()}
      isCopied={false}
      isFavorite={false}
      onToggleFavorite={vi.fn()}
    />
  );
}

function overlayTop(slug: string) {
  return screen.getByTestId(`gallery-card-${slug}`).querySelector('.card-overlay-top')!;
}

describe('GalleryCard media badge vs model tag', () => {
  // 「视频 / N 图」徽章常驻在左上角，hover 出现的模型名默认落在同一位置。
  // 有徽章时必须让开，否则模型名会被压住看不见。
  it('offsets the model tag on video cards', () => {
    renderCard(makeItem({ slug: 'v', type: 'video', media: [{ type: 'video', src: 'a.mp4', cover: 'a.png' }] }));

    expect(screen.getByText('视频')).toBeInTheDocument();
    expect(overlayTop('v')).toHaveClass('has-media-badge');
  });

  it('offsets the model tag on multi-image cards', () => {
    renderCard(makeItem({
      slug: 'm',
      media: [
        { type: 'image', src: 'a.png', cover: 'a.png' },
        { type: 'image', src: 'b.png', cover: 'b.png' },
      ],
    }));

    expect(screen.getByText('2 图')).toBeInTheDocument();
    expect(overlayTop('m')).toHaveClass('has-media-badge');
  });

  it('leaves the model tag in place when there is no badge', () => {
    renderCard(makeItem({ slug: 's' }));

    expect(screen.queryByText('视频')).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ 图/)).not.toBeInTheDocument();
    expect(overlayTop('s')).not.toHaveClass('has-media-badge');
  });

  it('still renders the model tag alongside the badge', () => {
    renderCard(makeItem({ slug: 'both', type: 'video', media: [{ type: 'video', src: 'a.mp4', cover: 'a.png' }] }));

    // 两者必须同时存在 —— 修复方式是错开位置，不是把其中一个藏起来。
    expect(screen.getByText('视频')).toBeInTheDocument();
    expect(screen.getByTestId('model-badge-both')).toHaveTextContent('GPT-Image 2');
  });

  it('does not add the badge class when an item has no model', () => {
    renderCard(makeItem({ slug: 'nomodel', model: '', media: [{ type: 'image', src: 'a.png', cover: 'a.png' }] }));

    expect(screen.queryByTestId('model-badge-nomodel')).not.toBeInTheDocument();
  });
});
