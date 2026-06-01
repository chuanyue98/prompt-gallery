import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import {
  getOctokit,
  createContributionPullRequest,
  requestDeletionPullRequest,
  inferMediaTypeFromUrl,
  MediaType
} from '@/lib/github';
import { randomHex5 } from '@/lib/utils';

export function isHttpOrHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildContributionSlug(input: {
  title: string;
}) {
  const cleanTitle = input.title
    .trim()
    .replace(/[\/\s\\:?*"<>|]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  let base = 'contribution';
  if (cleanTitle.length > 0) {
    base = cleanTitle;
  }
  const randomSuffix = randomHex5();

  return `${base}-${randomSuffix}`;
}

function inferMediaTypeFromFile(file: File): MediaType {
  return file.type.startsWith('video') ? 'video' : 'image';
}

export function validateCreateContributionInput(input: {
  title: string;
  prompt: string;
  mediaUrls: string[];
  files: File[];
}): { error: string | null; mediaType: MediaType | null } {
  if (!input.title.trim() || !input.prompt.trim()) {
    return { error: 'Missing required fields: title and prompt are mandatory', mediaType: null };
  }

  const hasMedia = input.files.length > 0 || input.mediaUrls.length > 0;
  if (!hasMedia) {
    return { error: 'Provide at least one media file or media URL', mediaType: null };
  }

  let mediaType: MediaType | null = null;
  if (input.files.length > 0) {
    mediaType = inferMediaTypeFromFile(input.files[0]);
  } else if (input.mediaUrls.length > 0) {
    mediaType = inferMediaTypeFromUrl(input.mediaUrls[0]);
  }

  if (!mediaType) {
    return { error: 'Media must be an image or video file', mediaType: null };
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
  sourceUrl: string;
  mediaItems: { type: MediaType; src: string; cover: string }[];
}): string {
  const normalizedTags = normalizeTagList(input.tags)
    .map((tag) => `"${tag}"`)
    .join(', ');

  const mediaSection = input.mediaItems
    .map(
      (m) => `  - type: "${m.type}"
    src: "${m.src.replace(/"/g, '\\"')}"
    cover: "${m.cover.replace(/"/g, '\\"')}"`
    )
    .join('\n');

  return `---
title: "${input.title.replace(/"/g, '\\"')}"
description: "${input.description.replace(/"/g, '\\"')}"
tags: [${normalizedTags}]
model: "${input.model.replace(/"/g, '\\"')}"
${input.sourceUrl ? `sourceUrl: "${input.sourceUrl.replace(/"/g, '\\"')}"\n` : ''}media:
${mediaSection}
---

### 提示词 (Prompt)
${input.prompt}
`;
}

export async function POST(req: NextRequest) {
  try {
    const octokit = await getOctokit();
    const REPO_OWNER = process.env.REPO_OWNER || 'chuanyue98';
    const REPO_NAME = process.env.REPO_NAME || 'prompt-gallery';

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'create';

    if (action === 'delete') {
      return await handleDelete(req, octokit, { REPO_OWNER, REPO_NAME });
    }

    return await handleCreate(req, octokit, { REPO_OWNER, REPO_NAME });

  } catch (error: unknown) {
    console.error('Robot Contribution Error:', error);
    const message = error instanceof Error ? error.message : 'Robot processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_UPLOAD_FILE_SIZE = 4 * 1024 * 1024; // Keep multipart uploads below common platform request limits.

async function downloadMedia(url: string): Promise<{ fileBase64: string; fileName: string; mediaType?: MediaType }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch media from URL: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const fileBase64 = Buffer.from(buffer).toString('base64');
  let mediaType: MediaType | undefined;
  const responseContentType = response.headers.get('content-type') || '';
  const mediaTypePart = responseContentType.split(';')[0].trim();
  if (mediaTypePart.startsWith('video/')) mediaType = 'video';
  else if (mediaTypePart.startsWith('image/')) mediaType = 'image';
  
  let fileName = 'media-file';
  const urlPath = new URL(url).pathname;
  const lastPart = urlPath.split('/').pop();
  if (lastPart && lastPart.includes('.')) {
    fileName = lastPart;
  } else if (responseContentType) {
    const typePart = responseContentType.split(';')[0].trim();
    const ext = typePart.split('/').pop();
    if (ext) fileName = `media-file.${ext}`;
  }

  return { fileBase64, fileName, mediaType };
}

async function handleCreate(req: NextRequest, octokit: Octokit, config: { REPO_OWNER: string, REPO_NAME: string }) {
  const formData = await req.formData();
  const title = (formData.get('title') as string) || '';
  const description = (formData.get('description') as string) || '';
  const prompt = (formData.get('prompt') as string) || '';
  const tags = (formData.get('tags') as string) || '';
  const model = (formData.get('model') as string) || '';
  const sourceUrl = ((formData.get('sourceUrl') as string) || '').trim();

  const files: File[] = [];
  formData.getAll('file').forEach((uploadedFile) => {
    if (uploadedFile && typeof uploadedFile === 'object' && 'size' in uploadedFile && (uploadedFile as { size: number }).size > 0) {
      files.push(uploadedFile as unknown as File);
    }
  });

  if (files.some((file) => file.size > MAX_UPLOAD_FILE_SIZE)) {
    return NextResponse.json(
      { error: '上传文件过大，请压缩到 4MB 以内，或改用 Media URL 投稿。' },
      { status: 413 }
    );
  }

  const mediaUrls: string[] = [];
  formData.getAll('mediaUrl').forEach((val) => {
    if (typeof val === 'string' && val.trim().length > 0) {
      const url = val.trim();
      if (isHttpOrHttpsUrl(url)) {
        mediaUrls.push(url);
      }
    }
  });

  if (sourceUrl && !isHttpOrHttpsUrl(sourceUrl)) {
    return NextResponse.json({ error: 'sourceUrl 只能使用 http 或 https 协议' }, { status: 400 });
  }

  const validation = validateCreateContributionInput({ title, prompt, mediaUrls, files });

  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const slug = buildContributionSlug({ title });
  let primaryMediaType = validation.mediaType;

  const committedFiles: { fileName: string; fileBase64: string }[] = [];
  const mediaItems: { type: MediaType; src: string; cover: string }[] = [];

  for (const file of files) {
    const fileBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');
    const type = inferMediaTypeFromFile(file);
    committedFiles.push({ fileName: file.name, fileBase64 });
    mediaItems.push({ type, src: file.name, cover: file.name });
  }
// Handle media URLs (download and persist)
let urlIdx = 0;
for (const url of mediaUrls) {
  try {
    const downloaded = await downloadMedia(url);
    const type = inferMediaTypeFromUrl(url) || downloaded.mediaType || 'image';

    // Ensure unique filename for downloads
    let finalFileName = downloaded.fileName;
    if (committedFiles.some(f => f.fileName === finalFileName)) {
      const parts = finalFileName.split('.');
      const ext = parts.pop();
      finalFileName = `${parts.join('.')}-${urlIdx++}.${ext}`;
    }

    committedFiles.push({ fileName: finalFileName, fileBase64: downloaded.fileBase64 });
    mediaItems.push({ type, src: finalFileName, cover: finalFileName });
  } catch (error: unknown) {

      const message = error instanceof Error ? error.message : 'Media download failed';
      return NextResponse.json({ error: `无法下载媒体文件: ${message}` }, { status: 500 });
    }
  }

  if (!primaryMediaType) {
    primaryMediaType = mediaItems[0]?.type || 'image';
  }

  const indexMd = buildContributionIndexMd({
    title,
    description,
    prompt,
    tags,
    model,
    sourceUrl,
    mediaItems,
  });

  const pr = await createContributionPullRequest(octokit, config, {
    slug,
    title,
    description,
    model,
    sourceUrl,
    primaryMediaType,
    indexMd,
    files: committedFiles,
  });

  return NextResponse.json({ success: true, prUrl: pr.html_url });
}

async function handleDelete(req: NextRequest, octokit: Octokit, config: { REPO_OWNER: string, REPO_NAME: string }) {
  const body = await req.json();
  const { slug, type, reason } = body;

  if (!slug || !type) {
    return NextResponse.json({ error: 'Missing slug or type' }, { status: 400 });
  }

  try {
    const pr = await requestDeletionPullRequest(octokit, config, {
      slug, type: type as MediaType, reason: reason || ''
    });
    return NextResponse.json({ success: true, prUrl: pr.html_url });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Target directory not found or already empty') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
