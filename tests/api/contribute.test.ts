import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/env', () => ({
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
    expect(validateCreateContributionInput({ title: '', prompt: '', mediaUrl: '', file: null }).error)
      .toContain('Missing required fields');

    const file = new File([''], 'a.png', { type: 'image/png' });
    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrl: 'http', file }).error)
      .toContain('Provide either a media file or a media URL');

    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrl: 'http://a.txt', file: null }).error)
      .toContain('Media URL must point directly');

    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrl: '', file }).error).toBeNull();
  });
});

describe('POST handler integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REPO_OWNER = 'test-owner';
    process.env.REPO_NAME = 'test-repo';
    (getOctokit as Mock).mockReturnValue({});
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
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('mediaUrl') });
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
      mediaUrl: 'U',
      sourceUrl: 'S',
      mediaType: 'image' as MediaType,
      assetReference: 'R',
    });
    expect(md).toContain('\\"');
  });
});
