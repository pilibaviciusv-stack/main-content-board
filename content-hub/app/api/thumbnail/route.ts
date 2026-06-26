import { NextRequest, NextResponse } from 'next/server';

// microlink.io - free, no auth, works for Instagram og:image
async function tryMicrolink(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.image?.url || null;
  } catch { return null; }
}

// TikTok's official oEmbed — works server-side from datacenter IPs
async function tryTikTokOembed(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch { return null; }
}

// noembed as last resort
async function tryNoembed(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ thumbnail_url: null }, { status: 400 });

  let thumbnail: string | null = null;

  if (url.includes('tiktok.com')) {
    // TikTok: try oEmbed first (works server-side), then microlink
    thumbnail = await tryTikTokOembed(url) || await tryMicrolink(url);
  } else if (url.includes('instagram.com')) {
    // Instagram: microlink is the only reliable option (oembed requires Meta token)
    thumbnail = await tryMicrolink(url) || await tryNoembed(url);
  } else {
    thumbnail = await tryNoembed(url) || await tryMicrolink(url);
  }

  return NextResponse.json({ thumbnail_url: thumbnail });
}
