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

interface CreateContributionInput {
  title: string;
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

async function downloadMedia(url: string): Promise<{ fileBase64: string; fileName: string }> {
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
  
  // Try to get filename from URL or content-type
  let fileName = 'media-file';
  const urlPath = new URL(url).pathname;
  const lastPart = urlPath.split('/').pop();
  if (lastPart && lastPart.includes('.')) {
    fileName = lastPart;
  } else {
    const contentType = response.headers.get('content-type');
    if (contentType) {
      // Split by ; to handle "image/jpeg; charset=utf-8"
      const typePart = contentType.split(';')[0].trim();
      const ext = typePart.split('/').pop();
      if (ext) fileName = `media-file.${ext}`;
    }
  }

  return { fileBase64, fileName };
}

async function handleCreate(req: NextRequest, octokit: Octokit, config: { REPO_OWNER: string, REPO_NAME: string }) {
  const formData = await req.formData();
  const title = (formData.get('title') as string) || '';
  const description = (formData.get('description') as string) || '';
  const prompt = (formData.get('prompt') as string) || '';
  const tags = (formData.get('tags') as string) || '';
  const model = (formData.get('model') as string) || '';
  const uploadedFile = formData.get('file');
  const file = (uploadedFile && typeof uploadedFile === 'object' && 'size' in uploadedFile && (uploadedFile as { size: number }).size > 0) ? (uploadedFile as unknown as File) : null;
  const mediaUrlVal = formData.get('mediaUrl');
  let mediaUrl = '';
  if (typeof mediaUrlVal === 'string') {
    if (mediaUrlVal.trim().length > 0) {
      mediaUrl = mediaUrlVal.trim();
    }
  }
  const sourceUrl = ((formData.get('sourceUrl') as string) || '').trim();

  if (mediaUrl && !isHttpOrHttpsUrl(mediaUrl)) {
    return NextResponse.json({ error: 'mediaUrl 只能使用 http 或 https 协议' }, { status: 400 });
  }

  if (sourceUrl && !isHttpOrHttpsUrl(sourceUrl)) {
    return NextResponse.json({ error: 'sourceUrl 只能使用 http 或 https 协议' }, { status: 400 });
  }

  const validation = validateCreateContributionInput({ title, prompt, mediaUrl, file });

  if (validation.error || !validation.mediaType) {
    return NextResponse.json({ error: validation.error || 'Validation failed' }, { status: 400 });
  }

  const slug = buildContributionSlug({ title });
  const mediaType = validation.mediaType;
  
  let fileName = '';
  let fileBase64: string | null = null;

  if (file) {
    fileName = file.name;
    const fileBuffer = await file.arrayBuffer();
    fileBase64 = Buffer.from(fileBuffer).toString('base64');
  } else if (mediaUrl) {
    // Automatically download media from URL to save it locally
    try {
      const downloaded = await downloadMedia(mediaUrl);
      fileName = downloaded.fileName;
      fileBase64 = downloaded.fileBase64;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error during media download';
      console.error('Failed to download media:', error);
      // Fallback: if download fails, we could either error out or continue with just the URL
      // Given user's request, erroring out is safer to ensure persistence.
      return NextResponse.json({ error: `无法下载媒体文件进行本地保存: ${message}` }, { status: 500 });
    }
  }

  // assetReference should point to the local file we are about to commit
  const assetReference = fileName;

  const indexMd = buildContributionIndexMd({
    title,
    description,
    prompt,
    tags,
    model,
    mediaUrl,
    sourceUrl,
    mediaType,
    assetReference,
  });

  const pr = await createContributionPullRequest(octokit, config, {
    slug, title, description, model, mediaUrl, sourceUrl, mediaType, indexMd, fileName, fileBase64
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
