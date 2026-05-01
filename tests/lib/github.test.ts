import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getOctokit,
  createContributionPullRequest,
  requestDeletionPullRequest,
  inferMediaTypeFromUrl
} from '@/lib/github';

vi.mock('@/lib/env', () => ({
  env: { APP_ID: '123', PRIVATE_KEY: 'key', INSTALLATION_ID: '456' },
}));

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
  // Return a class-like function that returns our mock object
  Octokit: function() {
    return mockOctokit;
  },
}));

vi.mock('@octokit/auth-app', () => ({
  createAppAuth: vi.fn(),
}));

describe('lib/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ID = '123';
    process.env.PRIVATE_KEY = 'key';
    process.env.INSTALLATION_ID = '456';
  });

  describe('getOctokit', () => {
    it('returns Octokit instance when credentials exist', () => {
      const octokit = getOctokit();
      expect(octokit).toBeDefined();
    });
  });

  describe('inferMediaTypeFromUrl', () => {
    it('handles various URLs', () => {
      expect(inferMediaTypeFromUrl('test.mp4')).toBe('video');
      expect(inferMediaTypeFromUrl('test.png')).toBe('image');
      expect(inferMediaTypeFromUrl('test.unknown')).toBeNull(); // This covers line 18
      expect(inferMediaTypeFromUrl(null)).toBeNull();
      expect(inferMediaTypeFromUrl('')).toBeNull();
    });
  });

  describe('createContributionPullRequest', () => {
    it('creates a PR for video type with empty optional fields', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({});
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await createContributionPullRequest(mockOctokit,
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        {
          slug: 'video-slug',
          title: 'Video',
          description: '',
          model: '',
          mediaUrl: '',
          sourceUrl: '',
          mediaType: 'video',
          indexMd: 'content',
          fileName: 'clip.mp4',
          fileBase64: 'base64data',
        }
      );

      expect(result.html_url).toBe('pr-url');
      expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining('videos/') })
      );
    });

    it('successfully creates a PR with index.md and media file', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({});
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await createContributionPullRequest(mockOctokit, 
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        {
          slug: 'test-slug',
          title: 'Test',
          description: 'Desc',
          model: 'Model',
          mediaUrl: '',
          sourceUrl: 'src',
          mediaType: 'image',
          indexMd: 'content',
          fileName: 'test.png',
          fileBase64: 'base64data'
        }
      );

      expect(result.html_url).toBe('pr-url');
      expect(mockOctokit.rest.git.createRef).toHaveBeenCalled();
      expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(2);
    });

    it('successfully creates a PR with only index.md (mediaUrl mode)', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({});
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await createContributionPullRequest(mockOctokit, 
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        {
          slug: 'test-slug',
          title: 'Test',
          description: 'Desc',
          model: 'Model',
          mediaUrl: 'http://example.com/image.png',
          sourceUrl: 'src',
          mediaType: 'image',
          indexMd: 'content',
          fileName: 'http://example.com/image.png',
          fileBase64: null
        }
      );

      expect(result.html_url).toBe('pr-url');
      expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(1);
    });

    it('handles unexpected errors in createContributionPullRequest', async () => {
      mockOctokit.rest.git.getRef.mockRejectedValue('String Error');
      // @ts-expect-error - testing invalid input types for error handling coverage
      await expect(createContributionPullRequest(mockOctokit, { REPO_OWNER: 'o', REPO_NAME: 'r' }, { mediaType: 'image' }))
        .rejects.toBe('String Error');
    });

    it('covers requestDeletionPullRequest branch coverage for error message', async () => {
       mockOctokit.rest.git.getRef.mockRejectedValue(new Error('Actual Error'));
       // @ts-expect-error - testing invalid config for coverage
       await expect(requestDeletionPullRequest(mockOctokit, {}, {})).rejects.toThrow('Actual Error');
    });
  });

  describe('requestDeletionPullRequest', () => {
    it('throws error when directory not found', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'tree-sha' } } });
      mockOctokit.rest.git.getTree.mockResolvedValue({ data: { tree: [] } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(requestDeletionPullRequest(mockOctokit,
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        { slug: 'non-existent', type: 'image', reason: 'cleanup' }
      )).rejects.toThrow('Target directory not found or already empty');
    });

    it('creates deletion PR with empty reason (no suffix)', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'tree-sha' } } });
      mockOctokit.rest.git.getTree.mockResolvedValue({ data: { tree: [
        { path: 'public/data/images/slug/index.md', type: 'blob', mode: '100644' }
      ] } });
      mockOctokit.rest.git.createTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
      mockOctokit.rest.git.createCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'del-pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await requestDeletionPullRequest(mockOctokit,
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        { slug: 'slug', type: 'image', reason: '' }
      );

      expect(result.html_url).toBe('del-pr-url');
      expect(mockOctokit.rest.git.createCommit).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Delete prompt: slug' })
      );
    });

    it('successfully creates a deletion PR', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'tree-sha' } } });
      mockOctokit.rest.git.getTree.mockResolvedValue({ data: { tree: [
        { path: 'public/data/images/slug/index.md', type: 'blob', mode: '100644' }
      ] } });
      mockOctokit.rest.git.createTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
      mockOctokit.rest.git.createCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'del-pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await requestDeletionPullRequest(mockOctokit,
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        { slug: 'slug', type: 'image', reason: 'cleanup' }
      );

      expect(result.html_url).toBe('del-pr-url');
      expect(mockOctokit.rest.git.createCommit).toHaveBeenCalled();
    });
  });
});
