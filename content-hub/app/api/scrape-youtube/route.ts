import { NextResponse } from 'next/server';

const CHANNEL_URL = 'https://www.youtube.com/@organikaslt';

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

function extractInitialData(html: string): any {
  const patterns = [
    /var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});/,
    /ytInitialData\s*=\s*(\{[\s\S]*?\});\s*(?:var |window|<)/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try { return JSON.parse(match[1]); } catch { continue; }
    }
  }
  return null;
}

function parseCount(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, '').replace(/\s/g, '').replace(/views?/i, '');
  const match = clean.match(/^([\d.]+)([KkMmBb]?)$/);
  if (!match) return parseInt(clean) || 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === 'K') return Math.round(num * 1000);
  if (suffix === 'M') return Math.round(num * 1000000);
  if (suffix === 'B') return Math.round(num * 1000000000);
  return Math.round(num);
}

function extractVideos(data: any): any[] {
  const videos: any[] = [];
  const seen = new Set<string>();

  function walk(obj: any, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 25) return;
    
    const vr = obj.videoRenderer || obj.gridVideoRenderer ||
      obj.richItemRenderer?.content?.videoRenderer ||
      obj.compactVideoRenderer;
      
    if (vr?.videoId && !seen.has(vr.videoId)) {
      seen.add(vr.videoId);
      const thumbs = vr.thumbnail?.thumbnails || [];
      const bestThumb = thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || '';
      const viewText =
        vr.viewCountText?.simpleText ||
        vr.viewCountText?.runs?.map((r: any) => r.text).join('') ||
        vr.shortViewCountText?.simpleText || '';
      const title =
        vr.title?.runs?.[0]?.text ||
        vr.title?.simpleText || '';

      videos.push({
        id: vr.videoId,
        title,
        views: parseCount(viewText),
        viewText,
        publishedText: vr.publishedTimeText?.simpleText || '',
        thumbnail: bestThumb.split('?')[0],
        lengthText: vr.lengthText?.simpleText || '',
        url: `https://www.youtube.com/watch?v=${vr.videoId}`,
        platform: 'youtube',
        likes: 0,
        comments: 0,
      });
    }

    if (Array.isArray(obj)) {
      obj.forEach(i => walk(i, depth + 1));
    } else {
      Object.values(obj).forEach(v => walk(v, depth + 1));
    }
  }

  walk(data);
  return videos;
}

export async function GET() {
  try {
    const html = await fetchWithUA(`${CHANNEL_URL}/videos`);
    const data = extractInitialData(html);

    if (!data) {
      return NextResponse.json({ error: 'Could not parse YouTube page', videos: [], subscribers: '' });
    }

    const videos = extractVideos(data);

    // Extract subscriber count
    const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/) ||
      html.match(/subscribers":"([^"]+)"/);
    const subscribers = subMatch?.[1] || '';

    return NextResponse.json({
      videos,
      subscribers,
      channel: CHANNEL_URL,
      scrapedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videos: [], subscribers: '' });
  }
}
