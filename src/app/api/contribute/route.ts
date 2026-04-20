import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import { slugify } from '@/lib/utils';

// ---------------------------------------------------------
// 🚨 Vercel 环境变量说明：
// 1. APP_ID: 机器人的 App ID (6-7位数字)
// 2. PRIVATE_KEY: 下载的 .pem 文件的全部文本
// 3. INSTALLATION_ID: 安装后的 ID (一串数字)
// 4. REPO_OWNER: 你的 GitHub 用户名 (如 chuanyue98)
// 5. REPO_NAME: 仓库名 (如 prompt-gallery)
// ---------------------------------------------------------

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INSTALLATION_ID = process.env.INSTALLATION_ID;
const REPO_OWNER = process.env.REPO_OWNER || 'chuanyue98';
const REPO_NAME = process.env.REPO_NAME || 'prompt-gallery';

type MediaType = 'video' | 'image';

interface CreateContributionInput {
  description: string;
  prompt: string;
  tags: string;
  model: string;
  mediaUrl: string;
  sourceUrl: string;
  file: File | null;
}

interface ValidationResult {
  error: string | null;
  mediaType: MediaType | null;
}

function buildContributionSlug(input: {
  title: string;
}) {
  const cleanTitle = input.title
    .trim()
    .replace(/[\/\s\\:?*"<>|]/g, '-') // 替换非法路径字符和空格为单一连字符
    .replace(/-+/g, '-')              // 合并多个连字符
    .replace(/^-+|-+$/g, '');         // 移除首尾连字符

  const base = cleanTitle || 'contribution';
  const randomSuffix = Math.random().toString(36).substring(2, 7); // 取 5 位随机码
  
  return `${base}-${randomSuffix}`;
}

export function inferMediaTypeFromUrl(url: string): MediaType | null {
  const normalizedUrl = url.split('?')[0].toLowerCase();

  if (normalizedUrl.endsWith('.mp4') || normalizedUrl.endsWith('.webm') || normalizedUrl.endsWith('.mov')) {
    return 'video' as const;
  }

  if (normalizedUrl.endsWith('.png') || normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg') || normalizedUrl.endsWith('.webp') || normalizedUrl.endsWith('.gif')) {
    return 'image' as const;
  }

  return null;
}

function inferMediaTypeFromFile(file: File | null): MediaType | null {
  if (!file) {
    return null;
  }

  return file.type.startsWith('video') ? 'video' : 'image';
}

export function validateCreateContributionInput(input: Pick<CreateContributionInput, 'title' | 'prompt' | 'mediaUrl' | 'file'>): ValidationResult {
  if (!input.title.trim() || !input.prompt.trim()) {
    return { error: 'Missing required fields: title and prompt are mandatory', mediaType: null };
  }

  if ((!input.file && !input.mediaUrl) || (input.file && input.mediaUrl)) {
    return { error: 'Provide either a media file or a media URL', mediaType: null };
  }

  const mediaType = input.file ? inferMediaTypeFromFile(input.file) : inferMediaTypeFromUrl(input.mediaUrl);

  if (!mediaType) {
    return { error: 'Media URL must point directly to an image or video file', mediaType: null };
  }

  return { error: null, mediaType };
}

export function normalizeTagList(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function buildContributionIndexMd(input: {
  title: string;
  description: string;
  prompt: string;
  tags: string;
  model: string;
  mediaUrl: string;
  sourceUrl: string;
  mediaType: MediaType;
  assetReference: string;
}): string {
  const normalizedTags = normalizeTagList(input.tags)
    .map((tag) => `"${tag}"`)
    .join(', ');

  return `---
title: "${input.title.replace(/"/g, '\\"')}"
description: "${input.description.replace(/"/g, '\\"')}"
tags: [${normalizedTags}]
model: "${input.model.replace(/"/g, '\\"')}"
${input.mediaUrl ? `mediaUrl: "${input.mediaUrl}"\n` : ''}${input.sourceUrl ? `sourceUrl: "${input.sourceUrl}"\n` : ''}media:
  - type: "${input.mediaType}"
    src: "${input.assetReference}"
    cover: "${input.assetReference}"
---

### 提示词 (Prompt)
${input.prompt}
`;
}

export async function POST(req: NextRequest) {
  try {
    if (!APP_ID || !PRIVATE_KEY || !INSTALLATION_ID) {
      return NextResponse.json({ error: 'GitHub App credentials not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'create';

    // 初始化以机器人身份进行认证
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
        installationId: INSTALLATION_ID,
      },
    });

    if (action === 'delete') {
      return await handleDelete(req, octokit);
    }

    return await handleCreate(req, octokit);

  } catch (error: unknown) {
    console.error('Robot Contribution Error:', error);
    const message = error instanceof Error ? error.message : 'Robot processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCreate(req: NextRequest, octokit: Octokit) {
  const formData = await req.formData();
  const title = (formData.get('title') as string) || '';
  const description = (formData.get('description') as string) || '';
  const prompt = (formData.get('prompt') as string) || '';
  const tags = (formData.get('tags') as string) || '';
  const model = (formData.get('model') as string) || '';
  const mediaUrl = ((formData.get('mediaUrl') as string) || '').trim();
  const sourceUrl = ((formData.get('sourceUrl') as string) || '').trim();
  const uploadedFile = formData.get('file');
  const file = uploadedFile instanceof File && uploadedFile.size > 0 ? uploadedFile : null;
  const validation = validateCreateContributionInput({ title, prompt, mediaUrl, file });

  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (!validation.mediaType) {
    return NextResponse.json({ error: 'Media URL must point directly to an image or video file' }, { status: 400 });
  }

  // 1. 准备文件数据
  const slug = buildContributionSlug({ title });
  const mediaType = validation.mediaType;
  const fileName = file?.name || mediaUrl;
  const fileBuffer = file ? await file.arrayBuffer() : null;
  const fileBase64 = fileBuffer ? Buffer.from(fileBuffer).toString('base64') : null;
  const indexMd = buildContributionIndexMd({
    title,
    description,
    prompt,
    tags,
    model,
    mediaUrl,
    sourceUrl,
    mediaType,
    assetReference: file ? fileName : mediaUrl,
  });

  // 2. 获取主分支 SHA
  const { data: mainRef } = await octokit.rest.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: 'heads/main',
  });
  const mainSha = mainRef.object.sha;

  // 3. 创建分支
  const branchName = `contribution/${slug}`;
  await octokit.rest.git.createRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: mainSha,
  });

  const targetDir = mediaType === 'video' ? 'videos' : 'images';

  // 4. 提交 index.md
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: `public/data/${targetDir}/${slug}/index.md`,
    message: `Add prompt: ${title}`,
    content: Buffer.from(indexMd).toString('base64'),
    branch: branchName,
  });

  if (file && fileBase64) {
    // 5. 提交媒体文件
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `public/data/${targetDir}/${slug}/${fileName}`,
      message: `Add media for: ${title}`,
      content: fileBase64,
      branch: branchName,
    });
  }

  // 6. 发起 PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `🎨 社区投稿: ${title}`,
    head: branchName,
    base: 'main',
    body: `**来自 Prompt Gallery 的自动化投稿**\n\n- **标题**: ${title}\n- **标识**: ${slug}\n- **描述**: ${description || '未提供'}\n- **模型**: ${model || '未提供'}\n- **媒体**: ${mediaUrl || '本地上传'}\n- **来源页面**: ${sourceUrl || '未提供'}\n\n请在本地预览后点击 Merge。`,
  });

  return NextResponse.json({ success: true, prUrl: pr.html_url });
}

