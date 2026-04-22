import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ContributeModal from '@/components/gallery/ContributeModal';

describe('ContributeModal validation and errors', () => {
  it('shows an alert when title is missing', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);

    render(<ContributeModal isOpen onClose={() => {}} />);
    
    const form = screen.getByTestId('contribute-modal-shell').querySelector('form')!;
    fireEvent.submit(form);

    expect(alertMock).toHaveBeenCalledWith('请填写作品标题。');

    vi.unstubAllGlobals();
  });

  it('shows an alert when both file and url are provided or both are missing', async () => {
    const user = userEvent.setup();
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);

    render(<ContributeModal isOpen onClose={() => {}} />);
    
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Valid Title');
    
    const form = screen.getByTestId('contribute-modal-shell').querySelector('form')!;
    fireEvent.submit(form);

    expect(alertMock).toHaveBeenCalledWith('请在上传图片/视频与填写 mediaUrl 之间二选一。');

    vi.unstubAllGlobals();
  });

  it('handles network error during fetch', async () => {
    const user = userEvent.setup();
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Fail')));

    render(<ContributeModal isOpen onClose={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Title');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'Prompt');
    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://example.com/a.png');

    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Network Fail'));
    });

    vi.unstubAllGlobals();
  });

  it('renders video preview when a video file is uploaded', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:test-video') });

    render(<ContributeModal isOpen onClose={() => {}} />);

    const file = new File(['fake video data'], 'test.mp4', { type: 'video/mp4' });
    const input = screen.getByTestId('contribute-modal-shell').querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    const video = screen.getByTestId('contribute-modal-shell').querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'blob:test-video');

    vi.unstubAllGlobals();
  });
});
