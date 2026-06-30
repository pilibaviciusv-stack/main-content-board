'use client';
import { useState } from 'react';
import { Plus, Trash2, Lightbulb } from 'lucide-react';
import { InspirationConcept } from '@/lib/types';

interface Props {
  concepts: InspirationConcept[];
  onChange: (concepts: InspirationConcept[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function ConceptsList({ concepts, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addConcept = () => {
    const item = { id: generateId(), name: '', explanation: '' };
    onChange([...concepts, item]);
    setEditingId(item.id);
  };

  const remove = (id: string) => onChange(concepts.filter(c => c.id !== id));
  const update = (id: string, field: 'name' | 'explanation', value: string) =>
    onChange(concepts.map(c => c.id === id ? { ...c, [field]: value } : c));

  const inputStyle: React.CSSProperties = {
    background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 7,
    padding: '7px 10px', color: '#e2e8f0', fontSize: 13, outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Concepts</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Content concepts and ideas worth exploring.</p>
        </div>
        <button onClick={addConcept}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Concept
        </button>
      </div>

      {concepts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 0', color: '#334155' }}>
          <Lightbulb size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#475569' }}>No concepts saved yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Capture content concepts and ideas as they come to you.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {concepts.map(c => {
          const isEditing = editingId === c.id;
          return (
            <div key={c.id} style={{ background: '#13151e', border: `1px solid ${isEditing ? '#6366f1' : '#1e2130'}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isEditing ? (
                <>
                  <input value={c.name} onChange={e => update(c.id, 'name', e.target.value)}
                    placeholder="Concept name..." style={{ ...inputStyle, fontWeight: 700 }} />
                  <textarea value={c.explanation} onChange={e => update(c.id, 'explanation', e.target.value)}
                    placeholder="Short explanation..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => remove(c.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, marginRight: 'auto' }}>
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div onClick={() => setEditingId(c.id)} style={{ fontSize: 15, fontWeight: 700, color: c.name ? '#e2e8f0' : '#475569', cursor: 'pointer', flex: 1 }}>
                      {c.name || 'Untitled concept'}
                    </div>
                    <button onClick={() => remove(c.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div onClick={() => setEditingId(c.id)} style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, cursor: 'pointer' }}>
                    {c.explanation || 'No explanation yet — click to add.'}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
