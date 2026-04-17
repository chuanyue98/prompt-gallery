export interface Media {
  type: 'video' | 'image';
  src: string;
  cover: string;
}

export interface GalleryItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  mediaPath: string;
  media: Media[];
  content: string;
  model?: string;
  seed?: string | number;
  mediaUrl?: string;
  sourceUrl?: string;
}
