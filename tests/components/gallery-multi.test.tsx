import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Lightbox } from '@/components/gallery/Lightbox';
import { DetailModal } from '@/components/gallery/DetailModal';
import type { GalleryItem } from '@/types/gallery';

const multiMediaItem: GalleryItem = {
  slug: 'multi-item',
  title: 'Multi Item',
  description: 'Multi media description',
  tags: ['multi'],
  mediaPath: '/media/multi/',
  media: [
    { type: 'image', src: 'img1.png', cover: 'img1.png' },
    { type: 'video', src: 'vid1.mp4', cover: 'vid1.mp4' },
    { type: 'image', src: 'img2.png', cover: 'img2.png' },
  ],
  content: '### Prompt\nMulti',
  model: 'test-model',
};

describe('Multi-media Navigation', () => {
  const baseModalProps = {
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

  it('navigates multiple media in DetailModal', async () => {
    const user = userEvent.setup();
    render(<DetailModal item={multiMediaItem} {...baseModalProps} />);

    // Initial state: first image
    expect(screen.getByAltText(/Multi media description/)).toHaveAttribute('src', '/media/multi/img1.png');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Click next: second media is video
    await user.click(screen.getByLabelText('Next media'));
    expect(document.querySelector('video')).toHaveAttribute('src', '/media/multi/vid1.mp4');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Click next: third media is image
    await user.click(screen.getByLabelText('Next media'));
    expect(screen.getByAltText(/Multi media description/)).toHaveAttribute('src', '/media/multi/img2.png');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Click next: back to first image (loop)
    await user.click(screen.getByLabelText('Next media'));
    expect(screen.getByAltText(/Multi media description/)).toHaveAttribute('src', '/media/multi/img1.png');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Click prev: to third image
    await user.click(screen.getByLabelText('Previous media'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('navigates multiple media in Lightbox', async () => {
    const user = userEvent.setup();
    render(<Lightbox item={multiMediaItem} onClose={vi.fn()} />);

    // Initial state: first image
    expect(screen.getByAltText(/Multi media description/)).toHaveAttribute('src', '/media/multi/img1.png');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Click next: video
    await user.click(screen.getByLabelText('Next media'));
    expect(document.querySelector('video')).toHaveAttribute('src', '/media/multi/vid1.mp4');

    // Click next: image
    await user.click(screen.getByLabelText('Next media'));
    expect(screen.getByAltText(/Multi media description/)).toHaveAttribute('src', '/media/multi/img2.png');

    // Click prev: back to video
    await user.click(screen.getByLabelText('Previous media'));
    expect(document.querySelector('video')).toHaveAttribute('src', '/media/multi/vid1.mp4');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('Lightbox stops propagation on content click but closes on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Lightbox item={multiMediaItem} onClose={onClose} />);

    // Click the content area (not buttons)
    const content = document.querySelector('.relative.w-full.h-full')!;
    await user.click(content);
    expect(onClose).not.toHaveBeenCalled();

    // Click the backdrop
    const backdrop = document.querySelector('.cursor-zoom-out')!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
