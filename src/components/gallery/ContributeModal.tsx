'use client';

import Image from 'next/image';
import React, { useState } from 'react';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', prompt: '', tags: '', model: '', mediaUrl: '', sourceUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'upload' | 'mediaUrl'>('upload');
  const [submitSuccess, setSubmissionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setSubmissionMode('upload');
      setFormData((current) => ({ ...current, mediaUrl: '' }));
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

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
        
        // 4秒后自动重置并关闭
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

  const hasMediaUrl = formData.mediaUrl.trim().length > 0;
  const canSubmit = formData.title.trim().length > 0 && (Boolean(file) || hasMediaUrl) && !(Boolean(file) && hasMediaUrl);

  return (
    <div className="theme-overlay fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
      <div data-testid="contribute-modal-shell" className="theme-modal flex w-full max-w-4xl flex-col overflow-hidden rounded-[3rem] md:flex-row">
        {/* Left: Preview */}
        <div className="theme-media-stage flex min-h-[400px] w-full flex-col items-center justify-center border-r p-8 md:w-1/2">
          {preview ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden group">
              {file?.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <Image src={preview} className="w-full h-full object-contain" alt="Preview" fill unoptimized />
              )}
              {!submitSuccess && <button onClick={() => { setFile(null); setPreview(null); }} className="theme-danger-button absolute top-4 right-4 rounded-full p-2">✕</button>}
            </div>
          ) : hasMediaUrl ? (
            <div className="theme-panel flex h-full w-full flex-col items-center justify-center rounded-[2rem] px-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">Media URL</p>
              <p className="mt-4 break-all text-sm text-[var(--text-secondary)]">{formData.mediaUrl}</p>
              {!submitSuccess && (
                <button type="button" onClick={() => setFormData((current) => ({ ...current, mediaUrl: '' }))} className="theme-secondary-button mt-6 rounded-xl px-4 py-2 text-xs font-bold">
                  清空链接
                </button>
              )}
            </div>
          ) : (
            <label className="theme-panel flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📤</div>
              <p className="mb-2 font-bold text-[var(--text-primary)]">点击或拖拽上传</p>
              <p className="text-xs text-[var(--text-muted)]">支持 MP4, PNG, JPG，或改填 mediaUrl</p>
              <input type="file" className="hidden" onChange={handleFileChange} accept="video/*,image/*" disabled={hasMediaUrl || !!submitSuccess} />
            </label>
          )}
        </div>

        {/* Right: Form or Success */}
        <div className="w-full md:w-1/2 p-10 flex flex-col">
          <div className="mb-2 flex justify-end">
            <button aria-label="关闭投稿弹层" type="button" onClick={onClose} className="theme-secondary-button flex h-10 w-10 items-center justify-center rounded-full">✕</button>
          </div>

          {submitSuccess ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 rounded-full bg-[var(--success-bg)] flex items-center justify-center border border-[var(--success-border)] shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                <span className="text-4xl">🎉</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-widest text-[var(--text-primary)]">投稿已发起</h3>
                <p className="text-sm text-[var(--text-secondary)]">您的 Pull Request 已成功提交至仓库。</p>
              </div>
              <div className="theme-panel w-full rounded-2xl p-4 bg-[color-mix(in_srgb,var(--success-bg)_20%,transparent)] border-[var(--success-border)]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">PR 链接</p>
                <a href={submitSuccess} target="_blank" rel="noreferrer" className="text-xs font-mono text-[var(--accent)] break-all hover:underline">{submitSuccess}</a>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] italic animate-pulse">弹窗将在几秒后自动关闭...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
              <div className="theme-panel inline-flex rounded-2xl p-1" data-testid="contribute-mode-switcher">
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionMode('upload');
                    setFormData((current) => ({ ...current, mediaUrl: '' }));
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${submissionMode === 'upload' ? 'theme-chip-active' : 'theme-chip'}`}
                >
                  上传文件
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionMode('mediaUrl');
                    setFile(null);
                    setPreview(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${submissionMode === 'mediaUrl' ? 'theme-chip-active' : 'theme-chip'}`}
                >
                  Media URL
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">标题 (Title - 必填)</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="theme-input w-full rounded-xl px-4 py-3" placeholder="例如：赛博朋克猫咪" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">模型 (Engine)</label>
                    <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="theme-input w-full rounded-xl px-4 py-3" placeholder="Seedance 2.0" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">标签 (逗号分隔)</label>
                    <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="theme-input w-full rounded-xl px-4 py-3" placeholder="科幻, 电影感, 写实" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">描述 (可选)</label>
                  <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="theme-input w-full resize-none rounded-xl px-4 py-3" placeholder="帮助区分作品的描述。" />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">提示词 (Prompt Syntax)</label>
                  <textarea required rows={4} value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} className="theme-input w-full resize-none rounded-xl px-4 py-3 font-mono text-sm" placeholder="完整咒语..." />
                </div>

                {submissionMode === 'mediaUrl' && (
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Media URL</label>
                    <input
                      value={formData.mediaUrl}
                      onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                      className="theme-input w-full rounded-xl px-4 py-3"
                      placeholder="https://example.com/your-image.png"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Source URL (可选)</label>
                  <input
                    value={formData.sourceUrl}
                    onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                    className="theme-input w-full rounded-xl px-4 py-3"
                    placeholder="https://example.com/original-post"
                  />
                </div>
              </div>

              <button disabled={isSubmitting || !canSubmit} type="submit" className={`w-full rounded-2xl py-4 font-black tracking-widest transition-all ${isSubmitting || !canSubmit ? 'theme-secondary-button opacity-70' : 'theme-primary-button'}`}>
                {isSubmitting ? '正在提交 PR...' : '立即提交 (SUBMIT)'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
