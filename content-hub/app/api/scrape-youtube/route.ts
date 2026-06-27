import { NextResponse } from 'next/server';

const API_KEY = 'AIzaSyCvKYDqKXX-gF3NPBH3_YJmMs1Smdlt48Q';
const CHANNEL_HANDLE = 'DanasBytautas';

async function getChannelId(): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return data.items?.[0]?.id || '';
}

async function getChannelStats(channelId: string) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  const ch = data.items?.[0];
  return {
    title: ch?.snippet?.title || '',
    thumbnail: ch?.snippet?.thumbnails?.medium?.url || '',
    subscribers: parseInt(ch?.statistics?.subscriberCount || '0'),
    totalViews: parseInt(ch?.statistics?.viewCount || '0'),
    videoCount: parseInt(ch?.statistics?.videoCount || '0'),
    publishedAt: ch?.snippet?.publishedAt || '',
  };
}

async function getAllVideoIds(channelId: string): Promise<{id: string, title: string, thumbnail: string, publishedAt: string}[]> {
  const videos: any[] = [];
  let pageToken = '';

  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`,
    { cache: 'no-store' }
  );
  const chData = await chRes.json();
  const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    for (const item of data.items || []) {
      videos.push({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        publishedAt: item.contentDetails.videoPublishedAt || item.snippet.publishedAt,
      });
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return videos;
}

// Parse ISO 8601 duration to seconds: PT1M30S → 90
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  return h * 3600 + m * 60 + s;
}

async function getVideoStats(videoIds: string[]) {
  const stats: Record<string, any> = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${chunk.join(',')}&key=${API_KEY}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    for (const item of data.items || []) {
      const durationSec = parseDuration(item.contentDetails?.duration || '');
      stats[item.id] = {
        views: parseInt(item.statistics?.viewCount || '0'),
        likes: parseInt(item.statistics?.likeCount || '0'),
        comments: parseInt(item.statistics?.commentCount || '0'),
        durationSec,
        durationStr: item.contentDetails?.duration || '',
        isShort: durationSec > 0 && durationSec <= 60,
      };
    }
  }
  return stats;
}

export async function GET() {
  try {
    const channelId = await getChannelId();
    if (!channelId) return NextResponse.json({ error: 'Channel not found', videos: [] });

    const [channelStats, rawVideos] = await Promise.all([
      getChannelStats(channelId),
      getAllVideoIds(channelId),
    ]);

    const videoIds = rawVideos.map((v: any) => v.id);
    const statsMap = await getVideoStats(videoIds);

    const allVideos = rawVideos.map((v: any) => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      platform: 'youtube',
      views: statsMap[v.id]?.views || 0,
      likes: statsMap[v.id]?.likes || 0,
      comments: statsMap[v.id]?.comments || 0,
      durationSec: statsMap[v.id]?.durationSec || 0,
      isShort: statsMap[v.id]?.isShort || false,
    }));

    // Separate shorts and long-form
    const longForm = allVideos.filter((v: any) => !v.isShort);
    const shorts = allVideos.filter((v: any) => v.isShort);

    // Sort newest first
    longForm.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    shorts.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      channel: channelStats,
      videos: longForm,
      shorts,
      scrapedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videos: [], shorts: [] });
  }
}
