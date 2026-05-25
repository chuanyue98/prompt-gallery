import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = ['x.com', 'twitter.com', 'fxtwitter.com', 'pbs.twimg.com'];

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

    let targetUrl = url;
    let isX = false;

    if (parsedUrl.hostname.includes('x.com') || parsedUrl.hostname.includes('twitter.com')) {
      targetUrl = url.replace(/https?:\/\/(www\.)?(x|twitter)\.com/, 'https://fxtwitter.com');
      isX = true;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'TelegramBot (like TwitterBot)'
      }
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const html = await response.text();

    const metadata = {
      title: getMetaContent(html, 'og:title'),
      description: getMetaContent(html, 'og:description'),
      image: getMetaContent(html, 'og:image'),
      video: getMetaContent(html, 'og:video'),
      prompt: ''
    };

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
