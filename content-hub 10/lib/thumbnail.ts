/**
 * Auto-fetch thumbnail from TikTok or Instagram video URL
 * Uses noembed.com (free, no auth needed) as a proxy for oEmbed
 */
export async function fetchVideoThumbnail(videoUrl: string): Promise<string | null> {
  if (!videoUrl) return null;
  try {
    const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch {
    return null;
  }
}

export function isVideoLink(url: string): boolean {
  return url.includes('tiktok.com') || url.includes('instagram.com') || url.includes('youtube.com') || url.includes('youtu.be');
}
