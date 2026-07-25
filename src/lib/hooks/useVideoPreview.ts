import { useEffect, useRef } from 'react';

export function useVideoPreview(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    const prefersHover = window.matchMedia('(hover: hover)').matches;
    if (prefersHover) return;

    const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
    if (prefersReducedData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [enabled]);

  return videoRef;
}
