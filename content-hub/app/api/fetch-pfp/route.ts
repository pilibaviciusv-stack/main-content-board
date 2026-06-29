import { NextRequest, NextResponse } from 'next/server';

const YT_API_KEY = 'AIzaSyCvKYDqKXX-gF3NPBH3_YJmMs1Smdlt48Q';

function extractYoutubeHandle(url: string): string | null {
  // Handles: @handle, /c/name, /user/name, /@handle, channel/ID
  const patterns = [
    /youtube\.com\/@([^/?&]+)/,
    /youtube\.com\/c\/([^/?&]+)/,
    /youtube\.com\/user\/([^/?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Raw handle input like "@someone"
  if (url.startsWith('@')) return url.slice(1);
  return null;
}

function extractYoutubeChannelId(url: string): string | null {
  const m = url.match(/youtube\.com\/channel\/(UC[^/?&]+)/);
  return m ? m[1] : null;
}

function extractInstagramHandle(url: string): string | null {
  const m = url.match(/instagram\.com\/([^/?&]+)/);
  if (m && !['p', 'reel', 'explore', 'accounts'].includes(m[1])) return m[1];
  if (!url.includes('/') && !url.includes('.')) return url; // raw handle
  return null;
}

async function fetchYoutubePfp(url: string): Promise<string | null> {
  try {
    const handle = extractYoutubeHandle(url);
    const channelId = extractYoutubeChannelId(url);

    let apiUrl: string;
    if (handle) {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(handle)}&key=${YT_API_KEY}`;
    } else if (channelId) {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YT_API_KEY}`;
    } else {
      return null;
    }

    const res = await fetch(apiUrl);
    const data = await res.json();
    const thumb = data.items?.[0]?.snippet?.thumbnails;
    // Prefer medium (240px) > high > default
    return thumb?.medium?.url || thumb?.high?.url || thumb?.default?.url || null;
  } catch {
    return null;
  }
}

async function fetchInstagramPfp(url: string): Promise<string | null> {
  try {
    const handle = extractInstagramHandle(url);
    if (!handle) return null;
    const profileUrl = `https://www.instagram.com/${handle}/`;
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(profileUrl)}&screenshot=false`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();
    return data?.data?.logo?.url || data?.data?.image?.url || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || '';
  const platform = req.nextUrl.searchParams.get('platform') || '';

  if (!url) return NextResponse.json({ pfp: null });

  let pfp: string | null = null;

  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    pfp = await fetchYoutubePfp(url);
  } else if (platform === 'instagram' || url.includes('instagram.com')) {
    pfp = await fetchInstagramPfp(url);
  }

  return NextResponse.json({ pfp });
}
