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
  const [formData, setFormData] = useState({ title: '', description: '', prompt: '', tags: '', model: 'Seedance 2.0', mediaUrl: '', sourceUrl: '' });
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
        setFormData({ title: '', description: '', prompt: '', tags: '', model: 'Seedance 2.0', mediaUrl: '', sourceUrl: '' });
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Left: Preview */}
        <div className="w-full md:w-1/2 bg-black/50 border-r border-white/5 p-8 flex flex-col items-center justify-center min-h-[400px]">
          {preview ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden group">
              {file?.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <Image src={preview} className="w-full h-full object-contain" alt="Preview" fill unoptimized />
              )}
              <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full hover:bg-red-600 transition-colors text-white">✕</button>
            </div>
          ) : hasMediaUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center border border-blue-500/20 bg-blue-500/5 rounded-[2rem] px-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Media URL</p>
              <p className="mt-4 break-all text-sm text-slate-300">{formData.mediaUrl}</p>
              <button type="button" onClick={() => setFormData((current) => ({ ...current, mediaUrl: '' }))} className="mt-6 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-white/30 hover:text-white">
                清空链接
              </button>
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📤</div>
              <p className="text-white font-bold mb-2">点击或拖拽上传</p>
              <p className="text-slate-500 text-xs">支持 MP4, PNG, JPG，或改填 mediaUrl</p>
              <input type="file" className="hidden" onChange={handleFileChange} accept="video/*,image/*" disabled={hasMediaUrl} />
            </label>
          )}
        </div>

        {/* Right: Form */}
        <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-10 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-white leading-none">我要投稿</h2>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => {
                setSubmissionMode('upload');
                setFormData((current) => ({ ...current, mediaUrl: '' }));
              }}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${submissionMode === 'upload' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
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
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${submissionMode === 'mediaUrl' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Media URL
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">作品标题</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="例如：赛博深海 - 遗落神殿" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">模型 (Engine)</label>
                <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" placeholder="Seedance 2.0" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">标签 (逗号分隔)</label>
                <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" placeholder="科幻, 电影感, 写实" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">提示词 (Prompt Syntax)</label>
              <textarea required rows={4} value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono text-sm" placeholder="输入生成这个画面的完整咒语..." />
            </div>

            {submissionMode === 'mediaUrl' && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Media URL</label>
                <input
                  value={formData.mediaUrl}
                  onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="https://example.com/your-image.png"
                />
                <p className="mt-2 text-xs text-slate-500">请填写媒体直链，必须直接指向图片或视频文件。</p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Source URL (可选)</label>
              <input
                value={formData.sourceUrl}
                onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="https://example.com/original-post"
              />
              <p className="mt-2 text-xs text-slate-500">用于详情页“查看来源”按钮，可填写原帖、作品页或参考页面链接。</p>
            </div>

            {submissionMode === 'upload' && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">上传方式</p>
                <p className="mt-2 text-sm text-slate-400">请在左侧区域点击选择文件或拖拽上传，支持图片和视频。</p>
              </div>
            )}
          </div>

          <button disabled={isSubmitting || !canSubmit} type="submit" className={`w-full py-4 rounded-2xl font-black text-white tracking-widest transition-all ${isSubmitting || !canSubmit ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg'}`}>
            {isSubmitting ? '正在提交 PR...' : '立即提交 (SUBMIT)'}
          </button>
        </form>
      </div>
    </div>
  );
}
