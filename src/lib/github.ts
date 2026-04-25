import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

export type MediaType = 'video' | 'image';

export function inferMediaTypeFromUrl(url: string | undefined | null): MediaType | null {
  if (!url) return null;
  const normalizedUrl = url.split('?')[0].toLowerCase();

  if (normalizedUrl.endsWith('.mp4') || normalizedUrl.endsWith('.webm') || normalizedUrl.endsWith('.mov')) {
    return 'video';
  }

  if (normalizedUrl.endsWith('.png') || normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg') || normalizedUrl.endsWith('.webp') || normalizedUrl.endsWith('.gif')) {
    return 'image';
  }

  return null;
}

export interface GitHubConfig {
  REPO_OWNER: string;
  REPO_NAME: string;
}

export function getOctokit() {
  const APP_ID = process.env.APP_ID;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const INSTALLATION_ID = process.env.INSTALLATION_ID;

  if (!APP_ID || !PRIVATE_KEY || !INSTALLATION_ID) {
    throw new Error('GitHub App credentials not configured');
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      installationId: INSTALLATION_ID,
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
    mediaUrl: string;
    sourceUrl: string;
    mediaType: MediaType;
    indexMd: string;
    fileName: string;
    fileBase64: string | null;
  }
) {
  const { REPO_OWNER, REPO_NAME } = config;
  const { slug, title, description, model, mediaUrl, sourceUrl, mediaType, indexMd, fileName, fileBase64 } = data;

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

  const targetDir = mediaType === 'video' ? 'videos' : 'images';

  // 3. Commit index.md
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: `public/data/${targetDir}/${slug}/index.md`,
    message: `Add prompt: ${title}`,
    content: Buffer.from(indexMd).toString('base64'),
    branch: branchName,
  });

  if (fileBase64) {
    // 4. Commit media file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `public/data/${targetDir}/${slug}/${fileName}`,
      message: `Add media for: ${title}`,
      content: fileBase64,
      branch: branchName,
    });
  }

  // 5. Open PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `🎨 社区投稿: ${title}`,
    head: branchName,
    base: 'main',
    body: `**来自 Prompt Gallery 的自动化投稿**\n\n- **标题**: ${title}\n- **标识**: ${slug}\n- **描述**: ${description || '未提供'}\n- **模型**: ${model || '未提供'}\n- **媒体**: ${mediaUrl || '本地上传'}\n- **来源页面**: ${sourceUrl || '未提供'}\n\n请在本地预览后点击 Merge。`,
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
  const branchName = `delete/${slug}-${Math.random().toString(36).substring(7)}`;
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
