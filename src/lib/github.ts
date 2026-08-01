import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import { loadEnv } from './env';
import { randomHex5 } from './utils';

export type MediaType = 'video' | 'image';

export function inferMediaTypeFromUrl(url: string | undefined | null): MediaType | null {
  if (!url) return null;

  let pathname: string;
  let searchParams: URLSearchParams | undefined;

  try {
    const urlObj = new URL(url);
    pathname = urlObj.pathname.toLowerCase();
    searchParams = urlObj.searchParams;
  } catch {
    pathname = url.split('?')[0].toLowerCase();
  }

  if (pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.mov')) {
    return 'video';
  }

  if (pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.webp') || pathname.endsWith('.gif')) {
    return 'image';
  }

  const mimeType = searchParams?.get('mime_type');
  if (mimeType) {
    if (mimeType.startsWith('video')) return 'video';
    if (mimeType.startsWith('image')) return 'image';
  }

  return null;
}

export interface GitHubConfig {
  REPO_OWNER: string;
  REPO_NAME: string;
}

/** 存放投稿媒体的 Release tag。附件不计入仓库体积，GitHub 也不限制其下载流量。 */
export const ASSET_RELEASE_TAG = process.env.ASSET_RELEASE_TAG || 'assets';

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

function extensionOf(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) return '';
  return fileName.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * GitHub 会改写附件名里的非常规字符，而 slug 常常是中文，
 * 所以用「ASCII 残余 + slug 哈希」组成一个稳定且唯一的前缀。
 * 同一投稿的所有附件共享该前缀，便于回收时反查。
 */
export function toAssetPrefix(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (Math.imul(hash, 31) + slug.charCodeAt(i)) >>> 0;
  }
  const fingerprint = hash.toString(36);
  const ascii = slug
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return ascii ? `${ascii}-${fingerprint}` : fingerprint;
}

export function sanitizeAssetName(fileName: string): string {
  const ext = extensionOf(fileName);
  const lastDot = fileName.lastIndexOf('.');
  const rawBase = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const base = rawBase
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'media';

  return ext ? `${base}.${ext}` : base;
}

export function resolveContentType(fileName: string, declared?: string | null): string {
  if (declared && declared !== 'application/octet-stream') {
    return declared;
  }
  return CONTENT_TYPE_BY_EXT[extensionOf(fileName)] || 'application/octet-stream';
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error
    && (error as { status?: number }).status === 404;
}

async function getAssetReleaseId(octokit: Octokit, config: GitHubConfig): Promise<number | null> {
  try {
    const { data } = await octokit.rest.repos.getReleaseByTag({
      owner: config.REPO_OWNER,
      repo: config.REPO_NAME,
      tag: ASSET_RELEASE_TAG,
    });
    return data.id;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** 取得存放附件的 Release，不存在则创建。并发创建冲突时回读已有的。 */
export async function ensureAssetRelease(octokit: Octokit, config: GitHubConfig): Promise<number> {
  const existing = await getAssetReleaseId(octokit, config);
  if (existing !== null) return existing;

  try {
    const { data } = await octokit.rest.repos.createRelease({
      owner: config.REPO_OWNER,
      repo: config.REPO_NAME,
      tag_name: ASSET_RELEASE_TAG,
      name: 'Gallery media assets',
      body: '由投稿流程自动维护的媒体附件，请勿手动删除。',
      make_latest: 'false',
    });
    return data.id;
  } catch (error) {
    const raced = await getAssetReleaseId(octokit, config);
    if (raced !== null) return raced;
    throw error;
  }
}

/** 上传单个媒体到 Release 附件，返回可直接写进 index.md 的公开地址。 */
export async function uploadMediaAsset(
  octokit: Octokit,
  config: GitHubConfig,
  data: {
    slug: string;
    fileName: string;
    contentType?: string | null;
    body: ArrayBuffer;
  }
): Promise<string> {
  const releaseId = await ensureAssetRelease(octokit, config);
  const name = `${toAssetPrefix(data.slug)}-${sanitizeAssetName(data.fileName)}`;

  const { data: asset } = await octokit.rest.repos.uploadReleaseAsset({
    owner: config.REPO_OWNER,
    repo: config.REPO_NAME,
    release_id: releaseId,
    name,
    // Octokit 的类型标注是 string，实际接受二进制载荷。
    data: Buffer.from(data.body) as unknown as string,
    headers: {
      'content-type': resolveContentType(data.fileName, data.contentType),
      'content-length': data.body.byteLength,
    },
  });

  return asset.browser_download_url;
}

export async function listMediaAssets(octokit: Octokit, config: GitHubConfig) {
  const releaseId = await getAssetReleaseId(octokit, config);
  if (releaseId === null) return [];

  const assets: { id: number; name: string; browser_download_url: string }[] = [];
  for (let page = 1; ; page += 1) {
    const { data } = await octokit.rest.repos.listReleaseAssets({
      owner: config.REPO_OWNER,
      repo: config.REPO_NAME,
      release_id: releaseId,
      per_page: 100,
      page,
    });
    assets.push(...data.map((item) => ({
      id: item.id,
      name: item.name,
      browser_download_url: item.browser_download_url,
    })));
    if (data.length < 100) break;
  }

  return assets;
}

export async function deleteMediaAsset(octokit: Octokit, config: GitHubConfig, assetId: number) {
  await octokit.rest.repos.deleteReleaseAsset({
    owner: config.REPO_OWNER,
    repo: config.REPO_NAME,
    asset_id: assetId,
  });
}

export function getOctokit() {
  const env = loadEnv();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.APP_ID,
      privateKey: env.PRIVATE_KEY,
      installationId: env.INSTALLATION_ID,
    },
  });
}

