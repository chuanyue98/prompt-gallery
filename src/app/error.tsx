'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="main flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="theme-panel max-w-md rounded-[2rem] px-8 py-10">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
          Something went wrong
        </div>
        <h2 className="mt-3 text-xl font-black">页面加载异常</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          抱歉，页面渲染时遇到错误。请尝试重新加载，若问题持续可联系管理员。
        </p>
        <button
          type="button"
          onClick={reset}
          className="theme-primary-button mt-6 inline-flex min-h-[44px] items-center rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-[0.18em]"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}
