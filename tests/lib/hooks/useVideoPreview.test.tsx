import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { useVideoPreview } from "@/lib/hooks/useVideoPreview";

function VideoTest({ enabled }: { enabled: boolean }) {
  const videoRef = useVideoPreview(enabled);
  return <video ref={videoRef} data-testid="video" />;
}

describe("useVideoPreview", () => {
  it("does nothing when disabled", () => {
    render(<VideoTest enabled={false} />);
  });

  it("sets up observer when enabled", () => {
    const { unmount } = render(<VideoTest enabled={true} />);
    unmount();
  });

  it("plays/pauses via observer callback", () => {
    let cb: (entries: Array<{ isIntersecting: boolean; intersectionRatio: number }>) => void = () => {};
    const Orig = globalThis.IntersectionObserver;
    class MockIO {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds = [];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn();
      constructor(fn: typeof cb) { cb = fn; }
    }
    globalThis.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;
    const playSpy = vi.fn().mockResolvedValue(undefined);
    const pauseSpy = vi.fn();
    const { container } = render(<VideoTest enabled={true} />);
    const v = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(v, "play", { value: playSpy, configurable: true });
    Object.defineProperty(v, "pause", { value: pauseSpy, configurable: true });
    cb([{ isIntersecting: true, intersectionRatio: 0.6 }]);
    expect(playSpy).toHaveBeenCalled();
    cb([{ isIntersecting: false, intersectionRatio: 0.1 }]);
    expect(pauseSpy).toHaveBeenCalled();
    globalThis.IntersectionObserver = Orig;
  });
});
