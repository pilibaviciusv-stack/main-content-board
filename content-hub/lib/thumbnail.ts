/**
 * Fetch thumbnail via our own Next.js API route (server-side proxy)
 * Avoids CORS issues when calling noembed/TikTok oEmbed from the browser
 */
export async function fetchVideoThumbnail(videoUrl: string): Promise<string | null> {
  if (!videoUrl) return null;
  try {
    const res = await fetch(
      `/api/thumbnail?url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch {
    return null;
  }
}

export function isVideoLink(url: string): boolean {
  return (
    url.includes('tiktok.com') ||
    url.includes('instagram.com') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be')
  );
}
