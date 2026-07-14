import { NextRequest, NextResponse } from 'next/server';

const YT_API_KEY = 'AIzaSyCvKYDqKXX-gF3NPBH3_YJmMs1Smdlt48Q';

function extractYoutubeHandle(url: string): string | null {
  const patterns = [
    /youtube\.com\/@([^/?&\s]+)/,
    /youtube\.com\/c\/([^/?&\s]+)/,
    /youtube\.com\/user\/([^/?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  if (url.startsWith('@')) return url.slice(1);
  return null;
}

function extractYoutubeChannelId(url: string): string | null {
  const m = url.match(/youtube\.com\/channel\/(UC[^/?&\s]+)/);
  return m ? m[1] : null;
}

function extractInstagramHandle(url: string): string | null {
  // Strip trailing slash, then grab the first path segment
  const clean = url.replace(/\/$/, '');
  const m = clean.match(/instagram\.com\/([^/?&\s]+)/);
  if (m && !['p', 'reel', 'reels', 'explore', 'accounts', 'stories'].includes(m[1])) return m[1];
  // Raw handle with no dots/slashes
  if (!url.includes('/') && !url.includes('.') && url.length > 1) return url;
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
    return thumb?.medium?.url || thumb?.high?.url || thumb?.default?.url || null;
  } catch {
    return null;
  }
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function unescapeIgUrl(raw: string): string {
  let clean = raw;
  for (let i = 0; i < 6; i++) clean = clean.replace(/\\\\/g, '\\');
  return clean.replace(/\\\//g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
}

function isRealIgPfp(u: string | null): u is string {
  // Reject the login-wall / generic logo assets
  if (!u) return false;
  if (u.includes('static.cdninstagram.com/rsrc')) return false;
  if (!/cdninstagram\.com|fbcdn\.net/.test(u)) return false;
  return true;
}

// Strategy 1: the public /embed/ page — intermittently exposes profile_pic_url
async function igFromEmbed(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${handle}/embed/`, {
      headers: { 'User-Agent': DESKTOP_UA, 'Accept-Language': 'en-US,en;q=0.9' },
    });
    const html = await res.text();
    const i = html.indexOf('profile_pic_url');
    if (i >= 0) {
      const seg = html.slice(i, i + 800);
      const m = seg.match(/(https.*?\.jpg[^"\\]*)/);
      if (m) {
        const u = unescapeIgUrl(m[1]);
        if (isRealIgPfp(u)) return u;
      }
    }
    // og:image fallback inside the same page
    const og = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (og) {
      const u = unescapeIgUrl(og[1]);
      if (isRealIgPfp(u)) return u;
    }
    return null;
  } catch {
    return null;
  }
}

// Strategy 2: the mobile web_profile_info endpoint (works when IG hasn't rate-limited us)
async function igFromWebProfile(handle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${handle}`,
      { headers: { 'x-ig-app-id': '936619743392459', 'User-Agent': DESKTOP_UA } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.data?.user;
    const u = user?.profile_pic_url_hd || user?.profile_pic_url || null;
    return isRealIgPfp(u) ? u : null;
  } catch {
    return null;
  }
}

async function fetchInstagramPfp(url: string): Promise<string | null> {
  const handle = extractInstagramHandle(url);
  if (!handle) return null;
  // Best-effort chain — first strategy that yields a real pfp wins
  return (await igFromEmbed(handle)) || (await igFromWebProfile(handle)) || null;
}

// Proxy an external image through this server to avoid CORS/referrer issues
async function proxyFetch(imageUrl: string): Promise<Response> {
  const isIg = /cdninstagram\.com|fbcdn\.net/.test(imageUrl);
  const upstream = await fetch(imageUrl, {
    headers: {
      'Referer': isIg ? 'https://www.instagram.com/' : 'https://www.youtube.com/',
      'User-Agent': 'Mozilla/5.0',
    },
  });
  const blob = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  return new Response(blob, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || '';
  const platform = req.nextUrl.searchParams.get('platform') || '';
  const proxy = req.nextUrl.searchParams.get('proxy') || ''; // ?proxy=<imageUrl>

  // Proxy mode: just stream the image
  if (proxy) {
    try {
      return await proxyFetch(proxy);
    } catch {
      return NextResponse.json({ error: 'proxy failed' }, { status: 502 });
    }
  }

  if (!url) return NextResponse.json({ pfp: null });

  let rawPfp: string | null = null;

  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    rawPfp = await fetchYoutubePfp(url);
  } else if (platform === 'instagram' || url.includes('instagram.com')) {
    rawPfp = await fetchInstagramPfp(url);
  }

  if (!rawPfp) return NextResponse.json({ pfp: null });

  // Return a proxied URL so the browser loads it from our domain
  const proxied = `/api/fetch-pfp?proxy=${encodeURIComponent(rawPfp)}`;
  return NextResponse.json({ pfp: proxied });
}
