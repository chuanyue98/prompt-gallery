'use client';

import React, { useState, useCallback } from 'react';
import ContributePreview from './ContributePreview';
import ContributeForm from './ContributeForm';
import ContributeSuccess from './ContributeSuccess';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    mediaUrl: '', 
    sourceUrl: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'upload' | 'mediaUrl'>('upload');
  const [submitSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setSubmissionMode('upload');
      setFormData((current) => ({ ...current, mediaUrl: '' }));
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
    setFormData((current) => ({ ...current, mediaUrl: '' }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFile = Boolean(file);
    const hasMediaUrl = formData.mediaUrl.trim().length > 0;

    if (!formData.title.trim()) {
      alert('请填写作品标题。');
      return;
    }

    if ((hasFile && hasMediaUrl) || (!hasFile && !hasMediaUrl)) {
      alert('请在上传图片/视频与填写 mediaUrl 之间二选一。');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const body = new FormData();
      if (file) {
        body.append('file', file);
      }
      Object.entries(formData).forEach(([key, value]) => body.append(key, value));

      const response = await fetch('/api/contribute', { method: 'POST', body });
      const result = await response.json();

      if (result.success) {
        setSubmissionSuccess(result.prUrl);
        
        setTimeout(() => {
          onClose();
          setSubmissionSuccess(null);
          setFile(null);
          setPreview(null);
          setFormData({ title: '', description: '', prompt: '', tags: '', model: '', mediaUrl: '', sourceUrl: '' });
          setSubmissionMode('upload');
        }, 4000);
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      alert('❌ 提交失败：' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasMediaUrl = formData.mediaUrl.trim().length > 0;
  const canSubmit = formData.title.trim().length > 0 && (Boolean(file) || hasMediaUrl) && !(Boolean(file) && hasMediaUrl);

  return (
    <div className="theme-overlay fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-xl animate-in fade-in duration-300">
      <div data-testid="contribute-modal-shell" className="theme-modal flex h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[3rem] md:flex-row">
        <ContributePreview 
          preview={preview}
          file={file}
          mediaUrl={formData.mediaUrl}
          onClearFile={handleClearFile}
          onClearMediaUrl={handleClearMediaUrl}
          onFileChange={handleFileChange}
          submitSuccess={Boolean(submitSuccess)}
        />

        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col overflow-hidden">
          <div className="mb-4 sm:mb-2 flex justify-end shrink-0">
            <button aria-label="关闭投稿弹层" type="button" onClick={onClose} className="theme-secondary-button flex h-10 w-10 items-center justify-center rounded-full">✕</button>
          </div>

          {submitSuccess ? (
            <ContributeSuccess prUrl={submitSuccess} />
          ) : (
            <ContributeForm 
              formData={formData}
              setFormData={setFormData}
              submissionMode={submissionMode}
              setSubmissionMode={setSubmissionMode}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canSubmit={canSubmit}
              onClearFileAndPreview={handleClearFile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
