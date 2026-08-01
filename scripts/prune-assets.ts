/**
 * 清理 Release 里没有被任何 index.md 引用的媒体附件。
 *
 * 为什么单独做成脚本，而不是在删除申请里顺手删附件：
 * 删除申请只是开了一个 PR，合并前作品仍然挂在线上。如果发起申请时就删掉附件，
 * 线上图片会立刻 404。所以附件的回收必须以 main 的实际状态为准，事后单独执行。
 *
 * 这里刻意不复用 src/lib/github.ts —— 它依赖 ESM-only 的 octokit，
 * 在 tsx 的 CJS 加载器下跑不起来。改用 REST API + 普通 token，脚本自包含。
 *
 * 用法：
 *   npm run prune:assets              # 只报告，不删除
 *   npm run prune:assets -- --delete  # 确认后真正删除
 *
 * 凭证：环境变量 GITHUB_TOKEN，缺省时自动取 `gh auth token`。
 */
import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';

const ROOT_DATA_DIR = path.join(process.cwd(), 'public', 'data');
const REPO_OWNER = process.env.REPO_OWNER || 'chuanyue98';
const REPO_NAME = process.env.REPO_NAME || 'prompt-gallery';
const ASSET_RELEASE_TAG = process.env.ASSET_RELEASE_TAG || 'assets';
const API = 'https://api.github.com';

interface ReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
}

function resolveToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  try {
    return execSync('gh auth token', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    console.error('❌ 没有可用凭证。请设置 GITHUB_TOKEN，或先运行 `gh auth login`。');
    process.exit(1);
  }
}

async function api<T>(token: string, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`${init?.method || 'GET'} ${pathname} → ${response.status} ${response.statusText}`);
  }

  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

async function collectReferencedUrls(): Promise<Set<string>> {
  const referenced = new Set<string>();

  for (const category of ['videos', 'images']) {
    const categoryPath = path.join(ROOT_DATA_DIR, category);
    if (!(await fs.exists(categoryPath))) continue;

    for (const slug of await fs.readdir(categoryPath)) {
      const indexPath = path.join(categoryPath, slug, 'index.md');
      if (!(await fs.exists(indexPath))) continue;

      const { data } = matter(await fs.readFile(indexPath, 'utf-8'));
      const candidates = [
        data.mediaUrl,
        ...(Array.isArray(data.media)
          ? data.media.flatMap((m: Record<string, unknown>) => [m?.src, m?.cover])
          : []),
      ];

      for (const value of candidates) {
        if (typeof value === 'string' && /^https?:\/\//.test(value)) {
          referenced.add(value);
        }
      }
    }
  }

  return referenced;
}

async function main() {
  const shouldDelete = process.argv.includes('--delete');

  if (!(await fs.exists(ROOT_DATA_DIR))) {
    console.error(`❌ 找不到数据目录 ${ROOT_DATA_DIR}，中止以免误删。`);
    process.exit(1);
  }

  const token = resolveToken();

  const referenced = await collectReferencedUrls();
  console.log(`🔗 index.md 中引用的媒体地址：${referenced.size} 个`);

  let release: { id: number };
  try {
    release = await api(token, `/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${ASSET_RELEASE_TAG}`);
  } catch {
    console.log(`ℹ️  仓库还没有 tag 为 \`${ASSET_RELEASE_TAG}\` 的 Release，无需清理。`);
    return;
  }

  const assets: ReleaseAsset[] = [];
  for (let page = 1; ; page += 1) {
    const batch = await api<ReleaseAsset[]>(
      token,
      `/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}/assets?per_page=100&page=${page}`
    );
    assets.push(...batch);
    if (batch.length < 100) break;
  }
  console.log(`📦 Release 附件总数：${assets.length}`);

  const orphans = assets.filter((asset) => !referenced.has(asset.browser_download_url));

  if (orphans.length === 0) {
    console.log('✅ 没有孤儿附件。');
    return;
  }

  console.log(`\n🗑️  未被引用的附件 ${orphans.length} 个：`);
  for (const asset of orphans) {
    console.log(`   - ${asset.name}`);
  }

  if (!shouldDelete) {
    console.log('\n💡 这是预演。确认无误后加 --delete 真正删除。');
    return;
  }

  for (const asset of orphans) {
    await api(token, `/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${asset.id}`, { method: 'DELETE' });
    console.log(`   ✔ 已删除 ${asset.name}`);
  }
  console.log(`\n✅ 清理完成，共删除 ${orphans.length} 个附件。`);
}

main().catch((error) => {
  console.error('❌ 清理失败：', error instanceof Error ? error.message : error);
  process.exit(1);
});
