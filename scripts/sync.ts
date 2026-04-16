import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'gallery-data.json');

async function sync() {
  console.log('🚀 Starting data sync (from public/data)...');
  
  if (!(await fs.exists(DATA_DIR))) {
    console.error(`❌ Data directory not found at ${DATA_DIR}`);
    return;
  }

  const items = await fs.readdir(DATA_DIR);
  const galleryData = [];

  for (const slug of items) {
    const itemPath = path.join(DATA_DIR, slug);
    if (!(await fs.stat(itemPath)).isDirectory()) continue;

    const indexPath = path.join(itemPath, 'index.md');
    if (!(await fs.exists(indexPath))) continue;

    const fileContent = await fs.readFile(indexPath, 'utf-8');
    const { data, content } = matter(fileContent);

    const item = {
      slug,
      ...data,
      content,
      mediaPath: `/data/${slug}/`
    };

    galleryData.push(item);
  }

  // 只写入 JSON 数据，不再修改 README.md
  await fs.writeJSON(OUTPUT_JSON, galleryData, { spaces: 2 });

  console.log(`✅ Sync complete! ${galleryData.length} items integrated into gallery-data.json.`);
}

sync().catch(console.error);
