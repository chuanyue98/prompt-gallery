'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  // 使用 counter 防止子元素触发 dragleave
  const dragCounter = useRef(0);
  const hasMediaUrl = mediaUrl.trim().length > 0;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!submitSuccess && !hasMediaUrl) {
      setIsDragging(true);
    }
  }, [submitSuccess, hasMediaUrl]);

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

    if (submitSuccess || hasMediaUrl) return;

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
  }, [onFileChange, submitSuccess, hasMediaUrl]);

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
          <input type="file" className="hidden" onChange={onFileChange} accept="video/*,image/*" disabled={hasMediaUrl || submitSuccess} />
        </label>
      )}
    </div>
  );
};

export default ContributePreview;
