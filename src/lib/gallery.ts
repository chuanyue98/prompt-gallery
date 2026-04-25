import { GalleryItem } from '@/types/gallery';

export function isExternalUrl(value: string) {
  return /^https?:\/\//.test(value);
}

export function isVideoAsset(value: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(value);
}

export function filterGalleryItems(items: GalleryItem[], search: string, category: 'all' | 'video' | 'image') {
  const normalizedSearch = search.toLowerCase();

  return items.filter((item) => {
    const matchesSearch = item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      || item.description.toLowerCase().includes(normalizedSearch);
    const matchesCategory = category === 'all' || item.media[0].type === category;

    return matchesSearch && matchesCategory;
  });
}

export function getGalleryMediaUrl(item: GalleryItem, field: 'src' | 'cover') {
  const asset = item.media?.[0]?.[field] || item.mediaUrl;

  if (!asset) {
    return '';
  }

  if (isExternalUrl(asset)) {
    return asset;
  }

  return `${item.mediaPath}${asset}`;
}

export function safelyPlayVideo(video: HTMLVideoElement) {
  const playPromise = video.play();

  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Ignore codec/source failures for hover previews.
    });
  }
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}
