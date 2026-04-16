import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'gallery-data.json');

async function sync() {
  console.log('🚀 Starting simple sync (public/data only)...');
  
  if (!(await fs.exists(DATA_DIR))) {
    console.error(`❌ Data directory not found at ${DATA_DIR}`);
    return;
  }

  const categories = ['videos', 'images'];
  const galleryData = [];

  for (const cat of categories) {
    const catPath = path.join(DATA_DIR, cat);
    if (!(await fs.exists(catPath))) continue;

    const items = await fs.readdir(catPath);
    for (const slug of items) {
      const itemPath = path.join(catPath, slug);
      if (!(await fs.stat(itemPath)).isDirectory()) continue;

      const indexPath = path.join(itemPath, 'index.md');
      if (!(await fs.exists(indexPath))) continue;

      const fileContent = await fs.readFile(indexPath, 'utf-8');
      const { data, content } = matter(fileContent);

      // 寻找产物文件
      const files = await fs.readdir(itemPath);
      const mediaFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));
      const mainMedia = mediaFiles[0] || '';

      galleryData.push({
        slug,
        ...data,
        content,
        type: cat === 'videos' ? 'video' : 'image',
        // 关键：现在路径直接指向 public 内部
        mediaPath: `/data/${cat}/${slug}/`,
        media: [{
          type: cat === 'videos' ? 'video' : 'image',
          src: mainMedia,
          cover: mainMedia
        }]
      });
    }
  }

  await fs.writeJSON(OUTPUT_JSON, galleryData, { spaces: 2 });
  console.log(`✅ Simple sync complete! ${galleryData.length} items cataloged.`);
}

sync().catch(console.error);
