import { NextResponse } from 'next/server';

const API_KEY = 'AIzaSyCvKYDqKXX-gF3NPBH3_YJmMs1Smdlt48Q';
const CHANNEL_HANDLE = 'DanasBytautas';

async function getChannelId(): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id,statistics,snippet&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return data.items?.[0]?.id || '';
}

async function getChannelStats(channelId: string) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${API_KEY}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  const ch = data.items?.[0];
  return {
    title: ch?.snippet?.title || '',
    description: ch?.snippet?.description || '',
    thumbnail: ch?.snippet?.thumbnails?.medium?.url || '',
    subscribers: parseInt(ch?.statistics?.subscriberCount || '0'),
    totalViews: parseInt(ch?.statistics?.viewCount || '0'),
    videoCount: parseInt(ch?.statistics?.videoCount || '0'),
    publishedAt: ch?.snippet?.publishedAt || '',
  };
}

async function getAllVideos(channelId: string) {
  const videos: any[] = [];
  let pageToken = '';

  // Get upload playlist ID
  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`,
    { cache: 'no-store' }
  );
  const chData = await chRes.json();
  const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Paginate through all videos in uploads playlist
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    const items = data.items || [];
    videos.push(...items.map((item: any) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.contentDetails.videoPublishedAt || item.snippet.publishedAt,
    })));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return videos;
}

async function getVideoStats(videoIds: string[]) {
  const stats: Record<string, any> = {};
  // Batch in chunks of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${chunk.join(',')}&key=${API_KEY}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    for (const item of data.items || []) {
      stats[item.id] = {
        views: parseInt(item.statistics?.viewCount || '0'),
        likes: parseInt(item.statistics?.likeCount || '0'),
        comments: parseInt(item.statistics?.commentCount || '0'),
        duration: item.contentDetails?.duration || '',
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
      getAllVideos(channelId),
    ]);

    const videoIds = rawVideos.map((v: any) => v.id);
    const statsMap = await getVideoStats(videoIds);

    const videos = rawVideos.map((v: any) => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      platform: 'youtube',
      views: statsMap[v.id]?.views || 0,
      likes: statsMap[v.id]?.likes || 0,
      comments: statsMap[v.id]?.comments || 0,
      duration: statsMap[v.id]?.duration || '',
    }));

    // Sort newest first
    videos.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      channel: channelStats,
      videos,
      scrapedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videos: [] });
  }
}
