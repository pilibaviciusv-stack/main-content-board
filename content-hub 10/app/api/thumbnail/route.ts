import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    // Try noembed first
    const noembedRes = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (noembedRes.ok) {
      const data = await noembedRes.json();
      if (data?.thumbnail_url) {
        return NextResponse.json({ thumbnail_url: data.thumbnail_url });
      }
    }

    // Fallback: TikTok oEmbed directly
    if (url.includes('tiktok.com')) {
      const ttRes = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
      );
      if (ttRes.ok) {
        const data = await ttRes.json();
        if (data?.thumbnail_url) {
          return NextResponse.json({ thumbnail_url: data.thumbnail_url });
        }
      }
    }

    return NextResponse.json({ thumbnail_url: null });
  } catch (err) {
    return NextResponse.json({ thumbnail_url: null });
  }
}
