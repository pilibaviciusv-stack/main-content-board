import { NextRequest, NextResponse } from 'next/server';

async function tryNoembed(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch { return null; }
}

async function tryTikTokOembed(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch { return null; }
}

async function tryInstagramScrape(url: string): Promise<string | null> {
  // Extract shortcode from Instagram URL
  // Handles: /reel/CODE/, /p/CODE/, /tv/CODE/
  const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!match) return null;
  const shortcode = match[1];

  try {
    // Instagram's public embed page contains og:image with the thumbnail
    const res = await fetch(
      `https://www.instagram.com/p/${shortcode}/embed/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Try og:image meta tag
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (ogMatch?.[1]) return ogMatch[1];

    // Try src in img tags
    const imgMatch = html.match(/<img[^>]+src="(https:\/\/[^"]+instagram[^"]+\.jpg[^"]*?)"/i);
    if (imgMatch?.[1]) return imgMatch[1];

    return null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ thumbnail_url: null }, { status: 400 });

  let thumbnail: string | null = null;

  if (url.includes('tiktok.com')) {
    thumbnail = await tryNoembed(url) || await tryTikTokOembed(url);
  } else if (url.includes('instagram.com')) {
    thumbnail = await tryInstagramScrape(url) || await tryNoembed(url);
  } else {
    thumbnail = await tryNoembed(url);
  }

  return NextResponse.json({ thumbnail_url: thumbnail });
}
