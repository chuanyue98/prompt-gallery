'use client';

import React from 'react';
import { IconExternalLink } from '@/components/icons';

interface ContributeSuccessProps {
  prUrl: string;
  onClose: () => void;
}

export const ContributeSuccess: React.FC<ContributeSuccessProps> = ({ prUrl, onClose }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500 overflow-y-auto">
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--success-bg)] flex items-center justify-center border border-[var(--success-border)] shadow-[0_0_40px_rgba(34,197,94,0.15)] shrink-0">
        <span className="text-3xl sm:text-4xl">🎉</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest text-[var(--text-primary)]">投稿已发起</h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">您的 Pull Request 已成功提交至仓库，请等待审核。</p>
      </div>
      <div className="theme-panel w-full rounded-2xl p-4 bg-[color-mix(in_srgb,var(--success-bg)_20%,transparent)] border-[var(--success-border)]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">PR 链接</p>
        <a href={prUrl} target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs font-mono text-[var(--accent)] break-all hover:underline inline-flex items-center gap-1">
          <IconExternalLink size={12} /> {prUrl}
        </a>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="theme-primary-button inline-flex min-h-[44px] items-center rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-[0.2em]"
      >
        完成
      </button>
    </div>
  );
};

export default ContributeSuccess;
