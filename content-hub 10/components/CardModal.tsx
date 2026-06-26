'use client';
import { useState, useRef, useCallback } from 'react';
import { X, ExternalLink, Trash2, Copy, Upload, Image, CheckCircle2, Loader2 } from 'lucide-react';
import { ContentCard, CardType, Pipeline } from '@/lib/types';
import { fetchVideoThumbnail, isVideoLink } from '@/lib/thumbnail';

interface Props {
  card: ContentCard;
  users: string[];
  pipeline?: Pipeline;
  onSave: (card: ContentCard) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CARD_TYPES: CardType[] = ['Top of Funnel', 'Middle of Funnel', 'Bottom of Funnel'];

const inputBase: React.CSSProperties = {
  width: '100%', background: '#1a1d26', border: '1px solid #2d3148',
  borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.08em',
};
const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };

export default function CardModal({ card, users, pipeline, onSave, onDelete, onClose }: Props) {
  const [data, setData] = useState<ContentCard>({ ...card });
  const [fetchingThumb, setFetchingThumb] = useState(false);
  const [thumbFetchFailed, setThumbFetchFailed] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const formatRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLInputElement>(null);
  const rawFileRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const videoLinkRef = useRef<HTMLInputElement>(null);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const hookRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tryFetchThumbnail = useCallback(async (url: string) => {
    if (!url || !isVideoLink(url)) return;
    setFetchingThumb(true);
    setThumbFetchFailed(false);
    const thumbUrl = await fetchVideoThumbnail(url);
    setFetchingThumb(false);
    if (thumbUrl) {
      setData(prev => ({ ...prev, thumbnail: thumbUrl, videoLink: url }));
    } else {
      setThumbFetchFailed(true);
      setData(prev => ({ ...prev, videoLink: url }));
    }
  }, []);

  const handleVideoLinkBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    if (!url || url === data.videoLink) return;
    setData(prev => ({ ...prev, videoLink: url }));
    if (!data.thumbnail) {
      // Only auto-fetch if no thumbnail yet
      await tryFetchThumbnail(url);
    } else {
      setData(prev => ({ ...prev, videoLink: url }));
    }
  };

  const handleVideoLinkPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const url = e.clipboardData.getData('text').trim();
    if (!url || !isVideoLink(url)) return;
    // Small delay to let the input value update
    setTimeout(async () => {
      if (!data.thumbnail) {
        await tryFetchThumbnail(url);
      }
    }, 100);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData(prev => ({ ...prev, thumbnail: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated: ContentCard = {
      ...data,
      title: titleRef.current?.value ?? data.title,
      format: formatRef.current?.value ?? data.format,
      cost: costRef.current?.value ?? data.cost,
      headline: headlineRef.current?.value ?? data.headline,
      rawFileLink: rawFileRef.current?.value ?? data.rawFileLink,
      referenceLink: referenceRef.current?.value ?? data.referenceLink,
      frameLink: frameRef.current?.value ?? data.frameLink,
      musicLink: musicRef.current?.value ?? data.musicLink,
      videoLink: videoLinkRef.current?.value ?? data.videoLink,
      idea: ideaRef.current?.value ?? data.idea,
      hook: hookRef.current?.value ?? data.hook,
      body: bodyRef.current?.value ?? data.body,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  const handleApprove = () => {
    if (!pipeline) return;
    const approvedStage = pipeline.stages.find(s => s.name.toLowerCase().includes('approved'));
    if (approvedStage && data.stageId !== approvedStage.id) {
      setData(prev => ({ ...prev, stageId: approvedStage.id }));
    }
  };

  const currentStage = pipeline?.stages.find(s => s.id === data.stageId);
  const isApproved = currentStage?.name.toLowerCase().includes('approved') ||
    currentStage?.name.toLowerCase().includes('green') ||
    currentStage?.name.toLowerCase().includes('posted');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#13151e', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', border: '1px solid #2d3148', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input ref={titleRef} defaultValue={data.title} placeholder="Card title..."
            style={{ ...inputBase, background: 'none', border: 'none', fontSize: 18, fontWeight: 700, padding: 0, flex: 1 }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions Bar */}
        {pipeline && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Stage</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {pipeline.stages.map(stage => (
                <button key={stage.id} onClick={() => setData(prev => ({ ...prev, stageId: stage.id }))}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${data.stageId === stage.id ? stage.color : '#2d3148'}`,
                    background: data.stageId === stage.id ? `${stage.color}22` : 'transparent',
                    color: data.stageId === stage.id ? stage.color : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{stage.name}</button>
              ))}
            </div>
            {!isApproved ? (
              <button onClick={handleApprove}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#15803d22', border: '1px solid #16a34a', color: '#22c55e', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={14} /> Approve Idea
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Approved
              </div>
            )}
          </div>
        )}

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Video Link — FIRST so thumbnail auto-fetches before showing image area */}
          <div style={row}>
            <label style={labelStyle}>
              Posted Video Link (TikTok / Instagram)
              {fetchingThumb && (
                <span style={{ marginLeft: 8, color: '#6366f1', fontSize: 10, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> fetching thumbnail...
                </span>
              )}
              {thumbFetchFailed && !fetchingThumb && (
                <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: 10, fontWeight: 500 }}>
                  couldn't auto-fetch — upload manually below
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={videoLinkRef}
                defaultValue={data.videoLink || ''}
                placeholder="Paste TikTok or Instagram link — thumbnail loads automatically"
                style={{ ...inputBase, paddingRight: 36 }}
                onBlur={handleVideoLinkBlur}
                onPaste={handleVideoLinkPaste}
              />
              {data.videoLink && (
                <a href={data.videoLink} target="_blank" rel="noopener noreferrer"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            {data.videoLink && data.thumbnail && (
              <button
                onClick={async () => {
                  const url = videoLinkRef.current?.value || data.videoLink;
                  if (url) await tryFetchThumbnail(url);
                }}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                ↺ Re-fetch thumbnail
              </button>
            )}
          </div>

          {/* Thumbnail */}
          <div style={row}>
            <label style={labelStyle}>Thumbnail</label>
            <div
              onClick={() => !fetchingThumb && fileInputRef.current?.click()}
              style={{
                width: '100%', height: 200, borderRadius: 10, border: `1px dashed ${fetchingThumb ? '#6366f1' : '#2d3148'}`,
                background: '#1a1d26', cursor: fetchingThumb ? 'wait' : 'pointer', overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => !fetchingThumb && (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = fetchingThumb ? '#6366f1' : '#2d3148')}
            >
              {fetchingThumb ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#6366f1' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #6366f133', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Fetching thumbnail from video...</span>
                </div>
              ) : data.thumbnail ? (
                <>
                  <img src={data.thumbnail} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={14} /> Replace
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#475569' }}>
                  <Image size={28} />
                  <span style={{ fontSize: 13 }}>Paste a video link above to auto-load</span>
                  <span style={{ fontSize: 11, color: '#334155' }}>or click here to upload manually</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} style={{ display: 'none' }} />
            {data.thumbnail && !fetchingThumb && (
              <button onClick={() => setData(prev => ({ ...prev, thumbnail: '' }))}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Remove thumbnail
              </button>
            )}
          </div>

          {/* Type + Editor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={row}>
              <label style={labelStyle}>Type</label>
              <select value={data.type} onChange={e => setData(prev => ({ ...prev, type: e.target.value as CardType }))} style={inputBase}>
                {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={row}>
              <label style={labelStyle}>Editor</label>
              <select value={data.editor} onChange={e => setData(prev => ({ ...prev, editor: e.target.value }))} style={inputBase}>
                <option value="">Select editor...</option>
                {users.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Format + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={row}>
              <label style={labelStyle}>Format</label>
              <input ref={formatRef} defaultValue={data.format} placeholder="talking head, screen share..." style={inputBase} />
            </div>
            <div style={row}>
              <label style={labelStyle}>Scheduled Post Date</label>
              <input type="date" value={data.scheduledDate}
                onChange={e => setData(prev => ({ ...prev, scheduledDate: e.target.value }))} style={inputBase} />
            </div>
          </div>

          {/* Cost + Headline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={row}>
              <label style={labelStyle}>Cost ($)</label>
              <input ref={costRef} type="number" defaultValue={data.cost} placeholder="0" style={inputBase} />
            </div>
            <div style={row}>
              <label style={labelStyle}>Headline</label>
              <input ref={headlineRef} defaultValue={data.headline} placeholder="Video headline..." style={inputBase} />
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {([
              { label: 'Raw File Link', ref: rawFileRef, val: data.rawFileLink },
              { label: 'Reference Link', ref: referenceRef, val: data.referenceLink },
              { label: 'Frame.io Link', ref: frameRef, val: data.frameLink },
            ] as const).map(({ label, ref, val }) => (
              <div key={label} style={row}>
                <label style={labelStyle}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input ref={ref} defaultValue={val} placeholder="Link..." style={{ ...inputBase, paddingRight: 32 }} />
                  {val && <a href={val} target="_blank" rel="noopener noreferrer"
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>
                    <ExternalLink size={13} />
                  </a>}
                </div>
              </div>
            ))}
          </div>

          <div style={row}>
            <label style={labelStyle}>Music Link</label>
            <input ref={musicRef} defaultValue={data.musicLink} placeholder="Paste music link — pull from Music Bank" style={inputBase} />
          </div>

          <div style={row}>
            <label style={labelStyle}>Idea</label>
            <textarea ref={ideaRef} defaultValue={data.idea} placeholder="The initial idea / concept..." rows={3} style={{ ...inputBase, resize: 'vertical' }} />
          </div>

          <div style={row}>
            <label style={labelStyle}>Hook</label>
            <textarea ref={hookRef} defaultValue={data.hook} placeholder="Opening hook..." rows={3} style={{ ...inputBase, resize: 'vertical' }} />
          </div>

          <div style={row}>
            <label style={labelStyle}>Body</label>
            <textarea ref={bodyRef} defaultValue={data.body} placeholder="Content body / talking points..." rows={3} style={{ ...inputBase, resize: 'vertical' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onDelete(card.id); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2d1515', border: '1px solid #5c1f1f', color: '#f87171', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
              <Copy size={14} /> Copy link
            </button>
          </div>
          <button onClick={handleSave}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Save
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
