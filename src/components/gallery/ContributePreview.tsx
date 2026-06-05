'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ContributePreviewProps {
  preview: string | null;
  file: File | null;
  mediaUrls: string[];
  onClearFile: () => void;
  onClearMediaUrl: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitSuccess: boolean;
}

export const ContributePreview: React.FC<ContributePreviewProps> = ({
  preview,
  file,
  mediaUrls,
  onClearFile,
  onClearMediaUrl,
  onFileChange,
  submitSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Reset index when preview changes or mediaUrls change
  React.useEffect(() => {
    setCurrentMediaIndex(0);
  }, [preview, mediaUrls.length]);

  // 使用 counter 防止子元素触发 dragleave
  const dragCounter = useRef(0);
  const hasMediaUrls = mediaUrls.length > 0;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!submitSuccess && !hasMediaUrls) {
      setIsDragging(true);
    }
  }, [submitSuccess, hasMediaUrls]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 某些浏览器需要 dragOver 持续阻止默认行为
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (submitSuccess || hasMediaUrls) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      // 构造一个模拟的 ChangeEvent 来复用原有的 onFileChange 逻辑
      const mockEvent = {
        target: {
          files: droppedFiles
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(mockEvent);
    }
  }, [onFileChange, submitSuccess, hasMediaUrls]);

  const currentPreview = mediaUrls.length > 0 ? mediaUrls[currentMediaIndex] : preview;

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  return (
    <div className="theme-media-stage flex min-h-[240px] sm:min-h-[400px] w-full flex-col items-center justify-center border-b sm:border-b-0 sm:border-r p-6 sm:p-8 md:w-1/2 shrink-0">
      {currentPreview ? (
        <div className="relative w-full h-full rounded-2xl overflow-hidden group aspect-video sm:aspect-auto">
          {file?.type.startsWith('video') ? (
            <video src={currentPreview} className="w-full h-full object-contain" controls />
          ) : (
            <Image key={currentPreview} src={currentPreview} className="w-full h-full object-contain" alt="Preview" fill unoptimized />
          )}
          
          {mediaUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevMedia}
                aria-label="Previous media"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur-md transition-all hover:bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextMedia}
                aria-label="Next media"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur-md transition-all hover:bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md">
                {currentMediaIndex + 1} / {mediaUrls.length}
              </div>
            </>
          )}

          {!submitSuccess && (
            <button 
              type="button"
              title="清除当前媒体"
              onClick={() => {
                if (file) onClearFile();
                else if (mediaUrls.length > 0) onClearMediaUrl();
              }} 
              className="theme-danger-button absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full p-2"
            >
              ✕
            </button>
          )}
        </div>
      ) : hasMediaUrls ? (
        <div className="theme-panel flex h-full w-full flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-8 text-center py-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">
            {mediaUrls.length} Media Item{mediaUrls.length > 1 ? 's' : ''}
          </p>
          <p className="mt-4 break-all text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-3">
            {mediaUrls[0]} {mediaUrls.length > 1 ? '...' : ''}
          </p>
          {!submitSuccess && (
            <button type="button" onClick={onClearMediaUrl} className="theme-secondary-button mt-6 rounded-xl px-4 py-2 text-[10px] sm:text-xs font-bold">
              清空链接
            </button>
          )}
        </div>
      ) : (
        <label 
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`theme-panel flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] border-2 border-dashed group py-10 sm:py-0 transition-all duration-300 ${
            isDragging ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] scale-[0.98]' : 'border-[var(--border-soft)] hover:border-[var(--accent)]'
          }`}
        >
          <div className="pointer-events-none text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">
            {isDragging ? '📥' : '📤'}
          </div>
          <p className="pointer-events-none mb-2 font-bold transition-colors">
            {isDragging ? '松开即刻上传' : '点击或拖拽上传'}
          </p>
          <p className="pointer-events-none text-[10px] sm:text-xs text-[var(--text-muted)]">支持 MP4, PNG, JPG，或改填 mediaUrl</p>
          <input type="file" className="hidden" onChange={onFileChange} accept="video/*,image/*" disabled={hasMediaUrls || submitSuccess} />
        </label>
      )}
    </div>
  );
};

export default ContributePreview;
