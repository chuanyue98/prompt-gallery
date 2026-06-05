import { GalleryItem } from '@/types/gallery';

export function isExternalUrl(value: string) {
  return /^https?:\/\//.test(value);
}

export function isVideoAsset(value: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(value);
}

export function getPrimaryMedia(item: GalleryItem) {
  return item.media?.[0] ?? null;
}

export function getPrimaryMediaType(item: GalleryItem) {
  return getPrimaryMedia(item)?.type ?? null;
}

export function filterGalleryItems(items: GalleryItem[], search: string, category: 'all' | 'video' | 'image') {
  const normalizedSearch = search.trim().toLowerCase();

  return items.filter((item) => {
    const searchableText = [
      item.title,
      item.description,
      item.model,
      item.content,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
    const primaryMediaType = getPrimaryMediaType(item);
    const matchesCategory = category === 'all' || primaryMediaType === category;

    return matchesSearch && matchesCategory;
  });
}

export function getGalleryMediaUrl(item: GalleryItem, field: 'src' | 'cover', index: number = 0) {
  const mediaItem = item.media?.[index] || item.media?.[0];
  const asset = mediaItem?.[field] || item.mediaUrl;

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
