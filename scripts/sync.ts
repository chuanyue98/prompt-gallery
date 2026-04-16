import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const ROOT_DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const PUBLIC_DATA_DIR = path.join(PUBLIC_DIR, 'data'); // 同步后的网页访问目录
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'gallery-data.json');

async function sync() {
  console.log('🚀 Starting deep sync (data -> public/data)...');
  
  // 1. 确保根目录 data 存在
  if (!(await fs.exists(ROOT_DATA_DIR))) {
    console.error(`❌ Source data directory not found at ${ROOT_DATA_DIR}`);
    return;
  }

  // 2. 清理并重建 public/data (确保只包含当前存在的数据)
  await fs.ensureDir(PUBLIC_DATA_DIR);
  // 注意：我们这里不全量清理，以免删除正在运行的视频流，采用增量同步或按需同步逻辑

  const items = await fs.readdir(ROOT_DATA_DIR);
  const galleryData = [];

  for (const slug of items) {
    const itemSourcePath = path.join(ROOT_DATA_DIR, slug);
    if (!(await fs.stat(itemSourcePath)).isDirectory()) continue;

    const indexPath = path.join(itemSourcePath, 'index.md');
    if (!(await fs.exists(indexPath))) continue;

    // A. 解析内容
    const fileContent = await fs.readFile(indexPath, 'utf-8');
    const { data, content } = matter(fileContent);

    // B. 同步媒体文件到 public/data/slug (让网页能访问到)
    const itemPublicPath = path.join(PUBLIC_DATA_DIR, slug);
    await fs.ensureDir(itemPublicPath);
    
    // 拷贝所有文件 (除了 index.md)
    const files = await fs.readdir(itemSourcePath);
    for (const file of files) {
      if (file === 'index.md') continue;
      await fs.copy(path.join(itemSourcePath, file), path.join(itemPublicPath, file));
    }

    const item = {
      slug,
      ...data,
      content,
      mediaPath: `/data/${slug}/` // 网页访问路径保持不变
    };

    galleryData.push(item);
  }

  // C. 生成最终索引
  await fs.writeJSON(OUTPUT_JSON, galleryData, { spaces: 2 });

  console.log(`✅ Deep sync complete! ${galleryData.length} items mirrored to public.`);
}

sync().catch(console.error);
