import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getOctokit,
  createContributionPullRequest,
  requestDeletionPullRequest,
  inferMediaTypeFromUrl,
  toAssetPrefix,
  sanitizeAssetName,
  resolveContentType,
  ensureAssetRelease,
  uploadMediaAsset,
  listMediaAssets,
  deleteMediaAsset,
  ASSET_RELEASE_TAG
} from '@/lib/github';

vi.mock('@/lib/env', () => ({
  loadEnv: () => ({ APP_ID: '123', PRIVATE_KEY: 'key', INSTALLATION_ID: '456' }),
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
      createBlob: vi.fn(),
      updateRef: vi.fn(),
    },
    repos: {
      createOrUpdateFileContents: vi.fn(),
      getReleaseByTag: vi.fn(),
      createRelease: vi.fn(),
      uploadReleaseAsset: vi.fn(),
      listReleaseAssets: vi.fn(),
      deleteReleaseAsset: vi.fn(),
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
    it('returns Octokit instance when credentials exist', async () => {
      const octokit = await getOctokit();
      expect(octokit).toBeDefined();
    });
  });

  describe('inferMediaTypeFromUrl', () => {
    it('handles various URLs', () => {
      expect(inferMediaTypeFromUrl('test.mp4')).toBe('video');
      expect(inferMediaTypeFromUrl('test.png')).toBe('image');
      expect(inferMediaTypeFromUrl('test.unknown')).toBeNull();
      expect(inferMediaTypeFromUrl(null)).toBeNull();
      expect(inferMediaTypeFromUrl('')).toBeNull();
    });

    it('infers type from mime_type query param', () => {
      expect(inferMediaTypeFromUrl('https://cdn.example.com/video?mime_type=video_mp4')).toBe('video');
      expect(inferMediaTypeFromUrl('https://cdn.example.com/img?mime_type=image_png')).toBe('image');
      expect(inferMediaTypeFromUrl('https://cdn.example.com/file?mime_type=unknown')).toBeNull();
    });
  });

  describe('asset naming', () => {
    it('produces an ASCII-safe, stable prefix even for CJK slugs', () => {
      const prefix = toAssetPrefix('机器人牛仔-44922');
      expect(prefix).toMatch(/^[a-zA-Z0-9-]+$/);
      expect(toAssetPrefix('机器人牛仔-44922')).toBe(prefix);
    });

    it('does not collide between different CJK slugs sharing an ASCII tail', () => {
      expect(toAssetPrefix('机器人牛仔-44922')).not.toBe(toAssetPrefix('电影海报-44922'));
    });

    it('strips unsafe characters from file names but keeps the extension', () => {
      expect(sanitizeAssetName('ChatGPT Image 2026年5月22日 15_03_17.png'))
        .toMatch(/^[a-zA-Z0-9-]+\.png$/);
      expect(sanitizeAssetName('汉服.mp4')).toBe('media.mp4');
      expect(sanitizeAssetName('noext')).toBe('noext');
    });

    it('falls back to extension-based content types', () => {
      expect(resolveContentType('a.mp4', '')).toBe('video/mp4');
      expect(resolveContentType('a.mp4', 'application/octet-stream')).toBe('video/mp4');
      expect(resolveContentType('a.png', 'image/png')).toBe('image/png');
      expect(resolveContentType('a.bin', null)).toBe('application/octet-stream');
    });
  });

  describe('release assets', () => {
    const config = { REPO_OWNER: 'owner', REPO_NAME: 'repo' };

    it('reuses an existing asset release', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: { id: 7 } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(ensureAssetRelease(mockOctokit, config)).resolves.toBe(7);
      expect(mockOctokit.rest.repos.createRelease).not.toHaveBeenCalled();
    });

    it('creates the release when the tag does not exist yet', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 });
      mockOctokit.rest.repos.createRelease.mockResolvedValue({ data: { id: 9 } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(ensureAssetRelease(mockOctokit, config)).resolves.toBe(9);
      expect(mockOctokit.rest.repos.createRelease).toHaveBeenCalledWith(
        expect.objectContaining({ tag_name: ASSET_RELEASE_TAG })
      );
    });

    it('recovers when a concurrent request created the release first', async () => {
      mockOctokit.rest.repos.getReleaseByTag
        .mockRejectedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ data: { id: 11 } });
      mockOctokit.rest.repos.createRelease.mockRejectedValue({ status: 422 });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(ensureAssetRelease(mockOctokit, config)).resolves.toBe(11);
    });

    it('rethrows non-404 lookup failures', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 500 });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(ensureAssetRelease(mockOctokit, config)).rejects.toMatchObject({ status: 500 });
    });

    it('rethrows when the release cannot be created nor found', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 });
      mockOctokit.rest.repos.createRelease.mockRejectedValue(new Error('no permission'));

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(ensureAssetRelease(mockOctokit, config)).rejects.toThrow('no permission');
    });

    it('uploads with a prefixed name and a real content type', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: { id: 7 } });
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://example.com/asset.mp4' },
      });

      const url = await uploadMediaAsset(
        // @ts-expect-error - mockOctokit is not a full Octokit instance
        mockOctokit,
        config,
        { slug: '机器人牛仔-44922', fileName: 'clip.mp4', contentType: '', body: new ArrayBuffer(8) }
      );

      expect(url).toBe('https://example.com/asset.mp4');
      const call = mockOctokit.rest.repos.uploadReleaseAsset.mock.calls[0][0];
      expect(call.release_id).toBe(7);
      expect(call.name).toBe(`${toAssetPrefix('机器人牛仔-44922')}-clip.mp4`);
      expect(call.headers['content-type']).toBe('video/mp4');
      expect(call.headers['content-length']).toBe(8);
    });

    it('pages through the asset list', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: { id: 7 } });
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i, name: `a${i}.png`, browser_download_url: `u${i}`,
      }));
      mockOctokit.rest.repos.listReleaseAssets
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: [{ id: 100, name: 'a100.png', browser_download_url: 'u100' }] });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const assets = await listMediaAssets(mockOctokit, config);
      expect(assets).toHaveLength(101);
      expect(mockOctokit.rest.repos.listReleaseAssets).toHaveBeenCalledTimes(2);
    });

    it('returns an empty list when the release does not exist', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await expect(listMediaAssets(mockOctokit, config)).resolves.toEqual([]);
    });

    it('deletes an asset by id', async () => {
      mockOctokit.rest.repos.deleteReleaseAsset.mockResolvedValue({});

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      await deleteMediaAsset(mockOctokit, config, 42);
      expect(mockOctokit.rest.repos.deleteReleaseAsset).toHaveBeenCalledWith(
        expect.objectContaining({ asset_id: 42 })
      );
    });
  });

  describe('createContributionPullRequest', () => {
    it('creates a PR for video type with empty optional fields', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.git.createBlob.mockResolvedValue({ data: { sha: 'blob-sha' } });
      mockOctokit.rest.git.createTree.mockResolvedValue({ data: { sha: 'tree-sha' } });
      mockOctokit.rest.git.createCommit.mockResolvedValue({ data: { sha: 'commit-sha' } });
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await createContributionPullRequest(mockOctokit,
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        {
          slug: 'video-slug',
          title: 'Video',
          description: '',
          model: '',
          sourceUrl: '',
          primaryMediaType: 'video',
          indexMd: 'content',
          assetCount: 1
        }
      );

      expect(result.html_url).toBe('pr-url');
      expect(mockOctokit.rest.git.createBlob).toHaveBeenCalled();
      expect(mockOctokit.rest.git.createTree).toHaveBeenCalledWith(
        expect.objectContaining({ tree: expect.arrayContaining([
          expect.objectContaining({ path: expect.stringContaining('videos/') })
        ])})
      );
    });

    it('successfully creates a PR with index.md and media file', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.git.createBlob.mockResolvedValue({ data: { sha: 'blob-sha' } });
      mockOctokit.rest.git.createTree.mockResolvedValue({ data: { sha: 'tree-sha' } });
      mockOctokit.rest.git.createCommit.mockResolvedValue({ data: { sha: 'commit-sha' } });
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await createContributionPullRequest(mockOctokit, 
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        {
          slug: 'test-slug',
          title: 'Test',
          description: 'Desc',
          model: 'Model',
          sourceUrl: 'src',
          primaryMediaType: 'image',
          indexMd: 'content',
          assetCount: 1
        }
      );

      expect(result.html_url).toBe('pr-url');
      expect(mockOctokit.rest.git.createRef).toHaveBeenCalled();
      expect(mockOctokit.rest.git.createTree).toHaveBeenCalled();
      expect(mockOctokit.rest.git.createCommit).toHaveBeenCalled();
      expect(mockOctokit.rest.git.updateRef).toHaveBeenCalled();

      // 媒体走 Release 附件，仓库里只提交 index.md 这一个 blob
      expect(mockOctokit.rest.git.createBlob).toHaveBeenCalledTimes(1);
      const tree = mockOctokit.rest.git.createTree.mock.calls[0][0].tree;
      expect(tree).toHaveLength(1);
      expect(tree[0].path).toMatch(/index\.md$/);
    });

    it('successfully creates a PR with only index.md (mediaUrl mode)', async () => {
      mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'main-sha' } } });
      mockOctokit.rest.git.createBlob.mockResolvedValue({ data: { sha: 'blob-sha' } });
      mockOctokit.rest.git.createTree.mockResolvedValue({ data: { sha: 'tree-sha' } });
      mockOctokit.rest.git.createCommit.mockResolvedValue({ data: { sha: 'commit-sha' } });
      mockOctokit.rest.pulls.create.mockResolvedValue({ data: { html_url: 'pr-url' } });

      // @ts-expect-error - mockOctokit is not a full Octokit instance
      const result = await createContributionPullRequest(mockOctokit, 
        { REPO_OWNER: 'owner', REPO_NAME: 'repo' },
        {
          slug: 'test-slug',
          title: 'Test',
          description: 'Desc',
          model: 'Model',
          sourceUrl: 'src',
          primaryMediaType: 'image',
          indexMd: 'content',
          assetCount: 3
        }
      );

      expect(result.html_url).toBe('pr-url');
      // 无论有几个媒体，仓库里始终只多一个 index.md
      expect(mockOctokit.rest.git.createBlob).toHaveBeenCalledTimes(1);
      expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('3 个媒体文件') })
      );
    });

    it('handles unexpected errors in createContributionPullRequest', async () => {
      mockOctokit.rest.git.getRef.mockRejectedValue('String Error');
      // @ts-expect-error - testing invalid input types for error handling coverage
      await expect(createContributionPullRequest(mockOctokit, { REPO_OWNER: 'o', REPO_NAME: 'r' }, { primaryMediaType: 'image' }))
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
