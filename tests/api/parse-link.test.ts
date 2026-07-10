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
          <meta property="og:image" content="https://mosaic.fxtwitter.com/jpeg/123/abc/def" />
        </head>
        <body>
          <img src="https://pbs.fxtwitter.com/media/img1.jpg" />
          <img src="https://pbs.fxtwitter.com/media/img2.jpg" />
        </body>
      </html>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://twitter.com/MrLarus/status/123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.metadata.title).toBe('Larus Canus');
    expect(data.metadata.prompt).toBe('Test prompt here');
    // Should prefer first individual image over mosaic
    expect(data.metadata.image).toBe('https://pbs.fxtwitter.com/media/img1.jpg?name=orig');
    expect(data.metadata.images).toContain('https://pbs.fxtwitter.com/media/img1.jpg?name=orig');
    expect(data.metadata.images).toContain('https://pbs.fxtwitter.com/media/img2.jpg?name=orig');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://fxtwitter.com/MrLarus/status/123',
      expect.objectContaining({
        headers: {
          'User-Agent': 'TelegramBot (like TwitterBot)'
        }
      })
    );
  });

  it('should block non-allowed domains', async () => {
    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://malicious.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Domain not allowed');
  });

  it('should handle fetch errors gracefully with generic message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://x.com/valid-but-missing' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to parse link');
  });

  it.each([
    ['localhost', 'http://localhost/'],
    ['127.0.0.1', 'http://127.0.0.1/'],
    ['::1', 'http://[::1]/'],
    ['169.254.169.254', 'http://169.254.169.254/'],
  ])('should block SSRF host %s', async (_label, url) => {
    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Domain not allowed');
  });

  it('should block SSRF via redirect to private host', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        status: 302,
        headers: new Headers({ location: 'http://127.0.0.1/evil' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        body: null,
        text: () => Promise.resolve('<html></html>'),
      } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://x.com/status/123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Domain not allowed');
  });

  it('should handle responses without a body stream', async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="No Body Title" />
          <meta property="og:description" content="No body desc" />
        </head>
        <body></body>
      </html>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: null,
      text: () => Promise.resolve(mockHtml),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://x.com/valid-but-missing' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.metadata.title).toBe('No Body Title');
  });

  it('should read from response body stream when present', async () => {
    const htmlContent = '<html><head><meta property="og:title" content="Stream Title" /></head></html>';
    const encoder = new TextEncoder();
    const chunks = [encoder.encode(htmlContent)];

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://x.com/valid-but-missing' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.metadata.title).toBe('Stream Title');
  });

  it('should reject responses larger than 2MB', async () => {
    const largeContent = 'x'.repeat(2 * 1024 * 1024 + 1);
    const encoder = new TextEncoder();
    const chunks = [encoder.encode(largeContent)];

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/parse-link', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://x.com/valid-but-missing' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
