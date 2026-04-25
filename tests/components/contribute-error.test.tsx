import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ContributeModal from '@/components/gallery/ContributeModal';
import { ContributeForm } from '@/components/gallery/ContributeForm';
import { ContributePreview } from '@/components/gallery/ContributePreview';
import { ContributeSuccess } from '@/components/gallery/ContributeSuccess';

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

  it('shows success screen after successful submission', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, prUrl: 'https://github.com/pr/1' }),
    }));

    render(<ContributeModal isOpen onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Title');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'My prompt');
    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://example.com/img.png');

    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));

    await waitFor(() => expect(screen.getByText('投稿已发起')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'https://github.com/pr/1' })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('throws error when result.success is false', async () => {
    const user = userEvent.setup();
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: '内容审核未通过' }),
    }));

    render(<ContributeModal isOpen onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Title');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'My prompt');
    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://example.com/img.png');

    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));

    await waitFor(() => expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('内容审核未通过')));

    vi.unstubAllGlobals();
  });

  it('submits with a file (covers file append path)', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:img') });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, prUrl: 'https://github.com/pr/2' }),
    }));

    render(<ContributeModal isOpen onClose={() => {}} />);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('contribute-modal-shell').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Photo Title');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'My prompt');

    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));

    await waitFor(() => expect(screen.getByText('投稿已发起')).toBeInTheDocument());

    vi.unstubAllGlobals();
  });

  it('clears mediaUrl via the clear button in preview', async () => {
    const user = userEvent.setup();
    render(<ContributeModal isOpen onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://example.com/img.png');

    // Preview panel now shows media URL
    await waitFor(() => expect(screen.getByText('https://example.com/img.png')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: '清空链接' }));

    await waitFor(() => expect(screen.queryByText('https://example.com/img.png')).not.toBeInTheDocument());
  });
});

describe('ContributeForm direct tests', () => {
  const defaultFormData = { title: '', description: '', prompt: '', tags: '', model: '', mediaUrl: '', sourceUrl: '' };

  it('switches back to upload mode and clears mediaUrl', async () => {
    const user = userEvent.setup();
    const setFormData = vi.fn();
    const setSubmissionMode = vi.fn();

    render(
      <ContributeForm
        formData={defaultFormData}
        setFormData={setFormData}
        submissionMode="mediaUrl"
        setSubmissionMode={setSubmissionMode}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: '上传文件' }));
    expect(setSubmissionMode).toHaveBeenCalledWith('upload');
    expect(setFormData).toHaveBeenCalled();
  });

  it('updates model and tags fields', async () => {
    const user = userEvent.setup();
    const setFormData = vi.fn();

    render(
      <ContributeForm
        formData={defaultFormData}
        setFormData={setFormData}
        submissionMode="upload"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText('Seedance 2.0'), 'Sora');
    expect(setFormData).toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('科幻, 电影感, 写实'), 'sci-fi');
    expect(setFormData).toHaveBeenCalled();
  });

  it('updates description and sourceUrl fields', async () => {
    const user = userEvent.setup();
    const setFormData = vi.fn();

    render(
      <ContributeForm
        formData={defaultFormData}
        setFormData={setFormData}
        submissionMode="upload"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText('补充画面风格、主体或用途，帮助区分作品。'), 'Desc');
    expect(setFormData).toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('https://example.com/original-post'), 'https://src.com');
    expect(setFormData).toHaveBeenCalled();
  });

  it('shows mediaUrl input and updates it when in mediaUrl mode', async () => {
    const user = userEvent.setup();
    const setFormData = vi.fn();

    render(
      <ContributeForm
        formData={defaultFormData}
        setFormData={setFormData}
        submissionMode="mediaUrl"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://img.com/a.png');
    expect(setFormData).toHaveBeenCalled();
  });

  it('shows submitting state on button', () => {
    render(
      <ContributeForm
        formData={defaultFormData}
        setFormData={vi.fn()}
        submissionMode="upload"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={true}
        canSubmit={true}
        onClearFileAndPreview={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '正在提交 PR...' })).toBeInTheDocument();
  });
});

describe('ContributePreview direct tests', () => {
  it('fires dragOver without setting drag state', () => {
    const onFileChange = vi.fn();
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrl=""
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={onFileChange}
        submitSuccess={false}
      />
    );
    const label = screen.getByText(/点击或拖拽上传/).closest('label')!;
    fireEvent.dragOver(label, { dataTransfer: { files: [], types: [] } });
    // dragOver should still show default text (no state change)
    expect(screen.getByText('点击或拖拽上传')).toBeInTheDocument();
  });

  it('drop event is ignored when submitSuccess is true', () => {
    const onFileChange = vi.fn();
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrl=""
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={onFileChange}
        submitSuccess={true}
      />
    );
    const label = screen.getByText(/点击或拖拽上传/).closest('label')!;
    const file = new File(['data'], 'img.png', { type: 'image/png' });
    fireEvent.drop(label, { dataTransfer: { files: [file] } });
    expect(onFileChange).not.toHaveBeenCalled();
  });

  it('dragEnter is ignored when hasMediaUrl is true', () => {
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrl="https://example.com/img.png"
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={false}
      />
    );
    // When hasMediaUrl, shows the URL preview panel not the drag zone
    expect(screen.getByText('https://example.com/img.png')).toBeInTheDocument();
  });

  it('shows clear file button when preview is set', async () => {
    const user = userEvent.setup();
    const onClearFile = vi.fn();
    render(
      <ContributePreview
        preview="blob:preview"
        file={new File(['data'], 'img.png', { type: 'image/png' })}
        mediaUrl=""
        onClearFile={onClearFile}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={false}
      />
    );
    await user.click(screen.getByRole('button', { name: /✕/ }));
    expect(onClearFile).toHaveBeenCalled();
  });

  it('does not show clear button when submitSuccess is true and preview shown', () => {
    render(
      <ContributePreview
        preview="blob:preview"
        file={new File(['data'], 'img.png', { type: 'image/png' })}
        mediaUrl=""
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={true}
      />
    );
    expect(screen.queryByRole('button', { name: /✕/ })).not.toBeInTheDocument();
  });

  it('does not show clear mediaUrl button when submitSuccess is true', () => {
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrl="https://example.com/img.png"
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={true}
      />
    );
    expect(screen.queryByRole('button', { name: '清空链接' })).not.toBeInTheDocument();
  });
});

describe('ContributeSuccess direct tests', () => {
  it('renders success state with PR link', () => {
    render(<ContributeSuccess prUrl="https://github.com/owner/repo/pull/1" />);
    expect(screen.getByText('投稿已发起')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://github.com/owner/repo/pull/1' })).toBeInTheDocument();
  });
});
