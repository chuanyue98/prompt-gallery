import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildContributionIndexMd,
  validateCreateContributionInput,
  POST,
} from '@/app/api/contribute/route';

// Mock GitHub lib but keep original inferMediaTypeFromUrl for its own test
vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('@/lib/github');
  return {
    ...actual,
    getOctokit: vi.fn(),
    createContributionPullRequest: vi.fn(),
    requestDeletionPullRequest: vi.fn(),
    // Explicitly keep the real inferMediaTypeFromUrl unless specifically mocked
    inferMediaTypeFromUrl: actual.inferMediaTypeFromUrl,
  };
});

import { 
  getOctokit, 
  createContributionPullRequest, 
  requestDeletionPullRequest,
  inferMediaTypeFromUrl,
  MediaType
} from '@/lib/github';

describe('POST handler branching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REPO_OWNER = 'test-owner';
    process.env.REPO_NAME = 'test-repo';
    
    (getOctokit as Mock).mockReturnValue({
      // Dummy octokit object
    });
  });

  it('returns 500 when getOctokit throws', async () => {
    (getOctokit as Mock).mockImplementation(() => {
      throw new Error('GitHub App credentials not configured');
    });
    const req = new NextRequest('http://localhost/api/contribute', { 
      method: 'POST', 
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'a', type: 'image' }) 
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'GitHub App credentials not configured' });
  });

  it('returns 400 when validation fails in handleCreate', async () => {
    const formData = new FormData();
    formData.append('title', 'Test');
    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when deleting a non-existent directory', async () => {
    (requestDeletionPullRequest as Mock).mockRejectedValue(new Error('Target directory not found or already empty'));
    const req = new NextRequest('http://localhost/api/contribute?action=delete', {
      method: 'POST',
      body: JSON.stringify({ slug: 'none', type: 'video' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('handles Robot Contribution Error catch block', async () => {
    (getOctokit as Mock).mockImplementation(() => { throw 'String Error'; });
    const req = new NextRequest('http://localhost/api/contribute?action=delete', {
      method: 'POST',
      body: JSON.stringify({ slug: 'any', type: 'video' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Robot processing failed' });
  });

  it('successfully creates PR with local file upload', async () => {
    const formData = new FormData();
    formData.append('title', 'File Post');
    formData.append('prompt', 'Prompt');
    const file = new File(['some data content'], 'test.png', { type: 'image/png' });
    formData.append('file', file);
    
    (createContributionPullRequest as Mock).mockResolvedValue({ html_url: 'pr-url' });

    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createContributionPullRequest).toHaveBeenCalled();
  });
});

describe('Utility unit tests', () => {
  it('inferMediaTypeFromUrl covers all branches', () => {
    expect(inferMediaTypeFromUrl('a.mov')).toBe('video');
    expect(inferMediaTypeFromUrl('a.webm')).toBe('video');
    expect(inferMediaTypeFromUrl('a.jpeg')).toBe('image');
    expect(inferMediaTypeFromUrl('a.webp')).toBe('image');
    expect(inferMediaTypeFromUrl('a.gif')).toBe('image');
    expect(inferMediaTypeFromUrl('a.txt')).toBeNull();
  });

  it('validateCreateContributionInput rejects when mediaType inference fails', () => {
    const result = validateCreateContributionInput({
      title: 'T',
      prompt: 'P',
      mediaUrl: 'bad.txt',
      file: null,
    });
    expect(result.error).toContain('Media URL must point directly');
  });
});

describe('buildContributionIndexMd escaping', () => {
  it('escapes quotes in fields', () => {
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
    expect(md).toContain('title: "A \\"Title\\""');
    expect(md).toContain('description: "D \\"esc\\""');
    expect(md).toContain('model: "M \\"m\\""');
  });
});
