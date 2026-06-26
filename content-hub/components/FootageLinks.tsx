'use client';
import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Film } from 'lucide-react';
import { FootageItem } from '@/lib/types';

interface Props {
  items: FootageItem[];
  onChange: (items: FootageItem[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function FootageLinks({ items, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', link: '', tags: '', notes: '' });

  const add = () => {
    if (!form.name.trim()) return;
    onChange([...items, { id: generateId(), ...form }]);
    setForm({ name: '', link: '', tags: '', notes: '' });
    setAdding(false);
  };

  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof FootageItem, value: string) =>
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const inputStyle = {
    background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 8,
    padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', width: '100%', fontFamily: 'inherit'
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Film size={20} color="#6366f1" /> Footage Links
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Store links to raw footage, B-roll, and video assets.</p>
        </div>
        <button onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Footage
        </button>
      </div>

      {adding && (
        <div style={{ background: '#13151e', border: '1px solid #6366f1', borderRadius: 12, padding: 20, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Name *', key: 'name', placeholder: 'Footage name...' },
            { label: 'Link', key: 'link', placeholder: 'Google Drive / Dropbox link...' },
            { label: 'Tags', key: 'tags', placeholder: 'b-roll, talking head, screen record...' },
            { label: 'Notes', key: 'notes', placeholder: 'Any notes...' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{f.label}</label>
              <input style={inputStyle} value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{ background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={add} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add Footage</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
          <Film size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No footage links yet. Add your first one.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            <input value={item.name} onChange={e => update(item.id, 'name', e.target.value)}
              style={{ ...inputStyle, fontWeight: 600 }} placeholder="Name..." />
            <div style={{ position: 'relative' }}>
              <input value={item.link} onChange={e => update(item.id, 'link', e.target.value)}
                style={{ ...inputStyle, paddingRight: 32 }} placeholder="Link..." />
              {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}><ExternalLink size={13} /></a>}
            </div>
            <input value={item.tags} onChange={e => update(item.id, 'tags', e.target.value)}
              style={inputStyle} placeholder="Tags..." />
            <button onClick={() => remove(item.id)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
