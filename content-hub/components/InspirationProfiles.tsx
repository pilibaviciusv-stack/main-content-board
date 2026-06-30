'use client';
import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, PlaySquare, Camera, Loader2, RefreshCw } from 'lucide-react';

export interface CreatorProfile {
  id: string;
  name: string;
  youtubeUrl: string;
  youtubePfp: string;
  youtubeHandle: string;
  instagramUrl: string;
  instagramPfp: string;
  instagramHandle: string;
  notes: string;
  tags: string;
}

interface Props {
  profiles: CreatorProfile[];
  onChange: (profiles: CreatorProfile[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function Avatar({ url, name, size = 48 }: { url: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  // Reset error when url changes
  useEffect(() => { setErr(false); }, [url]);
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#ec4899'];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (!url || err) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {initials || '?'}
      </div>
    );
  }
  return <img src={url} alt={name} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
}

async function fetchPfp(url: string, platform: 'youtube' | 'instagram'): Promise<string | null> {
  if (!url.trim()) return null;
  try {
    const res = await fetch(`/api/fetch-pfp?url=${encodeURIComponent(url)}&platform=${platform}`);
    const data = await res.json();
    return data.pfp || null;
  } catch {
    return null;
  }
}

function ProfileCard({ profile, onDelete, onUpdate }: {
  profile: CreatorProfile;
  onDelete: () => void;
  onUpdate: (p: CreatorProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [fetchingYt, setFetchingYt] = useState(false);
  const [fetchingIg, setFetchingIg] = useState(false);

  // When opening edit, auto-fetch pfps if URLs exist but pfps are missing/stale
  useEffect(() => {
    if (!editing) return;
    setDraft(profile); // reset draft to latest saved

    const refetch = async () => {
      let updated = { ...profile };
      let changed = false;

      if (profile.youtubeUrl) {
        setFetchingYt(true);
        const pfp = await fetchPfp(profile.youtubeUrl, 'youtube');
        if (pfp) { updated = { ...updated, youtubePfp: pfp }; changed = true; }
        setFetchingYt(false);
      }
      if (profile.instagramUrl) {
        setFetchingIg(true);
        const pfp = await fetchPfp(profile.instagramUrl, 'instagram');
        if (pfp) { updated = { ...updated, instagramPfp: pfp }; changed = true; }
        setFetchingIg(false);
      }
      if (changed) setDraft(updated);
    };

    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const handleUrlBlur = useCallback(async (url: string, platform: 'youtube' | 'instagram') => {
    if (!url.trim()) return;
    if (platform === 'youtube') setFetchingYt(true);
    else setFetchingIg(true);
    const pfp = await fetchPfp(url, platform);
    if (pfp) {
      setDraft(p => platform === 'youtube' ? { ...p, youtubePfp: pfp } : { ...p, instagramPfp: pfp });
    }
    if (platform === 'youtube') setFetchingYt(false);
    else setFetchingIg(false);
  }, []);

  const save = () => { onUpdate(draft); setEditing(false); };
  const cancel = () => { setDraft(profile); setEditing(false); };

  const inputStyle: React.CSSProperties = {
    background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 7,
    padding: '7px 10px', color: '#e2e8f0', fontSize: 13, outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  };

  const SpinnerLabel = ({ loading, label, color }: { loading: boolean; label: string; color: string }) => (
    <label style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
      {label === 'YOUTUBE URL' ? <PlaySquare size={12} /> : <Camera size={12} />}
      {label}
      {loading && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', marginLeft: 2 }} />}
      {!loading && (draft.youtubePfp && label === 'YOUTUBE URL' || draft.instagramPfp && label === 'INSTAGRAM URL') && (
        <span style={{ color: '#22c55e', fontSize: 10 }}>✓</span>
      )}
    </label>
  );

  if (editing) {
    return (
      <div style={{ background: '#13151e', border: '1px solid #6366f1', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Creator Name</label>
          <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Name..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <SpinnerLabel loading={fetchingYt} label="YOUTUBE URL" color="#ef4444" />
            <input
              value={draft.youtubeUrl}
              onChange={e => setDraft(p => ({ ...p, youtubeUrl: e.target.value }))}
              onBlur={e => handleUrlBlur(e.target.value, 'youtube')}
              style={inputStyle}
              placeholder="https://youtube.com/@..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <SpinnerLabel loading={fetchingIg} label="INSTAGRAM URL" color="#e1306c" />
            <input
              value={draft.instagramUrl}
              onChange={e => setDraft(p => ({ ...p, instagramUrl: e.target.value }))}
              onBlur={e => handleUrlBlur(e.target.value, 'instagram')}
              style={inputStyle}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>

        {/* PFP preview */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', minHeight: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {fetchingYt
              ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={14} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} /></div>
              : <Avatar url={draft.youtubePfp} name={draft.name || 'Y'} size={36} />
            }
            <span style={{ fontSize: 11, color: draft.youtubePfp ? '#22c55e' : '#475569' }}>
              {fetchingYt ? 'fetching...' : draft.youtubePfp ? 'YT ✓' : 'no YT pfp'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {fetchingIg
              ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={14} color="#e1306c" style={{ animation: 'spin 1s linear infinite' }} /></div>
              : <Avatar url={draft.instagramPfp} name={draft.name || 'I'} size={36} />
            }
            <span style={{ fontSize: 11, color: draft.instagramPfp ? '#22c55e' : '#475569' }}>
              {fetchingIg ? 'fetching...' : draft.instagramPfp ? 'IG ✓' : 'no IG pfp'}
            </span>
          </div>
          <button
            onClick={async () => {
              if (draft.youtubeUrl) await handleUrlBlur(draft.youtubeUrl, 'youtube');
              if (draft.instagramUrl) await handleUrlBlur(draft.instagramUrl, 'instagram');
            }}
            style={{ marginLeft: 'auto', background: '#1e2130', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tags</label>
          <input value={draft.tags} onChange={e => setDraft(p => ({ ...p, tags: e.target.value }))} style={inputStyle} placeholder="e.g. ecom, dropshipping, content strategy..." />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Notes / What to steal</label>
          <textarea value={draft.notes} onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))} rows={2}
            style={{ ...inputStyle, resize: 'vertical' }} placeholder="Hook style, editing, format ideas to steal..." />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={cancel} style={{ background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={save} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar url={profile.youtubePfp || profile.instagramPfp} name={profile.name} size={44} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{profile.name || 'Unnamed Creator'}</div>
            {profile.tags && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{profile.tags}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditing(true)} style={{ background: '#1e2130', border: 'none', color: '#94a3b8', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Edit</button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6 }}><Trash2 size={14} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#0d0f14', borderRadius: 10, padding: '12px 14px', border: '1px solid #1e2130' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, background: '#ef444420', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlaySquare size={14} color="#ef4444" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>YouTube</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar url={profile.youtubePfp} name={profile.name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {profile.youtubeUrl ? (
                <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                  Open channel <ExternalLink size={11} />
                </a>
              ) : <span style={{ fontSize: 12, color: '#334155' }}>No link added</span>}
            </div>
          </div>
        </div>

        <div style={{ background: '#0d0f14', borderRadius: 10, padding: '12px 14px', border: '1px solid #1e2130' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, background: '#e1306c18', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={14} color="#e1306c" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Instagram</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar url={profile.instagramPfp} name={profile.name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {profile.instagramUrl ? (
                <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                  Open profile <ExternalLink size={11} />
                </a>
              ) : <span style={{ fontSize: 12, color: '#334155' }}>No link added</span>}
            </div>
          </div>
        </div>
      </div>

      {profile.notes && (
        <div style={{ background: '#0d0f14', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#64748b', lineHeight: 1.6, borderLeft: '3px solid #6366f1' }}>
          {profile.notes}
        </div>
      )}
    </div>
  );
}

export default function InspirationProfiles({ profiles, onChange }: Props) {
  const addProfile = () => {
    onChange([...profiles, {
      id: generateId(), name: '', youtubeUrl: '', youtubePfp: '',
      youtubeHandle: '', instagramUrl: '', instagramPfp: '', instagramHandle: '', notes: '', tags: '',
    }]);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Inspiration Profiles</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Paste a YouTube or Instagram URL — pfp loads automatically.</p>
        </div>
        <button onClick={addProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Creator
        </button>
      </div>

      {profiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 0', color: '#334155' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👀</div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#475569' }}>No creators added yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Add creators you study for inspiration.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {profiles.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onDelete={() => onChange(profiles.filter(p => p.id !== profile.id))}
            onUpdate={updated => onChange(profiles.map(p => p.id === updated.id ? updated : p))}
          />
        ))}
      </div>
    </div>
  );
}
