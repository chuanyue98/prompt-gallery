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
  const [formData, setFormData] = useState({ description: '', prompt: '', tags: '', model: 'Seedance 2.0', mediaUrl: '', sourceUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'upload' | 'mediaUrl'>('upload');

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
        alert('🎉 提交成功！Pull Request 已创建：\n' + result.prUrl);
        onClose();
        setFile(null);
        setPreview(null);
        setFormData({ description: '', prompt: '', tags: '', model: 'Seedance 2.0', mediaUrl: '', sourceUrl: '' });
        setSubmissionMode('upload');
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
  const canSubmit = (Boolean(file) || hasMediaUrl) && !(Boolean(file) && hasMediaUrl);

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
              <button onClick={() => { setFile(null); setPreview(null); }} className="theme-danger-button absolute top-4 right-4 rounded-full p-2">✕</button>
            </div>
          ) : hasMediaUrl ? (
            <div className="theme-panel flex h-full w-full flex-col items-center justify-center rounded-[2rem] px-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">Media URL</p>
              <p className="mt-4 break-all text-sm text-[var(--text-secondary)]">{formData.mediaUrl}</p>
              <button type="button" onClick={() => setFormData((current) => ({ ...current, mediaUrl: '' }))} className="theme-secondary-button mt-6 rounded-xl px-4 py-2 text-xs font-bold">
                清空链接
              </button>
            </div>
          ) : (
            <label className="theme-panel flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📤</div>
              <p className="mb-2 font-bold text-[var(--text-primary)]">点击或拖拽上传</p>
              <p className="text-xs text-[var(--text-muted)]">支持 MP4, PNG, JPG，或改填 mediaUrl</p>
              <input type="file" className="hidden" onChange={handleFileChange} accept="video/*,image/*" disabled={hasMediaUrl} />
            </label>
          )}
        </div>

        {/* Right: Form */}
        <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-10 space-y-6">
          <div className="mb-2 flex justify-end">
            <button aria-label="关闭投稿弹层" type="button" onClick={onClose} className="theme-secondary-button flex h-10 w-10 items-center justify-center rounded-full">✕</button>
          </div>

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
              <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="theme-input w-full resize-none rounded-xl px-4 py-3" placeholder="补充画面风格、主体或用途，帮助区分作品。" />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">提示词 (Prompt Syntax)</label>
              <textarea required rows={4} value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} className="theme-input w-full resize-none rounded-xl px-4 py-3 font-mono text-sm" placeholder="输入生成这个画面的完整咒语..." />
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
                <p className="mt-2 text-xs text-[var(--text-muted)]">请填写媒体直链，必须直接指向图片或视频文件。</p>
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
              <p className="mt-2 text-xs text-[var(--text-muted)]">用于详情页“查看来源”按钮，可填写原帖、作品页或参考页面链接。</p>
            </div>

            {submissionMode === 'upload' && (
              <div className="theme-panel rounded-2xl px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">上传方式</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">请在左侧区域点击选择文件或拖拽上传，支持图片和视频。</p>
              </div>
            )}
          </div>

          <button disabled={isSubmitting || !canSubmit} type="submit" className={`w-full rounded-2xl py-4 font-black tracking-widest transition-all ${isSubmitting || !canSubmit ? 'theme-secondary-button opacity-70' : 'theme-primary-button'}`}>
            {isSubmitting ? '正在提交 PR...' : '立即提交 (SUBMIT)'}
          </button>
        </form>
      </div>
    </div>
  );
}
