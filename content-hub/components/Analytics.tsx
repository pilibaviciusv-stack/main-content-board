'use client';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Youtube, AlertTriangle, Eye, ThumbsUp, MessageCircle, Star, ChevronDown, ChevronUp, ExternalLink, Zap } from 'lucide-react';
import { ContentCard } from '@/lib/types';

interface VideoStat {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  thumbnail: string;
  publishedText: string;
  url: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  lengthText?: string;
  viewText?: string;
  funnelType?: 'TOF' | 'MOF' | 'BOF' | null;
}

interface Props {
  cards: ContentCard[];
}

type Platform = 'youtube' | 'shortform';
type SortKey = 'views' | 'likes' | 'comments' | 'published';

function fmt(n: number): string {
  if (!n || isNaN(n)) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function OutlierBadge({ ratio, label }: { ratio: number; label: string }) {
  if (ratio >= 2) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#14532d', color: '#4ade80', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
      <Zap size={9} /> {label} OUTLIER +{Math.round((ratio - 1) * 100)}%
    </div>
  );
  if (ratio <= 0.4) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#450a0a', color: '#f87171', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
      <TrendingDown size={9} /> UNDERPERFORMING
    </div>
  );
  return null;
}

function EngagementBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 3, background: '#1e2130', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function VideoCard({
  video,
  rank,
  avgViews,
  maxViews,
  maxLikes,
  maxComments,
}: {
  video: VideoStat;
  rank: number;
  avgViews: number;
  maxViews: number;
  maxLikes: number;
  maxComments: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const ratio = avgViews > 0 ? video.views / avgViews : 1;
  const funnelColor = video.funnelType === 'TOF' ? '#6366f1' : video.funnelType === 'MOF' ? '#f59e0b' : video.funnelType === 'BOF' ? '#10b981' : '#475569';
  const platformColor = video.platform === 'youtube' ? '#ef4444' : video.platform === 'tiktok' ? '#e879f9' : '#f97316';
  const platformLabel = video.platform === 'youtube' ? 'YT' : video.platform === 'tiktok' ? 'TT' : 'IG';

  return (
    <div
      style={{
        background: '#0d0f14',
        border: `1px solid ${ratio >= 2 ? '#166534' : ratio <= 0.4 ? '#7f1d1d' : '#1e2130'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: video.platform === 'youtube' ? '16/9' : '9/16', maxHeight: video.platform === 'youtube' ? 'none' : 220, overflow: 'hidden', background: '#13151e' }}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            <Eye size={24} color="#1e2130" />
          </div>
        )}

        {/* Rank badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: rank <= 3 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#0d0f14cc',
          color: rank <= 3 ? '#000' : '#94a3b8',
          borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800,
          backdropFilter: 'blur(4px)',
        }}>#{rank}</div>

        {/* Platform badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: platformColor + '22',
          color: platformColor,
          border: `1px solid ${platformColor}44`,
          borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700,
          backdropFilter: 'blur(4px)',
        }}>{platformLabel}</div>

        {/* Funnel type */}
        {video.funnelType && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: funnelColor + '22',
            color: funnelColor,
            border: `1px solid ${funnelColor}44`,
            borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}>{video.funnelType}</div>
        )}

        {/* View count overlay */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: '#0d0f14cc', color: '#e2e8f0',
          borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Eye size={10} />{fmt(video.views)}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {video.title || '(No title)'}
        </p>

        {/* Outlier badge */}
        <div style={{ marginBottom: 8 }}>
          <OutlierBadge ratio={ratio} label={video.funnelType || ''} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#94a3b8' }}>
            <Eye size={10} color="#6366f1" />{fmt(video.views)}
          </div>
          {video.likes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#94a3b8' }}>
              <ThumbsUp size={10} color="#ec4899" />{fmt(video.likes)}
            </div>
          )}
          {video.comments > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#94a3b8' }}>
              <MessageCircle size={10} color="#f59e0b" />{fmt(video.comments)}
            </div>
          )}
        </div>

        {/* Engagement bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#475569', width: 14 }}>V</span>
            <EngagementBar value={video.views} max={maxViews} color="#6366f1" />
          </div>
          {maxLikes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: '#475569', width: 14 }}>L</span>
              <EngagementBar value={video.likes} max={maxLikes} color="#ec4899" />
            </div>
          )}
        </div>

        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e2130' }}>
            {video.publishedText && (
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>📅 {video.publishedText}</div>
            )}
            {video.lengthText && (
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>⏱ {video.lengthText}</div>
            )}
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
              📊 {Math.round((ratio - 1) * 100) >= 0 ? '+' : ''}{Math.round((ratio - 1) * 100)}% vs avg ({fmt(Math.round(avgViews))} avg views)
            </div>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
            >
              <ExternalLink size={10} /> Open video
            </a>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
          {expanded ? <ChevronUp size={12} color="#334155" /> : <ChevronDown size={12} color="#334155" />}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#0d0f14', border: '1px solid #1e2130', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function FunnelRow({ label, videos, color }: { label: string; videos: VideoStat[]; color: string }) {
  if (!videos.length) return null;
  const avgV = Math.round(avg(videos.map(v => v.views)));
  const maxV = Math.max(...videos.map(v => v.views));
  const outliers = videos.filter(v => avgV > 0 && v.views / avgV >= 2).length;
  const underperforming = videos.filter(v => avgV > 0 && v.views / avgV <= 0.4).length;

  return (
    <div style={{ background: '#0d0f14', border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{label}</span>
          <span style={{ fontSize: 11, color: '#475569' }}>{videos.length} videos</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {outliers > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: '#14532d', padding: '2px 8px', borderRadius: 99 }}>
              ⚡ {outliers} outlier{outliers > 1 ? 's' : ''}
            </span>
          )}
          {underperforming > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: '#450a0a', padding: '2px 8px', borderRadius: 99 }}>
              ↓ {underperforming} under
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: '#475569' }}>Avg views</div>
          <div style={{ fontSize: 18, fontWeight: 800, color }}>{fmt(avgV)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#475569' }}>Best</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0' }}>{fmt(maxV)}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <MiniSparkline
            values={videos.sort((a, b) => a.publishedText.localeCompare(b.publishedText)).map(v => v.views)}
            color={color}
          />
        </div>
      </div>
    </div>
  );
}

export default function Analytics({ cards }: Props) {
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [videos, setVideos] = useState<VideoStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('views');
  const [lastScraped, setLastScraped] = useState('');
  const [filterFunnel, setFilterFunnel] = useState<'ALL' | 'TOF' | 'MOF' | 'BOF' | 'UNKNOWN'>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'instagram'>('all');

  // Match videos to pipeline cards by URL or title to get funnel type
  const enrichWithFunnelType = useCallback((vids: VideoStat[]): VideoStat[] => {
    return vids.map(v => {
      // Try to match with cards by videoLink or title similarity
      const matchedCard = cards.find(c => {
        if (c.videoLink && v.url) {
          const cvid = c.videoLink.toLowerCase();
          const vvid = v.url.toLowerCase();
          // Match by video ID in URL
          if (v.id && cvid.includes(v.id)) return true;
          if (cvid === vvid) return true;
        }
        // Fuzzy title match
        if (c.title && v.title) {
          const ct = c.title.toLowerCase().trim();
          const vt = v.title.toLowerCase().trim();
          if (ct.length > 5 && (vt.includes(ct) || ct.includes(vt.slice(0, 20)))) return true;
        }
        return false;
      });

      let funnelType: 'TOF' | 'MOF' | 'BOF' | null = null;
      if (matchedCard?.type === 'Top of Funnel') funnelType = 'TOF';
      else if (matchedCard?.type === 'Middle of Funnel') funnelType = 'MOF';
      else if (matchedCard?.type === 'Bottom of Funnel') funnelType = 'BOF';

      return { ...v, funnelType };
    });
  }, [cards]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setVideos([]);
    try {
      if (platform === 'youtube') {
        const res = await fetch('/api/scrape-youtube');
        const data = await res.json();
        if (data.error && !data.videos?.length) {
          setError(data.error);
        } else {
          setVideos(enrichWithFunnelType(data.videos || []));
          setLastScraped(data.scrapedAt || '');
        }
      } else {
        const res = await fetch('/api/scrape-shortform?platform=instagram');
        const data = await res.json();
        if (data.error && !data.instagram?.length) {
          setError(data.error);
        } else {
          const all = [
            ...(data.instagram || []),
          ];
          setVideos(enrichWithFunnelType(all));
          setLastScraped(data.scrapedAt || '');
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [platform, enrichWithFunnelType]);

  useEffect(() => {
    loadData();
  }, [platform]);

  // Filtered + sorted videos
  const filteredVideos = videos.filter(v => {
    if (filterFunnel !== 'ALL') {
      if (filterFunnel === 'UNKNOWN' && v.funnelType) return false;
      if (filterFunnel !== 'UNKNOWN' && v.funnelType !== filterFunnel) return false;
    }
    if (platform === 'shortform' && filterPlatform !== 'all' && v.platform !== filterPlatform) return false;
    return true;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sort === 'views') return b.views - a.views;
    if (sort === 'likes') return b.likes - a.likes;
    if (sort === 'comments') return b.comments - a.comments;
    return 0;
  });

  // Stats
  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgViews = Math.round(avg(videos.map(v => v.views)));
  const maxViews = Math.max(...videos.map(v => v.views), 0);
  const maxLikes = Math.max(...videos.map(v => v.likes), 0);
  const maxComments = Math.max(...videos.map(v => v.comments), 0);

  const tofVideos = videos.filter(v => v.funnelType === 'TOF');
  const mofVideos = videos.filter(v => v.funnelType === 'MOF');
  const bofVideos = videos.filter(v => v.funnelType === 'BOF');
  const unknownVideos = videos.filter(v => !v.funnelType);

  const outlierCount = videos.filter(v => avgViews > 0 && v.views / avgViews >= 2).length;

  const chipStyle = (active: boolean, color: string) => ({
    padding: '5px 12px', borderRadius: 20,
    background: active ? color + '22' : 'transparent',
    color: active ? color : '#475569',
    border: `1px solid ${active ? color + '55' : '#1e2130'}`,
    cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ color: '#e2e8f0' }}>
      {/* Platform switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setPlatform('youtube')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: platform === 'youtube' ? '#ef444422' : '#13151e',
            color: platform === 'youtube' ? '#ef4444' : '#64748b',
            border: `1.5px solid ${platform === 'youtube' ? '#ef444455' : '#1e2130'}`,
            cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
          }}
        >
          <Youtube size={16} /> YouTube
        </button>
        <button
          onClick={() => setPlatform('shortform')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: platform === 'shortform' ? '#e879f922' : '#13151e',
            color: platform === 'shortform' ? '#e879f9' : '#64748b',
            border: `1.5px solid ${platform === 'shortform' ? '#e879f955' : '#1e2130'}`,
            cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 14 }}>📱</span> Shortform
        </button>

        <div style={{ flex: 1 }} />

        {lastScraped && (
          <span style={{ fontSize: 11, color: '#334155' }}>
            Scraped {new Date(lastScraped).toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: '#13151e', border: '1px solid #1e2130',
            color: '#64748b', cursor: loading ? 'default' : 'pointer', fontSize: 12,
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Scraping...' : 'Refresh'}
        </button>
      </div>

      {/* Shortform sub-filter */}
      {platform === 'shortform' && !loading && videos.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {((['all', 'instagram'] as const)).map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)} style={chipStyle(filterPlatform === p, p === 'instagram' ? '#f97316' : '#6366f1')}>
              {p === 'all' ? 'All' : '📸 Instagram'}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1e2130', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 13, color: '#475569' }}>Scraping {platform === 'youtube' ? 'YouTube channel' : 'Instagram'}...</div>
          <div style={{ fontSize: 11, color: '#334155' }}>This may take a few seconds</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={16} color="#f87171" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Scraping failed</div>
            <div style={{ fontSize: 11, color: '#fca5a5' }}>{error}</div>
            <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>
              {platform === 'shortform'
                ? 'Instagram blocks automated scraping. Try adding videos manually via pipeline cards with video links.'
                : 'YouTube may have updated their page structure. Check the channel URL or try again.'}
            </div>
          </div>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatBadge label="Total videos" value={videos.length.toString()} color="#e2e8f0" />
            <StatBadge label="Total views" value={fmt(totalViews)} color="#6366f1" />
            <StatBadge label="Avg views" value={fmt(avgViews)} color="#94a3b8" sub="per video" />
            <StatBadge label="Best video" value={fmt(maxViews)} color="#f59e0b" sub="views" />
            <StatBadge label="Outliers" value={outlierCount.toString()} color="#4ade80" sub="2x+ above avg" />
          </div>

          {/* Funnel breakdown (only if matched cards exist) */}
          {(tofVideos.length + mofVideos.length + bofVideos.length) > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Funnel Performance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {tofVideos.length > 0 && <FunnelRow label="Top of Funnel" videos={tofVideos} color="#6366f1" />}
                {mofVideos.length > 0 && <FunnelRow label="Middle of Funnel" videos={mofVideos} color="#f59e0b" />}
                {bofVideos.length > 0 && <FunnelRow label="Bottom of Funnel" videos={bofVideos} color="#10b981" />}
              </div>
              {unknownVideos.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#334155' }}>
                  + {unknownVideos.length} unmatched videos (not in pipeline cards)
                </div>
              )}
            </div>
          )}

          {/* Filters + sort */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: '#475569', marginRight: 4 }}>Filter:</div>
            {(['ALL', 'TOF', 'MOF', 'BOF', 'UNKNOWN'] as const).map(f => (
              <button key={f} onClick={() => setFilterFunnel(f)} style={chipStyle(filterFunnel === f, f === 'TOF' ? '#6366f1' : f === 'MOF' ? '#f59e0b' : f === 'BOF' ? '#10b981' : '#64748b')}>
                {f === 'ALL' ? 'All' : f === 'UNKNOWN' ? 'Unmatched' : f}
                {f === 'ALL' ? ` (${videos.length})` : f === 'TOF' ? ` (${tofVideos.length})` : f === 'MOF' ? ` (${mofVideos.length})` : f === 'BOF' ? ` (${bofVideos.length})` : ` (${unknownVideos.length})`}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            <div style={{ fontSize: 11, color: '#475569' }}>Sort:</div>
            {(['views', 'likes', 'comments'] as SortKey[]).map(s => (
              <button key={s} onClick={() => setSort(s)} style={chipStyle(sort === s, '#6366f1')}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Video grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: platform === 'youtube'
              ? 'repeat(auto-fill, minmax(280px, 1fr))'
              : 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
          }}>
            {sortedVideos.map((v, i) => (
              <VideoCard
                key={v.id}
                video={v}
                rank={i + 1}
                avgViews={avgViews}
                maxViews={maxViews}
                maxLikes={maxLikes}
                maxComments={maxComments}
              />
            ))}
          </div>

          {sortedVideos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155', fontSize: 13 }}>
              No videos match this filter.
            </div>
          )}
        </>
      )}

      {!loading && !error && videos.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
          <Eye size={32} color="#1e2130" />
          <div style={{ fontSize: 14, color: '#334155' }}>No videos loaded yet</div>
          <button onClick={loadData} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Load videos
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
