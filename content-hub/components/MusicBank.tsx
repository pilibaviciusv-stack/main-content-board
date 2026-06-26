'use client';
import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Music } from 'lucide-react';
import { MusicTrack } from '@/lib/types';

interface Props {
  tracks: MusicTrack[];
  onChange: (tracks: MusicTrack[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function MusicBank({ tracks, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', link: '', genre: '', notes: '' });

  const add = () => {
    if (!form.name.trim()) return;
    onChange([...tracks, { id: generateId(), ...form }]);
    setForm({ name: '', link: '', genre: '', notes: '' });
    setAdding(false);
  };

  const remove = (id: string) => onChange(tracks.filter(t => t.id !== id));

  const update = (id: string, field: keyof MusicTrack, value: string) =>
    onChange(tracks.map(t => t.id === id ? { ...t, [field]: value } : t));

  const inputStyle = {
    background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 8,
    padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', width: '100%', fontFamily: 'inherit'
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Music size={20} color="#6366f1" /> Music Bank
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Save tracks for your videos. Copy links directly into card music fields.</p>
        </div>
        <button onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Track
        </button>
      </div>

      {adding && (
        <div style={{ background: '#13151e', border: '1px solid #6366f1', borderRadius: 12, padding: 20, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Track Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Track name..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Link</label>
            <input style={inputStyle} value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="Spotify / SoundCloud link..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Genre / Vibe</label>
            <input style={inputStyle} value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))} placeholder="e.g. chill, hype, ambient..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Notes</label>
            <input style={inputStyle} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes..." />
          </div>
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{ background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={add} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add Track</button>
          </div>
        </div>
      )}

      {tracks.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
          <Music size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No tracks yet. Add your first one.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tracks.map(track => (
          <div key={track.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            <input value={track.name} onChange={e => update(track.id, 'name', e.target.value)}
              style={{ ...inputStyle, fontWeight: 600 }} placeholder="Track name..." />
            <div style={{ position: 'relative' }}>
              <input value={track.link} onChange={e => update(track.id, 'link', e.target.value)}
                style={{ ...inputStyle, paddingRight: 32 }} placeholder="Link..." />
              {track.link && <a href={track.link} target="_blank" rel="noopener noreferrer"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}><ExternalLink size={13} /></a>}
            </div>
            <input value={track.genre} onChange={e => update(track.id, 'genre', e.target.value)}
              style={inputStyle} placeholder="Genre / vibe..." />
            <button onClick={() => remove(track.id)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
