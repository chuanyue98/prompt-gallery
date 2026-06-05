import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { lookup } from 'node:dns/promises';

const mockLookup = vi.hoisted(() => vi.fn());

vi.mock('node:dns/promises', () => ({
  default: { lookup: mockLookup },
  lookup: mockLookup,
}));

vi.mock('@/lib/env', () => ({
  loadEnv: () => ({ APP_ID: '123', PRIVATE_KEY: 'key', INSTALLATION_ID: '456' }),
  env: {
    APP_ID: '123',
    PRIVATE_KEY: 'key',
    INSTALLATION_ID: '456',
  },
}));

// Mock GitHub lib but keep original inferMediaTypeFromUrl for its own test
vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('@/lib/github');
  return {
    ...actual,
    getOctokit: vi.fn(),
    createContributionPullRequest: vi.fn(),
    requestDeletionPullRequest: vi.fn(),
    inferMediaTypeFromUrl: actual.inferMediaTypeFromUrl,
  };
});

import {
  buildContributionIndexMd,
  validateCreateContributionInput,
  POST,
  buildContributionSlug,
  isHttpOrHttpsUrl,
  validateMediaDownloadUrl,
} from '@/app/api/contribute/route';

import {
  getOctokit,
  createContributionPullRequest,
  requestDeletionPullRequest,
  MediaType,
} from '@/lib/github';

const mockFormDataRequest = (req: NextRequest, formData: FormData) => {
  (req as unknown as { formData: () => Promise<FormData> }).formData = async () => formData;
};

describe('isHttpOrHttpsUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpOrHttpsUrl('http://example.com/a.png')).toBe(true);
    expect(isHttpOrHttpsUrl('https://example.com/a.png')).toBe(true);
    expect(isHttpOrHttpsUrl('https://cdn.example.com/path/video.mp4?v=1')).toBe(true);
  });

  it('rejects non-http(s) protocols', () => {
    expect(isHttpOrHttpsUrl('ftp://example.com/file')).toBe(false);
    expect(isHttpOrHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpOrHttpsUrl('data:image/png;base64,abc')).toBe(false);
    expect(isHttpOrHttpsUrl('file:///etc/passwd')).toBe(false);
    expect(isHttpOrHttpsUrl('blob:https://example.com/uuid')).toBe(false);
  });

  it('rejects malformed and empty values', () => {
    expect(isHttpOrHttpsUrl('')).toBe(false);
    expect(isHttpOrHttpsUrl('not-a-url')).toBe(false);
    expect(isHttpOrHttpsUrl('//example.com/path')).toBe(false);
  });
});

describe('validateMediaDownloadUrl', () => {
  beforeEach(() => {
    vi.mocked(lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('allows public http(s) URLs', async () => {
    await expect(validateMediaDownloadUrl('https://example.com/a.png')).resolves.toBeNull();
    await expect(validateMediaDownloadUrl('http://8.8.8.8/a.png')).resolves.toBeNull();
  });

  it('rejects malformed URLs and non-http(s) protocols', async () => {
    await expect(validateMediaDownloadUrl('not-a-url')).resolves.toContain('Invalid');
    await expect(validateMediaDownloadUrl('ftp://example.com/a.png')).resolves.toContain('http or https');
  });

  it('rejects localhost and private IP targets', async () => {
    await expect(validateMediaDownloadUrl('http://localhost/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://assets.localhost/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://127.0.0.1/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://100.64.0.1/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://192.168.1.2/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://198.18.0.1/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://224.0.0.1/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://[::1]/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://[fd00::1]/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://[fe90::1]/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://[::ffff:7f00:1]/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://[0:0:0:0:0:0:0:1]/a.png')).resolves.toContain('not allowed');
    await expect(validateMediaDownloadUrl('http://[0:0:0:0:0:ffff:10.0.0.1]/a.png')).resolves.toContain('not allowed');
  });

  it('rejects hostnames that resolve to private addresses', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '10.0.0.2', family: 4 }]);
    await expect(validateMediaDownloadUrl('https://internal.example/a.png')).resolves.toContain('not allowed');
  });

  it('returns a validation error when DNS lookup fails', async () => {
    vi.mocked(lookup).mockRejectedValueOnce(new Error('ENOTFOUND'));
    await expect(validateMediaDownloadUrl('https://missing.example/a.png')).resolves.toContain('could not be resolved');
  });
});

