import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    let targetUrl = url;
    let isX = false;

    if (url.includes('x.com') || url.includes('twitter.com')) {
      targetUrl = url.replace(/https:\/\/(x|twitter)\.com/, 'https://fxtwitter.com');
      isX = true;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'TelegramBot (like TwitterBot)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    const metadata: any = {
      title: '',
      description: '',
      image: '',
      video: '',
      prompt: ''
    };

    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const descMatch = html.match(/<meta property="og:description" content="(.*?)"/);
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    const videoMatch = html.match(/<meta property="og:video" content="(.*?)"/);

    metadata.title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
    metadata.description = descMatch ? decodeHtmlEntities(descMatch[1]) : '';
    metadata.image = imageMatch ? imageMatch[1] : '';
    metadata.video = videoMatch ? videoMatch[1] : '';

    if (isX) {
      // For X, the description often contains the prompt. 
      // Try to extract text after "提示词" or "Prompt"
      const promptMatch = metadata.description.match(/(提示词|Prompt|咒语)[:：\s]+([\s\S]+)/i);
      if (promptMatch) {
        metadata.prompt = promptMatch[2].trim();
      } else {
        metadata.prompt = metadata.description;
      }
      
      // Clean up title (often "User (@username)")
      if (metadata.title.includes('(@')) {
        metadata.title = metadata.title.split('(@')[0].trim();
      }
    }

    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/<br>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n');
}
