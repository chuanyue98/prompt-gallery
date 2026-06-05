'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ContributePreview from './ContributePreview';
import ContributeForm from './ContributeForm';
import ContributeSuccess from './ContributeSuccess';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_UPLOAD_FILE_SIZE_BYTES = 4 * 1024 * 1024;

function formatUploadLimit() {
  return `${MAX_UPLOAD_FILE_SIZE_BYTES / 1024 / 1024}MB`;
}

function normalizeNonJsonError(response: Response, text: string) {
  if (response.status === 413 || text.includes('Request Entity Too Large')) {
    return `上传文件过大，请压缩到 ${formatUploadLimit()} 以内，或改用 Media URL 投稿。`;
  }

  const contentType = response.headers?.get('content-type') || '';
  if (contentType.includes('text/html') || text.trim().startsWith('<')) {
    return `请求失败（HTTP ${response.status}）`;
  }

  return text.trim() || `请求失败（HTTP ${response.status}）`;
}

async function readApiResponse(response: Response) {
  const contentType = response.headers?.get('content-type') || '';

  if (contentType.includes('application/json') || !('text' in response)) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(normalizeNonJsonError(response, text));
  }
}

export default function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    prompt: '', 
    tags: '', 
    model: '', 
    mediaUrls: [] as string[], 
    sourceUrl: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'upload' | 'mediaUrl'>('upload');
  const [submitSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setFeedbackMessage(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleParseLink = useCallback(async (url: string) => {
    if (!url) return;
    setFeedbackMessage(null);
    setIsParsing(true);
    try {
      const response = await fetch('/api/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result = await readApiResponse(response);
      if (result.success && result.metadata) {
        const { title, prompt, images, video } = result.metadata;
        const mediaUrls = video ? [video] : images || [];
        
        setFormData((prev) => ({
          ...prev,
          title: title || prev.title,
          prompt: prompt || prev.prompt,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : prev.mediaUrls,
        }));

        if (mediaUrls.length > 0) {
          setSubmissionMode('mediaUrl');
          setFile(null);
          setPreview(mediaUrls[0]);
        }
      } else {
        throw new Error(result.error || '解析失败');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '解析失败';
      setFeedbackMessage(`解析失败：${message}`);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
        setFeedbackMessage(`文件过大，请压缩到 ${formatUploadLimit()} 以内，或改用 Media URL 投稿。`);
        e.target.value = '';
        return;
      }

      setFeedbackMessage(null);
      setSubmissionMode('upload');
      setFormData((current) => ({ ...current, mediaUrls: [] }));
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
  }, []);

  const handleClearMediaUrl = useCallback(() => {
    setFormData((current) => ({ ...current, mediaUrls: [] }));
    setPreview(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFile = Boolean(file);
    const hasMediaUrls = formData.mediaUrls.length > 0;
    setFeedbackMessage(null);

    if (!formData.title.trim()) {
      setFeedbackMessage('请填写作品标题。');
      return;
    }

    if ((hasFile && hasMediaUrls) || (!hasFile && !hasMediaUrls)) {
      setFeedbackMessage('请在上传图片/视频与填写 Media URL 之间二选一。');
      return;
    }

    if (file && file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      setFeedbackMessage(`文件过大，请压缩到 ${formatUploadLimit()} 以内，或改用 Media URL 投稿。`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const body = new FormData();
      if (file) {
        body.append('file', file);
      }
      
      // Append all fields except mediaUrls
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'mediaUrls') {
          body.append(key, value as string);
        }
      });
      
      // Append each mediaUrl separately
      formData.mediaUrls.forEach(url => body.append('mediaUrl', url));

      const response = await fetch('/api/contribute', { method: 'POST', body });
      const result = await readApiResponse(response);

      if (result.success) {
        setSubmissionSuccess(result.prUrl);
        
        /* v8 ignore next 7 */
        setTimeout(() => {
          onClose();
          setSubmissionSuccess(null);
          setFeedbackMessage(null);
          setFile(null);
          setPreview(null);
          setFormData({ title: '', description: '', prompt: '', tags: '', model: '', mediaUrls: [], sourceUrl: '' });
          setSubmissionMode('upload');
        }, 4000);
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      setFeedbackMessage(`提交失败：${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasMediaUrls = formData.mediaUrls.length > 0;
  const canSubmit = formData.title.trim().length > 0 && (Boolean(file) || hasMediaUrls) && !(Boolean(file) && hasMediaUrls);

  return (
    <div className="theme-overlay fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-xl animate-in fade-in duration-300">
      <div data-testid="contribute-modal-shell" className="theme-modal flex h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[3rem] md:flex-row">
        <ContributePreview 
          preview={preview}
          file={file}
          mediaUrls={formData.mediaUrls}
          onClearFile={handleClearFile}
          onClearMediaUrl={handleClearMediaUrl}
          onFileChange={handleFileChange}
          submitSuccess={Boolean(submitSuccess)}
        />

        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col overflow-hidden">
          <div className="mb-4 sm:mb-2 flex justify-end shrink-0">
            <button aria-label="关闭投稿弹层" type="button" onClick={handleClose} className="theme-secondary-button flex h-10 w-10 items-center justify-center rounded-full">✕</button>
          </div>

          {submitSuccess ? (
            <ContributeSuccess prUrl={submitSuccess} />
          ) : (
            <ContributeForm 
              formData={{
                ...formData,
                mediaUrl: formData.mediaUrls.join(', ')
              }}
              setFormData={(dataOrFn) => {
                setFormData((prev) => {
                  const nextRaw = typeof dataOrFn === 'function' ? dataOrFn({
                    ...prev,
                    mediaUrl: prev.mediaUrls.join(', ')
                  }) : dataOrFn;
                  
                  const mediaUrls = nextRaw.mediaUrl ? nextRaw.mediaUrl.split(',').map((u: string) => u.trim()).filter(Boolean) : [];
                  
                  const next = {
                    ...prev,
                    ...nextRaw,
                    mediaUrls
                  } as typeof prev & { mediaUrl?: string };
                  delete next.mediaUrl;

                  if (submissionMode === 'mediaUrl' && next.mediaUrls[0] !== prev.mediaUrls[0]) {
                    setPreview(next.mediaUrls[0] || null);
                  }
                  return next;
                });
              }}
              submissionMode={submissionMode}
              setSubmissionMode={setSubmissionMode}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canSubmit={canSubmit}
              onClearFileAndPreview={handleClearFile}
              onParseLink={handleParseLink}
              isParsing={isParsing}
              feedbackMessage={feedbackMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
