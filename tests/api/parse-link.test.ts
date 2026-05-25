import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/parse-link/route';

describe('POST /api/parse-link', () => {
  it('should return 400 if URL is missing', async () => {
    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('URL is required');
  });

  it('should handle X.com links by converting to fxtwitter.com and refining prompt', async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="Larus Canus (@MrLarus)" />
          <meta property="og:description" content="Some intro here. 提示词：Test prompt here" />
          <meta property="og:image" content="https://pbs.twimg.com/media/test.jpg" />
        </head>
      </html>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://x.com/MrLarus/status/123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.metadata.title).toBe('Larus Canus');
    expect(data.metadata.prompt).toBe('Test prompt here');
    expect(data.metadata.image).toBe('https://pbs.twimg.com/media/test.jpg');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://fxtwitter.com/MrLarus/status/123',
      expect.objectContaining({
        headers: {
          'User-Agent': 'TelegramBot (like TwitterBot)'
        }
      })
    );
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to fetch URL');
  });
});
