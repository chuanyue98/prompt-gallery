import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildContributionIndexMd,
  validateCreateContributionInput,
  POST,
  buildContributionSlug,
} from '@/app/api/contribute/route';

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
  getOctokit, 
  createContributionPullRequest, 
  requestDeletionPullRequest,
  MediaType
} from '@/lib/github';

describe('API Route unit tests', () => {
  it('buildContributionSlug covers all branches', () => {
    // Branch: cleanTitle.length > 0
    expect(buildContributionSlug({ title: 'My Title' })).toMatch(/^My-Title-[0-9a-f]{5}$/);
    // Branch: cleanTitle.length === 0
    expect(buildContributionSlug({ title: ' /?* ' })).toMatch(/^contribution-[0-9a-f]{5}$/);
  });

  it('buildContributionSlug generates a unique suffix on each call', () => {
    const slug1 = buildContributionSlug({ title: 'Test' });
    const slug2 = buildContributionSlug({ title: 'Test' });
    expect(slug1).not.toBe(slug2);
  });

  it('validateCreateContributionInput covers all branches', () => {
    // Missing fields
    expect(validateCreateContributionInput({ title: '', prompt: '', mediaUrl: '', file: null }).error)
      .toContain('Missing required fields');
    
    // Both file and mediaUrl
    const file = new File([''], 'a.png', { type: 'image/png' });
    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrl: 'http', file }).error)
      .toContain('Provide either a media file or a media URL');

    // Invalid media URL type
    expect(validateCreateContributionInput({ title: 'T', prompt: 'P', mediaUrl: 'http://a.txt', file: null }).error)
      .toContain('Media URL must point directly');
    
    // Success with file
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

  it('handles creation with mediaUrl', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    formData.append('mediaUrl', 'https://example.com/a.png');
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });
    
    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    // Mock formData() to avoid undici's multipart/form-data parsing issues in test environment
    req.formData = async () => formData;
    
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('handles creation with file', async () => {
    const formData = new FormData();
    formData.append('title', 'T');
    formData.append('prompt', 'P');
    const file = new File(['hello content'], 'a.png', { type: 'image/png' });
    formData.append('file', file);
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'url' });
    
    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST' });
    // Mock formData() to avoid undici's multipart/form-data parsing issues in test environment
    req.formData = async () => formData;
    
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
