'use client';
import { useState } from 'react';
import { Plus, Trash2, Copy, Download, Pencil, Target, ChevronDown, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { IdeationScore, IdeationDimension, IdeationConfig } from '@/lib/types';

// ── Default dimensions ──
const DEFAULT_DIMENSIONS: IdeationDimension[] = [
  {
    id: 'views', label: 'Viral Potential', weight: 25,
    description: 'Honest gut check — can this piece realistically blow up in the target market?',
    anchors: [
      'Niche ceiling. Hard to see past 5–10k views.',
      'Maybe 20–30k with strong execution.',
      'Solid shot at 50–80k organic reach.',
      '100k+ is realistic with the right hook.',
      'Built for virality — polarising, shareable, huge upside.',
    ],
  },
  {
    id: 'presell', label: 'Pre-selling Power', weight: 20,
    description: 'Does it surface objections, demo the mechanism, and prime viewers to take next step?',
    anchors: [
      'Pure entertainment, no commercial intent.',
      'Light brand exposure, generic education.',
      'Educates on the problem, vague on solution.',
      'Demos the unique mechanism, surfaces real objections.',
      'Viewer is ready to book/buy before the CTA drops.',
    ],
  },
  {
    id: 'proven', label: 'Proven Concept', weight: 20,
    description: 'Has this format or angle already worked? Pattern-match to history.',
    anchors: [
      'Untested. No reference points anywhere.',
      'Loose precedent in adjacent niches.',
      'Format works elsewhere, unproven in this niche.',
      'Top creators in the niche have hit with this angle.',
      'Multiple proven case studies of this exact format winning.',
    ],
    hasLinks: true,
  },
  {
    id: 'icp', label: 'ICP Resonance', weight: 15,
    description: 'Does the ideal client feel like you read their mind?',
    anchors: [
      'Generic — speaks to everyone, resonates with no one.',
      'Broadly relevant to the niche.',
      'Speaks to the right segment but not sharply.',
      'ICP-specific — they see themselves in every line.',
      'Filters out time-wasters, magnetises the exact buyer.',
    ],
  },
  {
    id: 'intrigue', label: 'Intrigue & Payoff', weight: 10,
    description: 'What are the stakes? Is the payoff worth watching all the way through?',
    anchors: [
      'No clear stakes, generic payoff.',
      'Mild curiosity, modest payoff.',
      'Some tension, payoff matches the setup.',
      'Real stakes set up early, payoff is genuinely valuable.',
      "Can't-look-away stakes, payoff exceeds the setup.",
    ],
  },
  {
    id: 'brand', label: 'Brand Alignment', weight: 10,
    description: 'Does this fit the brand — visually, tonally, in message?',
    anchors: [
      'Off-brand. Different aesthetic, tone, or positioning.',
      'Mostly fits but something feels jarring.',
      "Decent fit, doesn't stand out as off-brand.",
      'Strong match in look, tone, and message.',
      "Unmistakably on-brand — couldn't be anyone else's content.",
    ],
  },
];

const VERDICT_TIERS = [
  { max: 50, label: 'Park', color: '#64748b', bg: '#1e293b', desc: 'Not worth the production cost.' },
  { max: 64, label: 'Iterate', color: '#f59e0b', bg: '#422006', desc: 'Rework hook or angle first.' },
  { max: 79, label: 'Produce', color: '#3b82f6', bg: '#172554', desc: 'Solid. Queue after greenlit.' },
  { max: 100, label: 'Greenlight', color: '#22c55e', bg: '#052e16', desc: 'Priority. Produce now.' },
];

function getVerdict(score: number) {
  return VERDICT_TIERS.find(t => score <= t.max) || VERDICT_TIERS[3];
}

function calcScore(values: number[], dimensions: IdeationDimension[]) {
  return Math.round(dimensions.reduce((acc, d, i) => acc + (values[i] || 3) * d.weight, 0) / 5);
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

interface Props {
  scores: IdeationScore[];
  config: IdeationConfig | null;
  pipelineId: string;
  pipelineName: string;
  onChange: (scores: IdeationScore[]) => void;
  onConfigChange: (config: IdeationConfig) => void;
  onSendToPipeline: (idea: IdeationScore) => void;
  sentIds: Set<string>;  // IDs of ideas already sent to pipeline
  accent?: string;
}

export default function IdeationScoring({ scores, config, pipelineId, pipelineName, onChange, onConfigChange, onSendToPipeline, sentIds, accent = '#6366f1' }: Props) {
  const dimensions = config?.dimensions || DEFAULT_DIMENSIONS;
  // Filter scores to this pipeline only
  const pipelineScores = scores.filter(s => s.pipelineId === pipelineId);

  const [tab, setTab] = useState<'score' | 'library'>('score');
  const [values, setValues] = useState<number[]>(dimensions.map(() => 3));
  const [title, setTitle] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [scorer, setScorer] = useState('');
  const [refLinks, setRefLinks] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'title' | 'scorer' | 'date'>('date');
  const [expandedAnchors, setExpandedAnchors] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const score = calcScore(values, dimensions);
  const verdict = getVerdict(score);
  const canSend = score >= 75;

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const resetForm = () => {
    setValues(dimensions.map(() => 3));
    setTitle(''); setReasoning(''); setScorer(''); setRefLinks('');
    setEditingId(null);
  };

  const handleSave = () => {
    const entry: IdeationScore = {
      id: editingId || generateId(),
      pipelineId,
      title: title || 'Untitled',
      reasoning, scorer,
      values: [...values],
      score,
      verdict: verdict.label,
      referenceLinks: refLinks,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      ts: Date.now(),
    };
    if (editingId) {
      onChange(scores.map(x => x.id === editingId ? entry : x));
      flash('Idea updated ✓');
    } else {
      onChange([...scores, entry]);
      flash('Saved to library ✓');
    }
    setEditingId(entry.id);
  };

  const handleSaveAndSend = () => {
    const entry: IdeationScore = {
      id: editingId || generateId(),
      pipelineId,
      title: title || 'Untitled',
      reasoning, scorer,
      values: [...values],
      score,
      verdict: verdict.label,
      referenceLinks: refLinks,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      ts: Date.now(),
    };
    let updated: IdeationScore[];
    if (editingId) {
      updated = scores.map(x => x.id === editingId ? entry : x);
    } else {
      updated = [...scores, entry];
    }
    onChange(updated);
    setEditingId(entry.id);
    onSendToPipeline(entry);
    flash('Sent to pipeline ✓');
  };

  const handleEdit = (idea: IdeationScore) => {
    setValues([...idea.values]);
    setTitle(idea.title);
    setReasoning(idea.reasoning || '');
    setScorer(idea.scorer || '');
    setRefLinks(idea.referenceLinks || '');
    setEditingId(idea.id);
    setTab('score');
  };

  const handleDelete = (id: string) => {
    onChange(scores.filter(x => x.id !== id));
    if (editingId === id) resetForm();
    flash('Removed ✓');
  };

  const copySummary = () => {
    const lines = [
      `📊 ${title || 'Untitled'} — ${score}/100 [${verdict.label}]`,
      verdict.desc, '',
      ...dimensions.map((d, i) => `${d.label}: ${values[i]}/5 (${d.weight}%)`),
      '', reasoning ? `Reasoning: ${reasoning}` : '', scorer ? `Scored by: ${scorer}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    flash('Copied ✓');
  };

  const exportCSV = () => {
    const header = ['Title', 'Score', 'Verdict', 'Scorer', 'Date', ...dimensions.map(d => d.label), 'Reasoning', 'In Pipeline'];
    const rows = sortedLibrary.map(idea => [
      idea.title, idea.score, idea.verdict, idea.scorer || '', idea.date,
      ...idea.values, idea.reasoning || '', sentIds.has(idea.id) ? 'Yes' : 'No',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ideation-scores.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const sortedLibrary = [...pipelineScores].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'scorer') return (a.scorer || '').localeCompare(b.scorer || '');
    return b.ts - a.ts;
  });

  const stats = {
    total: pipelineScores.length,
    greenlight: pipelineScores.filter(x => x.score >= 80).length,
    produce: pipelineScores.filter(x => x.score >= 65 && x.score < 80).length,
    avg: pipelineScores.length ? Math.round(pipelineScores.reduce((s, x) => s + x.score, 0) / pipelineScores.length) : 0,
  };

  const toggleAnchor = (id: string) => {
    setExpandedAnchors(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: '#13151e', border: '1px solid #1e2130',
    borderRadius: 8, fontSize: 13, color: '#e2e8f0', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: '#e2e8f0', color: '#0d0f14', padding: '8px 20px', borderRadius: 8,
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px #00000060',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={20} color={accent} /> Ideation Scoring
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Score ideas for <span style={{ color: '#94a3b8', fontWeight: 600 }}>{pipelineName}</span> — 75+ goes to pipeline as priority.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#13151e', borderRadius: 10, padding: 3, marginBottom: 20, border: '1px solid #1e2130' }}>
        {(['score', 'library'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all .15s',
              background: tab === t ? '#1e2130' : 'transparent',
              color: tab === t ? '#e2e8f0' : '#64748b',
            }}>{t === 'score' ? 'Score' : `Library ${pipelineScores.length || ''}`}</button>
        ))}
      </div>

      {/* ═══ SCORE TAB ═══ */}
      {tab === 'score' && (
        <div>
          {editingId && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#422006', border: '1px solid #854d0e', borderRadius: 8,
              padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#fbbf24',
            }}>
              <span>· Editing existing idea</span>
              <button onClick={resetForm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#fbbf24', fontSize: 13 }}>
                Start fresh
              </button>
            </div>
          )}

          {/* Meta fields */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#64748b', textTransform: 'uppercase' }}>
              Idea / Working Title
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Why 90% of dropshippers fail in 2025"
              style={{ ...inputStyle, marginTop: 4, fontSize: 14, fontWeight: 500 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#64748b', textTransform: 'uppercase' }}>
                Reasoning <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} rows={2}
                placeholder="Why this idea matters — the angle, hypothesis, or context..."
                style={{ ...inputStyle, marginTop: 4, resize: 'vertical' }} />
            </div>
            <div style={{ flex: '0 0 160px' }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#64748b', textTransform: 'uppercase' }}>
                Scored By
              </label>
              <input value={scorer} onChange={e => setScorer(e.target.value)} placeholder="Name"
                style={{ ...inputStyle, marginTop: 4 }} />
            </div>
          </div>

          {/* Dimensions */}
          {dimensions.map((d, i) => {
            const v = values[i] || 3;
            const open = expandedAnchors.has(d.id);
            return (
              <div key={d.id} style={{ marginBottom: 24, padding: 16, background: '#13151e', border: '1px solid #1e2130', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{d.weight}%</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 10px', lineHeight: 1.4 }}>{d.description}</p>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n}
                      onClick={() => setValues(prev => { const next = [...prev]; next[i] = n; return next; })}
                      style={{
                        flex: 1, height: 36, border: 'none', borderRadius: 7, cursor: 'pointer',
                        fontWeight: 700, fontSize: 14, transition: 'all .15s',
                        background: v === n ? accent : '#0d0f14',
                        color: v === n ? '#fff' : '#64748b',
                        boxShadow: v === n ? `0 2px 8px ${accent}40` : 'none',
                      }}>{n}</button>
                  ))}
                </div>
                <button onClick={() => toggleAnchor(d.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    color: '#475569', letterSpacing: '.5px', padding: '6px 0 0', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Anchors
                </button>
                {open && (
                  <div style={{ marginTop: 6 }}>
                    {d.anchors.map((a, ai) => (
                      <div key={ai} style={{ display: 'flex', gap: 10, padding: '4px 0', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: v === ai + 1 ? accent : '#334155', minWidth: 14 }}>{ai + 1}</span>
                        <span style={{ fontSize: 12, color: v === ai + 1 ? '#e2e8f0' : '#64748b', fontWeight: v === ai + 1 ? 600 : 400 }}>{a}</span>
                      </div>
                    ))}
                    {d.hasLinks && (
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                          Reference Links — one URL per line
                        </label>
                        <textarea value={refLinks} onChange={e => setRefLinks(e.target.value)} rows={2}
                          style={{ ...inputStyle, marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
                          placeholder="https://youtube.com/watch?v=..." />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Score display */}
          <div style={{
            background: '#13151e', borderRadius: 12, padding: 20,
            border: `1px solid ${verdict.color}30`, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#64748b', textTransform: 'uppercase' }}>Weighted Score</span>
              <div>
                <span style={{ fontSize: 40, fontWeight: 800, color: verdict.color, lineHeight: 1, fontFamily: 'monospace' }}>{score}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}> /100</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                display: 'inline-block', padding: '3px 12px', borderRadius: 6,
                background: verdict.bg, color: verdict.color,
                fontWeight: 800, fontSize: 14, border: `1px solid ${verdict.color}30`,
              }}>{verdict.label}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{verdict.desc}</span>
            </div>
            {canSend && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: '#052e1680', border: '1px solid #22c55e30',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Zap size={14} color="#22c55e" />
                <span style={{ fontSize: 12, color: '#86efac', fontWeight: 500 }}>
                  This idea qualifies for priority pipeline placement (75+)
                </span>
              </div>
            )}
            {/* Breakdown */}
            <div style={{ marginTop: 14, borderTop: '1px solid #1e2130', paddingTop: 12 }}>
              {dimensions.map((d, i) => {
                const v = values[i] || 3;
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <span style={{ fontSize: 12, color: '#64748b', flex: '0 0 130px', fontWeight: 500 }}>{d.label}</span>
                    <div style={{ flex: 1, height: 5, background: '#1e2130', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(v / 5) * 100}%`, height: '100%', background: accent, borderRadius: 3, transition: 'width .2s' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', minWidth: 14, textAlign: 'right', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {canSend ? (
              <button onClick={handleSaveAndSend}
                style={{
                  flex: 1, padding: '11px 0', border: 'none', borderRadius: 8,
                  background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <ArrowRight size={15} /> Save & Send to {pipelineName}
              </button>
            ) : (
              <button onClick={handleSave}
                style={{
                  flex: 1, padding: '11px 0', border: 'none', borderRadius: 8,
                  background: accent, color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <Plus size={15} /> {editingId ? 'Update' : 'Save to Library'}
              </button>
            )}
            <button onClick={copySummary}
              style={{
                padding: '11px 16px', border: '1px solid #1e2130', borderRadius: 8,
                background: '#13151e', color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Copy size={14} />
            </button>
          </div>
          {/* Secondary save (when canSend, also allow save-only) */}
          {canSend && (
            <button onClick={handleSave}
              style={{
                width: '100%', marginTop: 6, padding: '9px 0', border: '1px solid #1e2130',
                borderRadius: 8, background: 'transparent', color: '#64748b', fontWeight: 600,
                fontSize: 12, cursor: 'pointer',
              }}>{editingId ? 'Update without sending' : 'Save to library only'}</button>
          )}
          {editingId && (
            <button onClick={() => handleDelete(editingId)}
              style={{
                width: '100%', marginTop: 6, padding: '9px 0', border: '1px solid #7f1d1d',
                borderRadius: 8, background: '#13151e', color: '#ef4444', fontWeight: 600,
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
      )}

      {/* ═══ LIBRARY TAB ═══ */}
      {tab === 'library' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {([
              { label: 'Total', value: stats.total, color: '#e2e8f0' },
              { label: 'Greenlight', value: stats.greenlight, color: '#22c55e' },
              { label: 'Produce', value: stats.produce, color: '#3b82f6' },
              { label: 'Avg', value: stats.avg, color: accent },
            ] as const).map(s => (
              <div key={s.label} style={{
                flex: 1, background: '#13151e', borderRadius: 10, padding: '10px 12px',
                textAlign: 'center', border: '1px solid #1e2130',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.3px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginRight: 4 }}>Sort</span>
              {(['score', 'title', 'scorer', 'date'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  style={{
                    padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                    background: sortBy === s ? '#1e2130' : 'transparent',
                    color: sortBy === s ? '#e2e8f0' : '#475569',
                  }}>{s}</button>
              ))}
            </div>
            {pipelineScores.length > 0 && (
              <button onClick={exportCSV}
                style={{
                  padding: '5px 12px', border: '1px solid #1e2130', borderRadius: 6,
                  background: '#13151e', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                <Download size={12} /> CSV
              </button>
            )}
          </div>

          {sortedLibrary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
              <Target size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>No ideas scored yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>Switch to Score tab and start rating ideas.</p>
            </div>
          ) : (
            sortedLibrary.map(idea => {
              const v = getVerdict(idea.score);
              const inPipeline = sentIds.has(idea.id);
              return (
                <div key={idea.id} style={{
                  display: 'flex', alignItems: 'center', padding: '12px 16px',
                  background: '#13151e', borderRadius: 10, border: `1px solid ${inPipeline ? accent + '30' : '#1e2130'}`,
                  gap: 12, marginBottom: 6,
                }}>
                  <span style={{ fontWeight: 800, fontSize: 20, color: v.color, minWidth: 36, fontFamily: 'monospace' }}>{idea.score}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {idea.title || 'Untitled'}
                      {inPipeline && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: accent + '20', color: accent, textTransform: 'uppercase', letterSpacing: '.3px', flexShrink: 0 }}>
                          In Pipeline
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block', padding: '1px 8px', borderRadius: 4,
                        background: v.bg, color: v.color, fontWeight: 700, fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '.3px', border: `1px solid ${v.color}20`,
                      }}>{v.label}</span>
                      {idea.scorer && <span>{idea.scorer}</span>}
                      <span>· {idea.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {idea.score >= 75 && !inPipeline && (
                      <button onClick={() => onSendToPipeline(idea)}
                        style={{
                          background: '#052e16', border: '1px solid #22c55e30', borderRadius: 6, padding: '6px 10px',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#22c55e',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                        <ArrowRight size={12} /> Send
                      </button>
                    )}
                    <button onClick={() => handleEdit(idea)}
                      style={{
                        background: '#1e2130', border: 'none', borderRadius: 6, padding: '6px 10px',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#94a3b8',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(idea.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 6, display: 'flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
