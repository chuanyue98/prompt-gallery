import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/utils';

const ALLOWED_DOMAINS = ['x.com', 'twitter.com', 'fxtwitter.com', 'pbs.twimg.com'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254'];

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 });
    }

    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname.replace('www.', ''))) {
      return NextResponse.json({ success: false, error: 'Domain not allowed' }, { status: 403 });
    }

    const normalizedHost = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTS.some(host => normalizedHost === host || normalizedHost === `www.${host}`)) {
      return NextResponse.json({ success: false, error: 'Domain not allowed' }, { status: 403 });
    }

    let targetUrl = url;
    let isX = false;

    if (parsedUrl.hostname.includes('x.com') || parsedUrl.hostname.includes('twitter.com')) {
      targetUrl = url.replace(/https?:\/\/(www\.)?(x|twitter)\.com/, 'https://fxtwitter.com');
      isX = true;
    }

    const response = await fetchWithTimeout(targetUrl, {
      headers: {
        'User-Agent': 'TelegramBot (like TwitterBot)'
      }
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const MAX_RESPONSE_SIZE = 2 * 1024 * 1024;
    let totalSize = 0;
    const chunks: Uint8Array[] = [];

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        totalSize += value.length;
        if (totalSize > MAX_RESPONSE_SIZE) {
          throw new Error('Response too large');
        }
        chunks.push(value);
      }
    } else {
      const text = await response.text();
      if (text.length > MAX_RESPONSE_SIZE) {
        throw new Error('Response too large');
      }
      chunks.push(new Uint8Array(Buffer.from(text, 'utf-8')));
    }

    const html = Buffer.concat(chunks).toString('utf-8');

    const metadata = {
      title: getMetaContent(html, 'og:title'),
      description: getMetaContent(html, 'og:description'),
      image: getMetaContent(html, 'og:image'),
      video: getMetaContent(html, 'og:video'),
      images: [] as string[],
      prompt: ''
    };

    // Extract all media URLs (pbs.twimg.com or pbs.fxtwitter.com)
    const mediaMatches = html.match(/https:\/\/pbs\.(twimg|fxtwitter)\.com\/media\/[^"'\s?]+/g);
    if (mediaMatches) {
      metadata.images = [...new Set(mediaMatches)].map(url => `${url}?name=orig`);
    }

    // If og:image is a mosaic, prefer the first individual image
    if (metadata.image.includes('mosaic.fxtwitter.com') && metadata.images.length > 0) {
      metadata.image = metadata.images[0];
    }

    if (isX) {
      // For X, the description often contains the prompt. 
      const promptMatch = metadata.description.match(/(提示词|Prompt|咒语)[:：\s]+([\s\S]+)/i);
      if (promptMatch) {
        metadata.prompt = promptMatch[2].trim();
      } else {
        metadata.prompt = metadata.description;
      }
      
      if (metadata.title.includes('(@')) {
        metadata.title = metadata.title.split('(@')[0].trim();
      }
    }

    return NextResponse.json({ success: true, metadata });
  } catch (error: unknown) {
    console.error('Parse Link Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to parse link' }, { status: 500 });
  }
}

function getMetaContent(html: string, property: string): string {
  // A bit more robust than simple regex, handles property or name
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]+)"`, 'i'),
    new RegExp(`<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="${property}"`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return '';
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n');
}
