import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const ROOT_DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const PUBLIC_DATA_DIR = path.join(PUBLIC_DIR, 'data');
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'gallery-data.json');

async function sync() {
  console.log('🚀 Starting categorized sync (videos & images)...');
  
  await fs.ensureDir(PUBLIC_DATA_DIR);
  const categories = ['videos', 'images'];
  const galleryData = [];

  for (const cat of categories) {
    const catSourcePath = path.join(ROOT_DATA_DIR, cat);
    if (!(await fs.exists(catSourcePath))) continue;

    const items = await fs.readdir(catSourcePath);
    for (const slug of items) {
      const itemSourcePath = path.join(catSourcePath, slug);
      if (!(await fs.stat(itemSourcePath)).isDirectory()) continue;

      const indexPath = path.join(itemSourcePath, 'index.md');
      if (!(await fs.exists(indexPath))) continue;

      const fileContent = await fs.readFile(indexPath, 'utf-8');
      const { data, content } = matter(fileContent);

      // 自动同步到 public
      const itemPublicPath = path.join(PUBLIC_DATA_DIR, slug);
      await fs.ensureDir(itemPublicPath);
      const files = await fs.readdir(itemSourcePath);
      for (const file of files) {
        if (file === 'index.md') continue;
        await fs.copy(path.join(itemSourcePath, file), path.join(itemPublicPath, file));
      }

      // 寻找产物文件 (mp4 或 图片)
      const mediaFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));
      const mainMedia = mediaFiles[0] || '';

      galleryData.push({
        slug,
        ...data,
        content,
        // 自动识别类型
        type: cat === 'videos' ? 'video' : 'image',
        mediaPath: `/data/${slug}/`,
        media: [{
          type: cat === 'videos' ? 'video' : 'image',
          src: mainMedia,
          cover: mainMedia // 如果是视频，前端将直接处理视频预览
        }]
      });
    }
  }

  await fs.writeJSON(OUTPUT_JSON, galleryData, { spaces: 2 });
  console.log(`✅ Categorized sync complete! ${galleryData.length} items processed.`);
}

sync().catch(console.error);
