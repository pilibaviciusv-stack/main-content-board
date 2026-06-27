import { NextResponse } from 'next/server';

const CHANNEL_URL = 'https://www.youtube.com/@DanasBytautas';

async function fetchWithUA(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  });
  return res.text();
}

export async function GET() {
  try {
    const html = await fetchWithUA(`${CHANNEL_URL}/videos`);

    // Extract all unique video IDs from /watch?v= links
    const rawIds = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)].map(m => m[1]);
    const videoIds = [...new Set(rawIds)];

    if (videoIds.length === 0) {
      return NextResponse.json({ error: 'No videos found', videos: [], subscribers: '' });
    }

    // Fetch oEmbed for each video to get title + thumbnail (batch with Promise.all)
    const videos = await Promise.all(
      videoIds.map(async (id) => {
        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
          const res = await fetch(oembedUrl, { cache: 'no-store' });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id,
            title: data.title || '',
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${id}`,
            platform: 'youtube',
            views: 0,
            likes: 0,
            comments: 0,
            publishedText: '',
            viewText: '',
          };
        } catch {
          return null;
        }
      })
    );

    const validVideos = videos.filter(Boolean);

    // Extract subscriber count from page HTML
    const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/) ||
      html.match(/(\d[\d,.]+[KMB]?) subscribers/i);
    const subscribers = subMatch?.[1] || '';

    return NextResponse.json({
      videos: validVideos,
      subscribers,
      channel: CHANNEL_URL,
      scrapedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videos: [], subscribers: '' });
  }
}
