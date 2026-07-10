import { describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout } from '@/lib/utils';

describe('fetchWithTimeout', () => {
  it('returns response when fetch resolves before timeout', async () => {
    const mockResponse = { ok: true, text: () => Promise.resolve('ok') } as unknown as Response;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com', { timeoutMs: 5000 });

    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com', expect.objectContaining({}));

    global.fetch = originalFetch;
  });

  it('aborts and throws when fetch exceeds timeout', async () => {
    vi.useFakeTimers();

    let rejectFetch: (error: Error) => void;
    const fetchPromise = new Promise((_, reject) => {
      rejectFetch = reject;
    });
    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    const promise = fetchWithTimeout('https://example.com', { timeoutMs: 1000 });

    await vi.advanceTimersByTimeAsync(1000);

    rejectFetch!(new DOMException('Aborted', 'AbortError'));

    let caughtError: unknown;
    try {
      await promise;
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as Error)?.name).toBe('AbortError');

    vi.useRealTimers();
    global.fetch = fetch;
  });

  it('does not override caller-provided signal', async () => {
    const mockResponse = { ok: true, text: () => Promise.resolve('ok') } as unknown as Response;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const callerSignal = new AbortController().signal;

    await fetchWithTimeout('https://example.com', {
      timeoutMs: 5000,
      signal: callerSignal,
    });

    const callInit = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<string, unknown> | undefined;
    expect(callInit?.signal).toBeDefined();
    expect(callInit?.signal).not.toBe(callerSignal);

    global.fetch = originalFetch;
  });
});
