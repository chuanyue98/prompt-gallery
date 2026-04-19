export interface Media {
  type: 'video' | 'image';
  src: string;
  cover: string;
}

export interface GalleryItem {
  slug: string;
  description: string;
  tags: string[];
  mediaPath: string;
  media: Media[];
  content: string;
  model?: string;
  mediaUrl?: string;
  sourceUrl?: string;
}
