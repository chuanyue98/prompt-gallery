import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { 
  getOctokit, 
  createContributionPullRequest, 
  requestDeletionPullRequest,
  inferMediaTypeFromUrl,
  MediaType
} from '@/lib/github';

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

function buildContributionSlug(input: {
  title: string;
}) {
  const cleanTitle = input.title
    .trim()
    .replace(/[\/\s\\:?*"<>|]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  /* v8 ignore next 3 */
  let base = 'contribution';
  if (cleanTitle) {
    base = cleanTitle;
  }
  const randomSuffix = Math.random().toString(36).substring(2, 7);

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
    const octokit = getOctokit();
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

async function handleCreate(req: NextRequest, octokit: Octokit, config: { REPO_OWNER: string, REPO_NAME: string }) {
  const formData = await req.formData();
  const title = (formData.get('title') as string) || '';
  const description = (formData.get('description') as string) || '';
  const prompt = (formData.get('prompt') as string) || '';
  const tags = (formData.get('tags') as string) || '';
  const model = (formData.get('model') as string) || '';
  const uploadedFile = formData.get('file');
  const file = (uploadedFile && typeof uploadedFile === 'object' && 'size' in uploadedFile && (uploadedFile as { size: number }).size > 0) ? (uploadedFile as unknown as File) : null;
  /* v8 ignore next 4 */
  const mediaUrlVal = formData.get('mediaUrl');
  const mediaUrl = (typeof mediaUrlVal === 'string' && mediaUrlVal.trim().length > 0) ? mediaUrlVal.trim() : '';
  const sourceUrl = ((formData.get('sourceUrl') as string) || '').trim();
  
  const validation = validateCreateContributionInput({ title, prompt, mediaUrl, file });

  if (validation.error || !validation.mediaType) {
    return NextResponse.json({ error: validation.error || 'Validation failed' }, { status: 400 });
  }

  const slug = buildContributionSlug({ title });
  const mediaType = validation.mediaType;
  /* v8 ignore next 1 */
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
    /* v8 ignore next 1 */
    assetReference: file ? fileName : mediaUrl,
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
