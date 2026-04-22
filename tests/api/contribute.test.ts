import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildContributionIndexMd,
  inferMediaTypeFromUrl,
  normalizeTagList,
  validateCreateContributionInput,
  POST,
} from '@/app/api/contribute/route';

const mockOctokit = {
  rest: {
    git: {
      getRef: vi.fn(),
      getCommit: vi.fn(),
      getTree: vi.fn(),
      createTree: vi.fn(),
      createCommit: vi.fn(),
      createRef: vi.fn(),
    },
    repos: {
      createOrUpdateFileContents: vi.fn(),
    },
    pulls: {
      create: vi.fn(),
    },
  },
};

vi.mock('octokit', () => ({
  Octokit: class {
    rest = mockOctokit.rest;
    constructor() {}
  },
}));

vi.mock('@octokit/auth-app', () => ({
  createAppAuth: vi.fn(),
}));

describe('POST handler branching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ID = '123';
    process.env.PRIVATE_KEY = 'key';
    process.env.INSTALLATION_ID = '456';
    
    // Default success mocks
    mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
    mockOctokit.rest.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'tree-sha' } } });
    mockOctokit.rest.git.getTree.mockResolvedValue({ data: { tree: [{ path: 'public/data/videos/test-slug/index.md', type: 'blob', mode: '100644' }] } });
    mockOctokit.rest.git.createTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
    mockOctokit.rest.git.createCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
    mockOctokit.rest.git.createRef.mockResolvedValue({});
    mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({});
    mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });
  });

  it('returns 500 when credentials are missing', async () => {
    delete process.env.APP_ID;
    // 显式提供 content-type 和 body 避免 undici 预解析错误
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
    mockOctokit.rest.git.getTree.mockResolvedValue({ data: { tree: [] } });
    const req = new NextRequest('http://localhost/api/contribute?action=delete', {
      method: 'POST',
      body: JSON.stringify({ slug: 'none', type: 'video' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('handles Robot Contribution Error catch block', async () => {
    mockOctokit.rest.git.getRef.mockImplementation(() => { throw 'String Error'; });
    const req = new NextRequest('http://localhost/api/contribute?action=delete', {
      method: 'POST',
      body: JSON.stringify({ slug: 'any', type: 'video' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'String Error' });
  });

  it('successfully creates PR with local file upload', async () => {
    const formData = new FormData();
    formData.append('title', 'File Post');
    formData.append('prompt', 'Prompt');
    // 确保文件大小 > 0
    const file = new File(['some data content'], 'test.png', { type: 'image/png' });
    formData.append('file', file);
    
    const req = new NextRequest('http://localhost/api/contribute', { method: 'POST', body: formData });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(2);
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
      mediaType: 'image',
      assetReference: 'R',
    });
    expect(md).toContain('title: "A \\"Title\\""');
    expect(md).toContain('description: "D \\"esc\\""');
    expect(md).toContain('model: "M \\"m\\""');
  });
});
