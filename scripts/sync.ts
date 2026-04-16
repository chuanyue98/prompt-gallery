import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const ROOT_DATA_DIR = path.join(process.cwd(), 'public', 'data'); // 注意：现在我们决定只用 public/data
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'gallery-data.json');

async function sync() {
  console.log('🚀 Starting robust sync (public/data)...');
  
  if (!(await fs.exists(ROOT_DATA_DIR))) {
    console.error(`❌ Data directory not found at ${ROOT_DATA_DIR}`);
    return;
  }

  const categories = ['videos', 'images'];
  const galleryData = [];

  for (const cat of categories) {
    const catPath = path.join(ROOT_DATA_DIR, cat);
    if (!(await fs.exists(catPath))) continue;

    const items = await fs.readdir(catPath);
    for (const slug of items) {
      const itemPath = path.join(catPath, slug);
      if (!(await fs.stat(itemPath)).isDirectory()) continue;

      const indexPath = path.join(itemPath, 'index.md');
      if (!(await fs.exists(indexPath))) continue;

      const fileContent = await fs.readFile(indexPath, 'utf-8');
      const { data, content } = matter(fileContent);

      const files = await fs.readdir(itemPath);
      
      // 智能识别媒体
      const videoFile = files.find(f => f.endsWith('.mp4'));
      const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));
      
      let mainMedia = "";
      let type: 'video' | 'image' = cat === 'videos' ? 'video' : 'image';
      
      if (type === 'video') {
        mainMedia = videoFile || imageFiles[0] || "";
      } else {
        mainMedia = imageFiles[0] || videoFile || "";
      }

      // 自动寻找封面 (如果是视频，优先找 cover.png，找不到用视频自己)
      const coverFile = imageFiles.find(f => f.includes('cover') || f.includes('preview')) || imageFiles[0] || videoFile || "";

      galleryData.push({
        slug,
        ...data,
        content,
        type,
        mediaPath: `/data/${cat}/${slug}/`,
        media: [{
          type,
          src: mainMedia,
          cover: coverFile
        }]
      });
    }
  }

  await fs.writeJSON(OUTPUT_JSON, galleryData, { spaces: 2 });
  console.log(`✅ Success! ${galleryData.length} items cataloged correctly.`);
}

sync().catch(console.error);