export async function createContributionPullRequest(
  octokit: Octokit,
  config: GitHubConfig,
  data: {
    slug: string;
    title: string;
    description: string;
    model: string;
    sourceUrl: string;
    primaryMediaType: MediaType;
    indexMd: string;
    /** 媒体已上传至 Release 附件，这里只用于在 PR 描述里说明数量。 */
    assetCount: number;
  }
) {
  const { REPO_OWNER, REPO_NAME } = config;
  const { slug, title, description, model, sourceUrl, primaryMediaType, indexMd, assetCount } = data;

  // 1. Get main branch SHA
  const { data: mainRef } = await octokit.rest.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: 'heads/main',
  });
  const mainSha = mainRef.object.sha;

  // 2. Create branch
  const branchName = `contribution/${slug}`;
  await octokit.rest.git.createRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: mainSha,
  });

  const targetDir = primaryMediaType === 'video' ? 'videos' : 'images';
  const basePath = `public/data/${targetDir}/${slug}`;

  // 3. Create blob —— 只有 index.md 进仓库，媒体已在 Release 附件里
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];

  const { data: indexBlob } = await octokit.rest.git.createBlob({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    content: Buffer.from(indexMd).toString('base64'),
    encoding: 'base64',
  });
  treeItems.push({ path: `${basePath}/index.md`, mode: '100644', type: 'blob', sha: indexBlob.sha });

  // 4. Create Tree
  const { data: tree } = await octokit.rest.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    base_tree: mainSha,
    tree: treeItems,
  });

  // 5. Create Commit
  const { data: commit } = await octokit.rest.git.createCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: `Add contribution: ${title}`,
    tree: tree.sha,
    parents: [mainSha],
  });

  // 6. Update Branch Ref
  await octokit.rest.git.updateRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `heads/${branchName}`,
    sha: commit.sha,
  });

  // 7. Open PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `🎨 社区投稿: ${title}`,
    head: branchName,
    base: 'main',
    body: `**来自 Prompt Gallery 的自动化投稿**\n\n- **标题**: ${title}\n- **标识**: ${slug}\n- **描述**: ${description || '未提供'}\n- **模型**: ${model || '未提供'}\n- **来源页面**: ${sourceUrl || '未提供'}\n\n该投稿包含 ${assetCount} 个媒体文件，已上传至 \`${ASSET_RELEASE_TAG}\` Release 附件，仓库内仅新增 index.md。\n\n请在本地预览后点击 Merge。`,
  });

  return pr;
}

export async function requestDeletionPullRequest(
  octokit: Octokit,
  config: GitHubConfig,
  data: {
    slug: string;
    type: MediaType;
    reason: string;
  }
) {
  const { REPO_OWNER, REPO_NAME } = config;
  const { slug, type, reason } = data;

  const targetDir = type === 'video' ? 'videos' : 'images';
  const directoryPath = `public/data/${targetDir}/${slug}`;

  // 1. Get main branch SHA
  const { data: mainRef } = await octokit.rest.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: 'heads/main',
  });
  const mainSha = mainRef.object.sha;

  // 2. Get current tree
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    commit_sha: mainSha,
  });
  const { data: treeData } = await octokit.rest.git.getTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tree_sha: commitData.tree.sha,
    recursive: 'true',
  });

  // 3. Filter and mark for deletion
  const filesToDelete = treeData.tree
    .filter(item => item.path?.startsWith(directoryPath) && item.type === 'blob')
    .map(item => ({
      path: item.path!,
      mode: item.mode as '100644' | '100755' | '040000' | '160000' | '120000',
      type: item.type as 'blob' | 'tree' | 'commit',
      sha: null as unknown as string, // Set to null to delete
    }));

  if (filesToDelete.length === 0) {
    throw new Error('Target directory not found or already empty');
  }

  // 4. Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    base_tree: commitData.tree.sha,
    tree: filesToDelete as {
      path?: string;
      mode?: '100644' | '100755' | '040000' | '160000' | '120000';
      type?: 'blob' | 'tree' | 'commit';
      sha?: string | null;
      content?: string;
    }[],
  });

  // 5. Create commit
  const displayReason = reason ? ` (原因: ${reason})` : '';
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: `Delete prompt: ${slug}${displayReason}`,
    tree: newTree.sha,
    parents: [mainSha],
  });

  // 6. Create branch
  const branchName = `delete/${slug}-${randomHex5()}`;
  await octokit.rest.git.createRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  });

  // 7. Open PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `🗑️ 删除申请: ${slug}${displayReason}`,
    head: branchName,
    base: 'main',
    body: `**来自 Prompt Gallery 的自动化删除申请**\n\n- **标识**: ${slug}\n- **原因**: ${reason || '未说明'}\n\n该操作将永久删除对应的数据文件夹，请核实后 Merge。`,
  });

  return pr;
}