async function handleDelete(req: NextRequest, octokit: Octokit) {
  const body = await req.json();
  const { slug, type, reason } = body;

  if (!slug || !type) {
    return NextResponse.json({ error: 'Missing slug or type' }, { status: 400 });
  }

  const targetDir = type === 'video' ? 'videos' : 'images';
  const directoryPath = `public/data/${targetDir}/${slug}`;

  // 1. 获取主分支 SHA
  const { data: mainRef } = await octokit.rest.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: 'heads/main',
  });
  const mainSha = mainRef.object.sha;

  // 2. 获取当前树
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

  // 3. 过滤并标记删除
  const filesToDelete = treeData.tree
    .filter(item => item.path?.startsWith(directoryPath) && item.type === 'blob')
    .map(item => ({
      path: item.path!,
      mode: item.mode as '100644' | '100755' | '040000' | '160000' | '120000',
      type: item.type as 'blob' | 'tree' | 'commit',
      sha: null as unknown as string, // 设置为 null 表示删除该文件
    }));

  if (filesToDelete.length === 0) {
    return NextResponse.json({ error: 'Target directory not found or already empty' }, { status: 404 });
  }

  // 4. 创建新树
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

  // 5. 创建提交
  const displayReason = reason ? ` (原因: ${reason})` : '';
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: `Delete prompt: ${slug}${displayReason}`,
    tree: newTree.sha,
    parents: [mainSha],
  });

  // 6. 创建分支
  const branchName = `delete/${slug}-${Math.random().toString(36).substring(7)}`;
  await octokit.rest.git.createRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  });

  // 7. 发起 PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `🗑️ 删除申请: ${slug}${displayReason}`,
    head: branchName,
    base: 'main',
    body: `**来自 Prompt Gallery 的自动化删除申请**\n\n- **标识**: ${slug}\n- **原因**: ${reason || '未说明'}\n\n该操作将永久删除对应的数据文件夹，请核实后 Merge。`,
  });

  return NextResponse.json({ success: true, prUrl: pr.html_url });
}
