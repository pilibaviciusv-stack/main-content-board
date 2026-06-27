import { NextResponse } from 'next/server';

// Danas's social handles
const TIKTOK_HANDLE = '_moneydan'; // unused for now
const IG_HANDLE = '_moneydan';

async function fetchWithUA(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
    },
    cache: 'no-store',
  });
  return res.text();
}

function parseCount(str: string): number {
  if (!str) return 0;
  const clean = str.toString().replace(/,/g, '').replace(/\s/g, '');
  const match = clean.match(/^([\d.]+)([KkMmBb]?)$/);
  if (!match) return parseInt(clean) || 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === 'K') return Math.round(num * 1000);
  if (suffix === 'M') return Math.round(num * 1000000);
  if (suffix === 'B') return Math.round(num * 1000000000);
  return Math.round(num);
}

async function scrapeTikTok(): Promise<any[]> {
  try {
    const url = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
    const html = await fetchWithUA(url);

    // TikTok embeds __UNIVERSAL_DATA_FOR_REHYDRATION__ or SIGI_STATE
    const patterns = [
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(\{[\s\S]*?)\)<\/script>/,
      /window\['SIGI_STATE'\]\s*=\s*(\{[\s\S]*?\});\s*window\[/,
      /"ItemList":\{"user-post":\{"list":\[([^\]]+)\]/,
    ];

    let rawData: any = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try { rawData = JSON.parse(match[1]); break; } catch { continue; }
      }
    }

    const videos: any[] = [];

    if (rawData) {
      // Try to extract from various TikTok data structures
      const itemModule = rawData?.ItemModule || rawData?.itemList || 
        rawData?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
      
      // Walk looking for video items
      function findVideos(obj: any, depth = 0) {
        if (!obj || typeof obj !== 'object' || depth > 15) return;
        if (obj.id && obj.stats && obj.desc !== undefined) {
          const stats = obj.stats;
          videos.push({
            id: obj.id,
            title: obj.desc || '',
            views: stats.playCount || 0,
            likes: stats.diggCount || 0,
            comments: stats.commentCount || 0,
            shares: stats.shareCount || 0,
            thumbnail: obj.video?.cover || obj.video?.dynamicCover || '',
            publishedText: obj.createTime ? new Date(obj.createTime * 1000).toLocaleDateString() : '',
            url: `https://www.tiktok.com/@${TIKTOK_HANDLE}/video/${obj.id}`,
            platform: 'tiktok',
          });
        }
        if (Array.isArray(obj)) obj.forEach(i => findVideos(i, depth + 1));
        else Object.values(obj).forEach(v => findVideos(v, depth + 1));
      }
      findVideos(rawData);
    }

    // If parsing fails, try microlink as fallback for profile metadata
    if (videos.length === 0) {
      const mlRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&video=true`);
      if (mlRes.ok) {
        // microlink gives profile-level data, not video list — skip for now
      }
    }

    return videos;
  } catch {
    return [];
  }
}

async function scrapeInstagram(): Promise<any[]> {
  try {
    // Use microlink to get IG reels
    const profileUrl = `https://www.instagram.com/${IG_HANDLE}/reels/`;
    const mlRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(profileUrl)}&insights=true`);
    
    // Instagram is heavily protected — try the public profile API
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${IG_HANDLE}`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'X-IG-App-ID': '936619743392459',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges || [];
      return edges.map((e: any) => {
        const node = e.node;
        return {
          id: node.shortcode,
          title: node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 100) || '',
          views: node.video_view_count || node.edge_media_to_comment?.count || 0,
          likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
          comments: node.edge_media_to_comment?.count || 0,
          thumbnail: node.thumbnail_src || node.display_url || '',
          publishedText: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toLocaleDateString() : '',
          url: `https://www.instagram.com/p/${node.shortcode}/`,
          platform: 'instagram',
          isVideo: node.is_video,
        };
      }).filter((v: any) => v.isVideo);
    }

    return [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') || 'all';

  try {
    let tiktokVideos: any[] = [];
    let igVideos: any[] = [];

    if (platform === 'all' || platform === 'tiktok') {
      tiktokVideos = await scrapeTikTok();
    }
    if (platform === 'all' || platform === 'instagram') {
      igVideos = await scrapeInstagram();
    }

    return NextResponse.json({
      tiktok: tiktokVideos,
      instagram: igVideos,
      scrapedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tiktok: [], instagram: [] });
  }
}
