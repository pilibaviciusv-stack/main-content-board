'use client';
import { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { InspirationThumbnail } from '@/lib/types';

interface Props {
  thumbnails: InspirationThumbnail[];
  onChange: (thumbnails: InspirationThumbnail[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function ThumbnailGallery({ thumbnails, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addThumbnail = () => {
    const item = { id: generateId(), title: '', imageUrl: '' };
    onChange([...thumbnails, item]);
    setEditingId(item.id);
  };

  const remove = (id: string) => onChange(thumbnails.filter(t => t.id !== id));
  const update = (id: string, field: 'title' | 'imageUrl', value: string) =>
    onChange(thumbnails.map(t => t.id === id ? { ...t, [field]: value } : t));

  const inputStyle: React.CSSProperties = {
    background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 7,
    padding: '7px 10px', color: '#e2e8f0', fontSize: 13, outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Thumbnails</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Thumbnail inspiration to reference for new content.</p>
        </div>
        <button onClick={addThumbnail}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Thumbnail
        </button>
      </div>

      {thumbnails.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 0', color: '#334155' }}>
          <ImageIcon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#475569' }}>No thumbnails saved yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Save thumbnail ideas you want to study or steal.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {thumbnails.map(t => {
          const isEditing = editingId === t.id;
          return (
            <div key={t.id} style={{ background: '#13151e', border: `1px solid ${isEditing ? '#6366f1' : '#1e2130'}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '16/9', background: '#0a0c11', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={28} color="#2d3148" />
                )}
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isEditing ? (
                  <>
                    <input value={t.title} onChange={e => update(t.id, 'title', e.target.value)}
                      placeholder="Thumbnail title..." style={inputStyle} />
                    <input value={t.imageUrl} onChange={e => update(t.id, 'imageUrl', e.target.value)}
                      placeholder="Image URL..." style={inputStyle} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, marginRight: 'auto' }}>
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Done
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div onClick={() => setEditingId(t.id)} style={{ fontSize: 14, fontWeight: 600, color: t.title ? '#e2e8f0' : '#475569', cursor: 'pointer', flex: 1 }}>
                      {t.title || 'Untitled thumbnail'}
                    </div>
                    <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
