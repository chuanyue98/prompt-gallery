import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

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

export async function POST(req: NextRequest) {
  try {
    if (!APP_ID || !PRIVATE_KEY || !INSTALLATION_ID) {
      return NextResponse.json({ error: 'GitHub App credentials not configured' }, { status: 500 });
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

    // 1. 准备文件数据
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

    // 2. 初始化以机器人身份进行认证
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
        installationId: INSTALLATION_ID,
      },
    });

    // 3. 获取主分支 SHA
    const { data: mainRef } = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
    const mainSha = mainRef.object.sha;

    // 4. 创建分支
    const branchName = `contribution/${slug}`;
    await octokit.rest.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    });

    // 5. 提交 index.md
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `public/data/${slug}/index.md`,
      message: `Add prompt: ${title}`,
      content: Buffer.from(indexMd).toString('base64'),
      branch: branchName,
    });

    // 6. 提交媒体文件
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `public/data/${slug}/${fileName}`,
      message: `Add media for: ${title}`,
      content: fileBase64,
      branch: branchName,
    });

    // 7. 发起 PR
    const { data: pr } = await octokit.rest.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `🎨 社区投稿: ${title}`,
      head: branchName,
      base: 'main',
      body: `**来自 Prompt Gallery 的自动化投稿**\n\n- **作品**: ${title}\n- **描述**: ${description}\n- **模型**: ${model}\n\n请在本地预览后点击 Merge。`,
    });

    return NextResponse.json({ success: true, prUrl: pr.html_url });

  } catch (error: any) {
    console.error('Robot Contribution Error:', error);
    return NextResponse.json({ error: error.message || 'Robot processing failed' }, { status: 500 });
  }
}
