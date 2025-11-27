import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Special handling for YouTube URLs
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return NextResponse.json({
        url,
        title: 'YouTube Video',
        description: 'Watch on YouTube',
        image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      });
    }

    // Fetch the URL for other sites
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextnBot/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 });
    }

    const html = await response.text();

    // Extract Open Graph metadata
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                    html.match(/<meta name="twitter:title" content="([^"]*)"/) ||
                    html.match(/<title>([^<]*)<\/title>/);
    
    const ogDescription = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                          html.match(/<meta name="twitter:description" content="([^"]*)"/) ||
                          html.match(/<meta name="description" content="([^"]*)"/);
    
    const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/) ||
                    html.match(/<meta name="twitter:image" content="([^"]*)"/);

    const preview = {
      url,
      title: ogTitle ? ogTitle[1] : new URL(url).hostname,
      description: ogDescription ? ogDescription[1] : '',
      image: ogImage ? ogImage[1] : null,
    };

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('URL preview error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
