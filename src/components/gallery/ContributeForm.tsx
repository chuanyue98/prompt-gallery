'use client';

import React from 'react';
import { MODEL_OPTIONS, normalizeModelName } from '@/lib/models';

interface FormData {
  title: string;
  description: string;
  prompt: string;
  tags: string;
  model: string;
  mediaUrl: string;
  sourceUrl: string;
}

interface ContributeFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  submissionMode: 'upload' | 'mediaUrl';
  setSubmissionMode: (mode: 'upload' | 'mediaUrl') => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  onClearFileAndPreview: () => void;
  onParseLink: (url: string) => Promise<void>;
  isParsing: boolean;
  feedbackMessage?: string | null;
  modelOptions?: string[];
  onLoadModelOptions?: () => void | Promise<void>;
}

export const ContributeForm: React.FC<ContributeFormProps> = ({
  formData,
  setFormData,
  submissionMode,
  setSubmissionMode,
  onSubmit,
  isSubmitting,
  canSubmit,
  onClearFileAndPreview,
  onParseLink,
  isParsing,
  feedbackMessage,
  modelOptions = [...MODEL_OPTIONS],
  onLoadModelOptions,
}) => {
  const [isModelFocused, setIsModelFocused] = React.useState(false);
  const modelQuery = formData.model.trim().toLowerCase();
  const filteredModelOptions = modelOptions
    .filter((model) => !modelQuery || model.toLowerCase().includes(modelQuery))
    .slice(0, 8);

  return (
    <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
      <div className="theme-panel inline-flex rounded-2xl p-1" data-testid="contribute-mode-switcher">
        <button
          type="button"
          onClick={() => {
            setSubmissionMode('upload');
            setFormData((current) => ({ ...current, mediaUrl: '' }));
          }}
          className={`rounded-xl px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all ${submissionMode === 'upload' ? 'theme-chip-active' : 'theme-chip'}`}
        >
          上传文件
        </button>
        <button
          type="button"
          onClick={() => {
            setSubmissionMode('mediaUrl');
            onClearFileAndPreview();
          }}
          className={`rounded-xl px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all ${submissionMode === 'mediaUrl' ? 'theme-chip-active' : 'theme-chip'}`}
        >
          Media URL
        </button>
      </div>

      {feedbackMessage ? (
        <div role="alert" className="theme-danger-button rounded-2xl px-4 py-3 text-sm leading-relaxed">
          {feedbackMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">标题 (Title - 必填)</label>
          <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="theme-input w-full rounded-xl px-4 py-2.5 sm:py-3 text-sm" placeholder="例如：赛博朋克猫咪" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">模型 (Engine)</label>
            <input
              value={formData.model}
              role="combobox"
              aria-expanded={isModelFocused && filteredModelOptions.length > 0}
              aria-controls="model-options"
              onChange={e => setFormData({...formData, model: e.target.value})}
              onBlur={e => {
                setFormData({...formData, model: normalizeModelName(e.target.value)});
                setIsModelFocused(false);
              }}
              onFocus={() => {
                setIsModelFocused(true);
                void onLoadModelOptions?.();
              }}
              className="theme-input w-full rounded-xl px-4 py-2.5 sm:py-3 text-sm"
              placeholder="选择或输入模型"
            />
            {isModelFocused && filteredModelOptions.length > 0 ? (
              <div id="model-options" role="listbox" className="theme-panel absolute left-0 right-0 top-full z-20 mt-2 max-h-48 overflow-y-auto rounded-xl p-1 shadow-xl">
                {filteredModelOptions.map((model) => (
                  <button
                    key={model}
                    type="button"
                    role="option"
                    aria-selected={model === formData.model}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFormData({ ...formData, model });
                      setIsModelFocused(false);
                    }}
                    className="theme-option-item block w-full rounded-lg px-3 py-2 text-left text-sm"
                  >
                    {model}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">标签 (逗号分隔)</label>
            <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="theme-input w-full rounded-xl px-4 py-2.5 sm:py-3 text-sm" placeholder="科幻, 电影感, 写实" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">描述 (可选)</label>
          <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="theme-input w-full resize-none rounded-xl px-4 py-2.5 sm:py-3 text-sm" placeholder="补充画面风格、主体或用途，帮助区分作品。" />
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">提示词 (Prompt Syntax)</label>
          <textarea required rows={4} value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} className="theme-input w-full resize-none rounded-xl px-4 py-2.5 sm:py-3 font-mono text-sm" placeholder="完整咒语..." />
        </div>

        {submissionMode === 'mediaUrl' && (
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Media URL</label>
            <input
              value={formData.mediaUrl}
              onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
              className="theme-input w-full rounded-xl px-4 py-2.5 sm:py-3 text-sm"
              placeholder="https://example.com/your-image.png"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Source URL (可选)</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={formData.sourceUrl}
              onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
              className="theme-input flex-grow rounded-xl px-4 py-2.5 sm:py-3 text-sm"
              placeholder="https://x.com/original-post"
            />
            <button
              type="button"
              disabled={isParsing || !formData.sourceUrl.trim()}
              onClick={() => onParseLink(formData.sourceUrl)}
              className={`theme-secondary-button shrink-0 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isParsing ? 'opacity-50' : ''}`}
            >
              {isParsing ? '解析中...' : '自动解析'}
            </button>
          </div>
        </div>
      </div>

      <button disabled={isSubmitting || !canSubmit} type="submit" className={`w-full h-12 sm:h-auto rounded-2xl py-3 sm:py-4 text-sm font-black tracking-widest transition-all ${isSubmitting || !canSubmit ? 'theme-secondary-button opacity-70' : 'theme-primary-button'}`}>
        {isSubmitting ? '正在提交 PR...' : '立即提交 (SUBMIT)'}
      </button>
    </form>
  );
};

export default ContributeForm;
