'use client';

import React, { useState } from 'react';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', prompt: '', tags: '', model: 'Seedance 2.0' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    
    try {
      const body = new FormData();
      body.append('file', file);
      Object.entries(formData).forEach(([key, value]) => body.append(key, value));

      const response = await fetch('/api/contribute', { method: 'POST', body });
      const result = await response.json();

      if (result.success) {
        alert('🎉 提交成功！Pull Request 已创建：\n' + result.prUrl);
        onClose();
        setFile(null);
        setPreview(null);
        setFormData({ title: '', description: '', prompt: '', tags: '', model: 'Seedance 2.0' });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert('❌ 提交失败：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Left: Preview */}
        <div className="w-full md:w-1/2 bg-black/50 border-r border-white/5 p-8 flex flex-col items-center justify-center min-h-[400px]">
          {preview ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden group">
              {file?.type.startsWith('video') ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-contain" alt="Preview" />}
              <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full hover:bg-red-600 transition-colors text-white">✕</button>
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📤</div>
              <p className="text-white font-bold mb-2">点击或拖拽上传</p>
              <p className="text-slate-500 text-xs">支持 MP4, PNG, JPG (建议 16:9)</p>
              <input type="file" className="hidden" onChange={handleFileChange} accept="video/*,image/*" />
            </label>
          )}
        </div>

        {/* Right: Form */}
        <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-10 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-white leading-none">我要投稿</h2>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
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
          </div>

          <button disabled={isSubmitting || !file} type="submit" className={`w-full py-4 rounded-2xl font-black text-white tracking-widest transition-all ${isSubmitting || !file ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg'}`}>
            {isSubmitting ? '正在提交 PR...' : '立即提交 (SUBMIT)'}
          </button>
        </form>
      </div>
    </div>
  );
}
