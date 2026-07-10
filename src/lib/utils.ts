export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 过滤掉 Markdown 标题
    const cleanText = text.replace(/###.*?\n/g, '').trim();
    await navigator.clipboard.writeText(cleanText);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export const randomHex5 = (): string => Math.floor(Math.random() * 0x100000).toString(16).padStart(5, '0');

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 30) + '-' + randomHex5();
};

export async function fetchWithTimeout(
  input: URL | RequestInfo,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { signal, timeoutMs, ...restInit } = init ?? {};
    void signal;
    void timeoutMs;
    const response = await fetch(input, {
      ...restInit,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
