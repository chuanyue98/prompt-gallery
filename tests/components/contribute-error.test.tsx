import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import ContributeModal from '@/components/gallery/ContributeModal';
import { ContributeForm } from '@/components/gallery/ContributeForm';
import { ContributePreview } from '@/components/gallery/ContributePreview';
import ContributeSuccess from '@/components/gallery/ContributeSuccess';

describe('ContributeModal validation and errors', () => {
  it('shows validation error if title is empty', async () => {
    render(<ContributeModal isOpen onClose={() => {}} />);
    
    const form = screen.getByTestId('contribute-modal-shell').querySelector('form')!;
    fireEvent.submit(form);
    
    expect(await screen.findByRole('alert')).toHaveTextContent('请填写作品标题');
  });

  it('shows error when both file and mediaUrl are missing', async () => {
    const user = userEvent.setup();
    render(<ContributeModal isOpen onClose={() => {}} />);
    
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'My Title');
    const form = screen.getByTestId('contribute-modal-shell').querySelector('form')!;
    fireEvent.submit(form);
    
    expect(await screen.findByRole('alert')).toHaveTextContent('二选一');
  });

  it('successfully submits with valid data and file', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, prUrl: 'https://github.com/pr/1' }),
    }));

    render(<ContributeModal isOpen onClose={() => {}} />);

    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    const input = screen.getByTestId('contribute-modal-shell').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Photo Title');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'My prompt');

    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));

    await waitFor(() => expect(screen.getByText('投稿已发起')).toBeInTheDocument());

    vi.unstubAllGlobals();
  });

  it('shows readable error when API returns non-JSON 413 text', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 413,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve('Request Entity Too Large'),
    }));

    render(<ContributeModal isOpen onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('例如：赛博朋克猫咪'), 'Photo Title');
    await user.type(screen.getByPlaceholderText('完整咒语...'), 'My prompt');
    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://example.com/img.png');

    await user.click(screen.getByRole('button', { name: '立即提交 (SUBMIT)' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('上传文件过大'));
    expect(screen.getByRole('alert')).not.toHaveTextContent('Unexpected token');

    vi.unstubAllGlobals();
  });

  it('rejects oversized uploads before submitting', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ContributeModal isOpen onClose={() => {}} />);

    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.mp4', { type: 'video/mp4' });
    const input = screen.getByTestId('contribute-modal-shell').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByRole('alert')).toHaveTextContent('文件过大');
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('clears mediaUrl via the clear button in preview', async () => {
    const user = userEvent.setup();
    render(<ContributeModal isOpen onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Media URL' }));
    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://example.com/img.png');

    // Preview panel now shows image with src
    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Preview' });
      expect(img).toHaveAttribute('src', 'https://example.com/img.png');
    });

    await user.click(screen.getByRole('button', { name: '✕' }));

    await waitFor(() => expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument());
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
        formData={{ ...defaultFormData, mediaUrl: '' }}
        setFormData={setFormData}
        submissionMode="mediaUrl"
        setSubmissionMode={setSubmissionMode}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
        onParseLink={vi.fn()}
        isParsing={false}
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
        formData={{ ...defaultFormData, mediaUrl: '' }}
        setFormData={setFormData}
        submissionMode="upload"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
        onParseLink={vi.fn()}
        isParsing={false}
      />
    );

    await user.type(screen.getByPlaceholderText('选择或输入模型'), 'Sora');
    expect(setFormData).toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('科幻, 电影感, 写实'), 'sci-fi');
    expect(setFormData).toHaveBeenCalled();
  });

  it('filters model suggestions as the user types', async () => {
    const user = userEvent.setup();

    function FormWrapper() {
      const [formData, setFormData] = useState(defaultFormData);

      return (
        <ContributeForm
          formData={formData}
          setFormData={setFormData}
          submissionMode="upload"
          setSubmissionMode={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          canSubmit={false}
          onClearFileAndPreview={vi.fn()}
          onParseLink={vi.fn()}
          isParsing={false}
          modelOptions={['GPT-Image 2', 'Gemini 2.5 Flash Image', 'Sora']}
        />
      );
    }

    render(<FormWrapper />);

    await user.type(screen.getByPlaceholderText('选择或输入模型'), 'G');

    expect(screen.getByRole('option', { name: 'GPT-Image 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gemini 2.5 Flash Image' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sora' })).not.toBeInTheDocument();
  });

  it('updates description and sourceUrl fields', async () => {
    const user = userEvent.setup();
    const setFormData = vi.fn();

    render(
      <ContributeForm
        formData={{ ...defaultFormData, mediaUrl: '' }}
        setFormData={setFormData}
        submissionMode="upload"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
        onParseLink={vi.fn()}
        isParsing={false}
      />
    );

    await user.type(screen.getByPlaceholderText('补充画面风格、主体或用途，帮助区分作品。'), 'Desc');
    expect(setFormData).toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('https://x.com/original-post'), 'https://src.com');
    expect(setFormData).toHaveBeenCalled();
  });

  it('shows mediaUrl input and updates it when in mediaUrl mode', async () => {
    const user = userEvent.setup();
    const setFormData = vi.fn();

    render(
      <ContributeForm
        formData={{ ...defaultFormData, mediaUrl: '' }}
        setFormData={setFormData}
        submissionMode="mediaUrl"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        canSubmit={false}
        onClearFileAndPreview={vi.fn()}
        onParseLink={vi.fn()}
        isParsing={false}
      />
    );

    await user.type(screen.getByPlaceholderText('https://example.com/your-image.png'), 'https://img.com');
    expect(setFormData).toHaveBeenCalled();
  });

  it('disables submit button when isSubmitting is true', () => {
    render(
      <ContributeForm
        formData={{ ...defaultFormData, mediaUrl: '' }}
        setFormData={vi.fn()}
        submissionMode="upload"
        setSubmissionMode={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={true}
        canSubmit={true}
        onClearFileAndPreview={vi.fn()}
        onParseLink={vi.fn()}
        isParsing={false}
      />
    );
    expect(screen.getByRole('button', { name: '正在提交 PR...' })).toBeDisabled();
  });
});

describe('ContributePreview direct tests', () => {
  it('fires dragOver without setting drag state', () => {
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrls={[]}
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={false}
      />
    );
    const label = screen.getByText('点击或拖拽上传').closest('label')!;
    fireEvent.dragOver(label);
    expect(screen.getByText('📤')).toBeInTheDocument();
  });

  it('drop event is ignored when submitSuccess is true', () => {
    const onFileChange = vi.fn();
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrls={[]}
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={onFileChange}
        submitSuccess={true}
      />
    );
    const label = screen.getByText('点击或拖拽上传').closest('label')!;
    fireEvent.drop(label, { dataTransfer: { files: [new File([], 'a.png')] } });
    expect(onFileChange).not.toHaveBeenCalled();
  });

  it('dragEnter is ignored when mediaUrls is not empty', () => {
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrls={['http://a.com/b.png']}
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={false}
      />
    );
    const img = screen.getByRole('img', { name: 'Preview' });
    fireEvent.dragEnter(img);
    expect(screen.queryByText('📥')).not.toBeInTheDocument();
  });

  it('shows clear file button when preview is set', () => {
    const onClearFile = vi.fn();
    render(
      <ContributePreview
        preview="blob:url"
        file={new File([], 'a.png', { type: 'image/png' })}
        mediaUrls={[]}
        onClearFile={onClearFile}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={false}
      />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClearFile).toHaveBeenCalled();
  });

  it('does not show clear button when submitSuccess is true and preview shown', () => {
    render(
      <ContributePreview
        preview="blob:url"
        file={new File([], 'a.png', { type: 'image/png' })}
        mediaUrls={[]}
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={true}
      />
    );
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('does not show clear mediaUrl button when submitSuccess is true', () => {
    render(
      <ContributePreview
        preview={null}
        file={null}
        mediaUrls={['http://a.com/b.png']}
        onClearFile={vi.fn()}
        onClearMediaUrl={vi.fn()}
        onFileChange={vi.fn()}
        submitSuccess={true}
      />
    );
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });
});

import { DetailModal } from '@/components/gallery/DetailModal';

describe('DetailModal multi-media navigation', () => {
  const mockItem = {
    slug: 'test-item',
    description: 'desc',
    tags: ['tag1'],
    mediaPath: '/data/',
    media: [
      { type: 'image' as const, src: 'img1.png', cover: 'img1.png' },
      { type: 'image' as const, src: 'img2.png', cover: 'img2.png' },
    ],
    content: '### Prompt\nTest prompt',
  };

  it('navigates through multiple media items', async () => {
    const user = userEvent.setup();
    render(
      <DetailModal
        item={mockItem}
        onClose={vi.fn()}
        onCopy={vi.fn()}
        copiedSlug={null}
        onLightboxOpen={vi.fn()}
        showDeleteForm={false}
        setShowDeleteForm={vi.fn()}
        deleteReason=""
        setDeleteReason={vi.fn()}
        onDeleteRequest={vi.fn()}
        isDeleting={false}
        deleteSuccess={false}
      />
    );

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    
    // Next image
    await user.click(screen.getByRole('button', { name: 'Next media' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Previous image (back to 1)
    await user.click(screen.getByRole('button', { name: 'Previous media' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});

describe('ContributeSuccess direct tests', () => {
  it('renders correctly with PR URL', () => {
    render(<ContributeSuccess prUrl="https://github.com/pull/1" />);
    expect(screen.getByText('投稿已发起')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://github.com/pull/1');
  });
});
