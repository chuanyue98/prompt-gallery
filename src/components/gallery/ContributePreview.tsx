'use client';

import React from 'react';
import Image from 'next/image';

interface ContributePreviewProps {
  preview: string | null;
  file: File | null;
  mediaUrl: string;
  onClearFile: () => void;
  onClearMediaUrl: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitSuccess: boolean;
}

export const ContributePreview: React.FC<ContributePreviewProps> = ({
  preview,
  file,
  mediaUrl,
  onClearFile,
  onClearMediaUrl,
  onFileChange,
  submitSuccess,
}) => {
  const hasMediaUrl = mediaUrl.trim().length > 0;

  return (
    <div className="theme-media-stage flex min-h-[240px] sm:min-h-[400px] w-full flex-col items-center justify-center border-b sm:border-b-0 sm:border-r p-6 sm:p-8 md:w-1/2 shrink-0">
      {preview ? (
        <div className="relative w-full h-full rounded-2xl overflow-hidden group aspect-video sm:aspect-auto">
          {file?.type.startsWith('video') ? (
            <video src={preview} className="w-full h-full object-contain" controls />
          ) : (
            <Image src={preview} className="w-full h-full object-contain" alt="Preview" fill unoptimized />
          )}
          {!submitSuccess && (
            <button onClick={onClearFile} className="theme-danger-button absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full p-2">✕</button>
          )}
        </div>
      ) : hasMediaUrl ? (
        <div className="theme-panel flex h-full w-full flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-8 text-center py-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">Media URL</p>
          <p className="mt-4 break-all text-xs sm:text-sm text-[var(--text-secondary)]">{mediaUrl}</p>
          {!submitSuccess && (
            <button type="button" onClick={onClearMediaUrl} className="theme-secondary-button mt-6 rounded-xl px-4 py-2 text-[10px] sm:text-xs font-bold">
              清空链接
            </button>
          )}
        </div>
      ) : (
        <label className="theme-panel flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] border-2 border-dashed group py-10 sm:py-0">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📤</div>
          <p className="mb-2 font-bold text-[var(--text-primary)]">点击或拖拽上传</p>
          <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">支持 MP4, PNG, JPG，或改填 mediaUrl</p>
          <input type="file" className="hidden" onChange={onFileChange} accept="video/*,image/*" disabled={hasMediaUrl || submitSuccess} />
        </label>
      )}
    </div>
  );
};

export default ContributePreview;
