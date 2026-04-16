import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

// 注意：在部署到 Vercel 时，请在环境变量中设置以下三项
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'your-username';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'prompt-gallery';

export async function POST(req: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub Token not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const prompt = formData.get('prompt') as string;
    const tags = formData.get('tags') as string;
    const model = formData.get('model') as string;
    const file = formData.get('file') as File;

    if (!file || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. 准备数据
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) + '-' + Math.random().toString(36).substring(7);
    const fileName = file.name;
    const fileBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');

    const indexMd = `---
title: "${title}"
description: "${description}"
tags: [${tags.split(',').map(t => `"${t.trim()}"`).join(', ')}]
model: "${model}"
media:
  - type: "${file.type.startsWith('video') ? 'video' : 'image'}"
    src: "${fileName}"
    cover: "${fileName}"
---

### 提示词 (Prompt)
${prompt}
`;

    // 2. 初始化 Octokit
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // 3. 获取主分支最新的 SHA
    const { data: mainRef } = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
    const mainSha = mainRef.object.sha;

    // 4. 创建新分支
    const branchName = `contribution/${slug}`;
    await octokit.rest.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    });

    // 5. 提交 index.md
    await octokit.rest.repositories.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `public/data/${slug}/index.md`,
      message: `Add prompt: ${title}`,
      content: Buffer.from(indexMd).toString('base64'),
      branch: branchName,
    });

    // 6. 提交媒体文件 (图片/视频)
    await octokit.rest.repositories.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `public/data/${slug}/${fileName}`,
      message: `Add media for: ${title}`,
      content: fileBase64,
      branch: branchName,
    });

    // 7. 发起 Pull Request
    const { data: pr } = await octokit.rest.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `新投稿: ${title}`,
      head: branchName,
      base: 'main',
      body: `来自网页端的提示词投稿。\n\n**标题**: ${title}\n**描述**: ${description}\n**贡献者**: 匿名用户`,
    });

    return NextResponse.json({ success: true, prUrl: pr.html_url });

  } catch (error: any) {
    console.error('GitHub PR Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create PR' }, { status: 500 });
  }
}