describe('API Route unit tests', () => {
  it('buildContributionSlug covers all branches', () => {
    expect(buildContributionSlug({ title: 'My Title' })).toMatch(/^My-Title-[0-9a-f]{5}$/);
    expect(buildContributionSlug({ title: ' /?* ' })).toMatch(/^contribution-[0-9a-f]{5}$/);
  });

  it('buildContributionSlug generates a unique suffix on each call', () => {
    const slug1 = buildContributionSlug({ title: 'Test' });
    const slug2 = buildContributionSlug({ title: 'Test' });
    expect(slug1).not.toBe(slug2);
  });

  it('validateCreateContributionInput covers all branches', () => {
    expect(validateCreateContributionInput({ title: '', prompt: '', mediaUrls: [], files: [] }).error)
      .toContain('Missing required fields');

    const file = new File([''], 'a.png', { type: 'image/png' });
    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrls: [], files: [file] }).error).toBeNull();
    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrls: ['https://example.com/a.png'], files: [] }).error).toBeNull();
  });
});

describe('POST handler integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REPO_OWNER = 'test-owner';
    process.env.REPO_NAME = 'test-repo';
    (getOctokit as Mock).mockReturnValue({});
    
    // Mock global.fetch for media downloads
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: new Headers({ 'content-type': 'image/png' }),
    });
    vi.mocked(lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('handles deletion success and 404', async () => {
    (requestDeletionPullRequest as Mock).mockResolvedValueOnce({ html_url: 'url' });
    const req = new NextRequest('http://localhost/api/contribute?action=delete', {
      method: 'POST',
      body: JSON.stringify({ slug: 's', type: 'image', reason: 'r' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    (requestDeletionPullRequest as Mock).mockRejectedValueOnce(new Error('Target directory not found or already empty'));
    const req2 = new NextRequest('http://localhost/api/contribute?action=delete', {
      method: 'POST',
      body: JSON.stringify({ slug: 's', type: 'image' }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(404);
  });

  it('rejects non-http(s) mediaUrl', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'javascript:alert(1).png');
    formData.append('sourceUrl', 'https://example.com/source');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('one media file') });
  });

  it('rejects non-http(s) sourceUrl even when mediaUrl is valid', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');
    formData.append('sourceUrl', 'ftp://example.com/source');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('sourceUrl') });
  });

  it('accepts http and https for both mediaUrl and sourceUrl', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'http://example.com/a.png');
    formData.append('sourceUrl', 'https://example.com/source');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('handles creation with mediaUrl', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('follows safe media redirects', async () => {
    vi.mocked(global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({ location: 'https://cdn.example/a.png' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/png' }),
      });
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/redirect');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('uses the final response media type after redirects', async () => {
    vi.mocked(global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({ location: 'https://cdn.example/video.mp4' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'video/mp4' }),
      });
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const prData = (createContributionPullRequest as Mock).mock.calls[0][2];
    expect(prData.primaryMediaType).toBe('video');
    expect(prData.indexMd).toContain('type: "video"');
  });

  it('rejects media redirects to disallowed hosts', async () => {
    vi.mocked(global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers({ location: 'http://localhost/a.png' }),
    });
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/redirect');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('not allowed') });
  });

  it('accepts octet-stream media when URL extension is known', async () => {
    vi.mocked(global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: new Headers({ 'content-type': 'application/octet-stream' }),
    });
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('rejects downloaded media larger than the URL download limit', async () => {
    vi.mocked(global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': String(10 * 1024 * 1024 + 1),
      }),
    });
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('10MB') });
  });

  it('rejects mediaUrl hosts that resolve to private networks', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '10.0.0.2', family: 4 }]);
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://internal.example/a.png');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('not allowed') });
  });

  it('rejects downloaded non-media content types', async () => {
    vi.mocked(global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: new Headers({ 'content-type': 'text/html' }),
    });
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('image or video') });
  });

  it('handles creation with file', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('file', new Blob(['hello content'], { type: 'image/png' }), 'a.png');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST' });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('rejects oversized file uploads with JSON error', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('file', new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: 'video/mp4' }), 'large.mp4');

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST' });
    mockFormDataRequest(req, formData);
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('上传文件过大') });
  });

  it('handles non-Error objects in catch', async () => {
    (getOctokit as Mock).mockImplementation(() => { throw 'string error'; });
    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('buildContributionIndexMd escaping', () => {
  it('escapes quotes', () => {
    const md = buildContributionIndexMd({
      title: 'A "Title"',
      description: 'D "esc"',
      prompt: 'P',
      tags: 'T',
      model: 'M "m"',
      sourceUrl: 'S',
      mediaItems: [{ type: 'image' as MediaType, src: 'R', cover: 'R' }],
    });
    expect(md).toContain('\\"');
  });
});
