import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const ROOT_DATA_DIR = path.join(process.cwd(), 'public', 'data'); // 注意：现在我们决定只用 public/data
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'gallery-data.json');

function isExternalUrl(value: string) {
  return /^https?:\/\//.test(value);
}

function isVideoFile(fileName: string) {
  return /\.(mp4|webm|mov|m4v)$/i.test(fileName);
}

function isImageFile(fileName: string) {
  return /\.(png|jpe?g|webp|avif|gif)$/i.test(fileName);
}

interface MediaItem {
  type?: 'video' | 'image';
  src: string;
  cover?: string;
}

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
    console.log(`📂 Processing category: ${cat}, found ${items.length} items.`);
    for (const slug of items) {
      try {
        const itemPath = path.join(catPath, slug);
        if (!(await fs.stat(itemPath)).isDirectory()) continue;

        const indexPath = path.join(itemPath, 'index.md');
        if (!(await fs.exists(indexPath))) {
          console.warn(`⚠️ Missing index.md in ${itemPath}, skipping.`);
          continue;
        }

        const fileContent = await fs.readFile(indexPath, 'utf-8');
        const { data, content } = matter(fileContent);
        const restData = { ...(data as Record<string, unknown>) };
        delete restData.seed;

        // Ensure title is a string if it exists
        if (restData.title !== undefined) {
          restData.title = String(restData.title);
        }

        const files = await fs.readdir(itemPath);
        
        const frontmatterMedia = Array.isArray(data.media) ? (data.media[0] as MediaItem) : null;

        // 智能识别媒体
        const videoFile = files.find(isVideoFile);
        const imageFiles = files.filter(isImageFile);
        
        let mainMedia = "";
        const type: 'video' | 'image' = cat === 'videos' ? 'video' : 'image';
        
        if (type === 'video') {
          mainMedia = videoFile || imageFiles[0] || "";
        } else {
          mainMedia = imageFiles[0] || videoFile || "";
        }

        // 自动寻找封面。视频没有图片封面时保持为空，让前端直接渲染视频预览。
        let coverFile = imageFiles.find(f => /cover|preview/i.test(f)) || imageFiles[0] || "";

        if (!mainMedia && ((data.mediaUrl as string) || frontmatterMedia?.src)) {
          mainMedia = (data.mediaUrl as string) || frontmatterMedia!.src;
        }

        if (!coverFile && ((data.mediaUrl as string) || frontmatterMedia?.cover)) {
          coverFile = (data.mediaUrl as string) || frontmatterMedia?.cover || "";
        }

        const resolvedMedia = (data.mediaUrl as string) || (Array.isArray(data.media) ? (data.media[0] as MediaItem)?.src : (data.media as MediaItem)?.src);
        const mediaPath = resolvedMedia && isExternalUrl(resolvedMedia)
          ? ''
          : `/data/${cat}/${slug}/`;

        let finalMedia: MediaItem[] = [];
        if (Array.isArray(data.media) && data.media.length > 0) {
          finalMedia = (data.media as MediaItem[]).map(m => ({
            type: m.type || type,
            src: m.src,
            cover: m.cover || (type === 'video' ? coverFile : m.src)
          }));
        } else if (data.media && typeof data.media === 'object' && (data.media as MediaItem).src) {
          const m = data.media as MediaItem;
          finalMedia = [{
            type: m.type || type,
            src: m.src,
            cover: m.cover || (type === 'video' ? coverFile : m.src)
          }];
        } else {
          finalMedia = [{
            type: type,
            src: mainMedia,
            cover: coverFile
          }];
        }

        galleryData.push({
          slug,
          ...restData,
          content,
          type,
          mediaPath,
          media: finalMedia
        });
        console.log(`✅ Cataloged: ${slug}`);
      } catch (err) {
        console.error(`❌ Failed to process item [${slug}] in [${cat}]:`, err);
      }
    }
  }

  await fs.writeJSON(OUTPUT_JSON, galleryData, { spaces: 2 });
  console.log(`✅ Success! ${galleryData.length} items cataloged correctly.`);
}

sync().catch(console.error);
