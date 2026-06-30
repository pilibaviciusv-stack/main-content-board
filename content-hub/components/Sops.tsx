'use client';
import { useState } from 'react';
import { Plus, Trash2, ExternalLink, FileText } from 'lucide-react';
import { SopLink } from '@/lib/types';

interface Props {
  sops: SopLink[];
  onChange: (sops: SopLink[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function Sops({ sops, onChange }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const addRow = () => {
    onChange([...sops, { id: generateId(), name: '', link: '' }]);
  };

  const remove = (id: string) => onChange(sops.filter(s => s.id !== id));

  const update = (id: string, field: 'name' | 'link', value: string) =>
    onChange(sops.map(s => s.id === id ? { ...s, [field]: value } : s));

  const cellInputStyle: React.CSSProperties = {
    background: 'none', border: 'none', outline: 'none', color: '#e2e8f0',
    fontSize: 13, fontFamily: 'inherit', width: '100%', padding: '10px 14px',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="#6366f1" /> SOPs
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Standard operating procedures and reference docs.</p>
        </div>
        <button onClick={addRow}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add SOP
        </button>
      </div>

      {sops.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No SOPs yet. Add your first one.</p>
        </div>
      )}

      {sops.length > 0 && (
        <div style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', borderBottom: '2px solid #1e2130', background: '#0a0c11' }}>
            <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
            <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '1px solid #1e2130' }}>Link</div>
            <div />
          </div>

          {sops.map((sop, idx) => (
            <div
              key={sop.id}
              onMouseEnter={() => setHoveredRow(sop.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 40px', alignItems: 'center',
                borderBottom: idx === sops.length - 1 ? 'none' : '1px solid #1a1c26',
                background: hoveredRow === sop.id ? '#0d0f1a' : 'transparent', transition: 'background 0.1s',
              }}
            >
              <input
                value={sop.name}
                onChange={e => update(sop.id, 'name', e.target.value)}
                placeholder="SOP name..."
                style={{ ...cellInputStyle, fontWeight: 600 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #1e2130' }}>
                <input
                  value={sop.link}
                  onChange={e => update(sop.id, 'link', e.target.value)}
                  placeholder="https://..."
                  style={{ ...cellInputStyle, color: sop.link ? '#6366f1' : '#e2e8f0' }}
                />
                {sop.link && (
                  <a href={sop.link} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#6366f1', display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => remove(sop.id)}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
