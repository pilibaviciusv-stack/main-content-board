'use client';
import { Pipeline, ContentCard } from '@/lib/types';

interface Props {
  pipelines: Pipeline[];
  cards: ContentCard[];
}

const STAGE_COLOR_MAP: Record<string, string> = {};

function StatCard({ label, value, sub, color = '#6366f1' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Insights({ pipelines, cards }: Props) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const thisWeek = cards.filter(c => new Date(c.updatedAt) > weekAgo).length;
  const today = cards.filter(c => new Date(c.updatedAt) > dayAgo).length;

  // Cards scheduled this week
  const scheduledThisWeek = cards.filter(c => {
    if (!c.scheduledDate) return false;
    const d = new Date(c.scheduledDate);
    return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  // Posted cards (in any "Posted / Scheduled" stage)
  const postedCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('posted') || stage?.name.toLowerCase().includes('scheduled');
  });

  // Green light cards
  const greenLightCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('green');
  });

  // Cards in editing
  const editingCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('editing') && !stage?.name.toLowerCase().includes('ready');
  });

  // Ready to film
  const readyToFilm = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('ready to film');
  });

  // Revisions
  const revisionsCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('revision');
  });

  // Ideas
  const ideaCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('idea');
  });

  // Ready for editing
  const readyForEditing = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('ready for editing');
  });

  // Stuck cards (not updated in 5+ days, not posted)
  const stuckCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    const isPosted = stage?.name.toLowerCase().includes('posted');
    const isIdea = stage?.name.toLowerCase().includes('idea');
    const daysSince = (now.getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return !isPosted && !isIdea && daysSince >= 5;
  });

  // Per-pipeline breakdown
  const pipelineBreakdowns = pipelines.map(pipeline => {
    const pCards = cards.filter(c => c.pipelineId === pipeline.id);
    const stageBreakdown = pipeline.stages.map(stage => ({
      stage,
      count: pCards.filter(c => c.stageId === stage.id).length,
    })).filter(s => s.count > 0);
    return { pipeline, total: pCards.length, stageBreakdown };
  });

  // Editor workload
  const editorMap: Record<string, number> = {};
  cards.forEach(c => {
    if (c.editor) {
      editorMap[c.editor] = (editorMap[c.editor] || 0) + 1;
    }
  });

  // Type breakdown
  const typeMap: Record<string, number> = { 'Top of Funnel': 0, 'Middle of Funnel': 0, 'Bottom of Funnel': 0 };
  cards.forEach(c => { typeMap[c.type] = (typeMap[c.type] || 0) + 1; });

  const TYPE_COLORS: Record<string, string> = {
    'Top of Funnel': '#6366f1',
    'Middle of Funnel': '#f59e0b',
    'Bottom of Funnel': '#22c55e',
  };

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '32px 0 14px' }}>{title}</div>
  );

  const pill = (label: string, color: string) => (
    <span style={{ fontSize: 11, fontWeight: 700, background: color + '22', color, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
  );

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#475569' }}>No data yet</p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#334155' }}>Add some cards to your pipelines to see insights.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Top KPIs */}
      {sectionTitle('Overview')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Cards" value={cards.length} sub="across all pipelines" />
        <StatCard label="Active This Week" value={thisWeek} sub="updated in last 7 days" color="#8b5cf6" />
        <StatCard label="Ready to Film" value={readyToFilm.length} sub="waiting for camera" color="#f59e0b" />
        <StatCard label="In Editing" value={editingCards.length} sub="editor has it" color="#3b82f6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
        <StatCard label="Revisions" value={revisionsCards.length} sub="needs fixes" color="#ef4444" />
        <StatCard label="Green Light" value={greenLightCards.length} sub="ready to post" color="#22c55e" />
        <StatCard label="Posted" value={postedCards.length} sub="live or scheduled" color="#64748b" />
        <StatCard label="Stuck 5+ days" value={stuckCards.length} sub={stuckCards.length > 0 ? 'needs attention ⚠️' : 'all good ✓'} color={stuckCards.length > 0 ? '#ef4444' : '#22c55e'} />
      </div>

      {/* Stuck cards detail */}
      {stuckCards.length > 0 && (
        <>
          {sectionTitle('Stuck Cards — Need Attention')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stuckCards.map(card => {
              const pipeline = pipelines.find(p => p.id === card.pipelineId);
              const stage = pipeline?.stages.find(s => s.id === card.stageId);
              const daysSince = Math.floor((now.getTime() - new Date(card.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={card.id} style={{ background: '#13151e', border: '1px solid #2d1515', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage?.color || '#ef4444', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{card.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{pipeline?.name} → {stage?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {card.editor && <span style={{ fontSize: 11, color: '#64748b', background: '#1e2130', padding: '2px 8px', borderRadius: 4 }}>{card.editor}</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{daysSince}d stuck</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Scheduled this week */}
      {scheduledThisWeek.length > 0 && (
        <>
          {sectionTitle('Scheduled This Week')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scheduledThisWeek.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()).map(card => {
              const pipeline = pipelines.find(p => p.id === card.pipelineId);
              const stage = pipeline?.stages.find(s => s.id === card.stageId);
              const dateStr = new Date(card.scheduledDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={card.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage?.color || '#6366f1', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{card.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{pipeline?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {pill(stage?.name || '', stage?.color || '#6366f1')}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pipeline breakdowns */}
      {sectionTitle('Pipeline Breakdown')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {pipelineBreakdowns.map(({ pipeline, total, stageBreakdown }) => (
          <div key={pipeline.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{pipeline.name}</div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>{total} card{total !== 1 ? 's' : ''} total</div>
            {stageBreakdown.length === 0 ? (
              <div style={{ fontSize: 12, color: '#334155' }}>No cards yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pipeline.stages.map(stage => {
                  const count = stageBreakdown.find(s => s.stage.id === stage.id)?.count || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={stage.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: count > 0 ? '#94a3b8' : '#334155' }}>{stage.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? '#e2e8f0' : '#334155' }}>{count}</span>
                      </div>
                      {count > 0 && (
                        <div style={{ height: 3, background: '#1e2130', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: stage.color, borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editor workload */}
      {Object.keys(editorMap).length > 0 && (
        <>
          {sectionTitle('Editor Workload')}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(editorMap).sort((a, b) => b[1] - a[1]).map(([editor, count]) => (
              <div key={editor} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 10, padding: '14px 20px', minWidth: 160 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{count}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{editor}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>active card{count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Content type split */}
      {sectionTitle('Content Type Split')}
      <div style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          {Object.entries(typeMap).map(([type, count]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[type] }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{type}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 8, background: '#1e2130', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          {Object.entries(typeMap).map(([type, count]) => {
            const pct = cards.length > 0 ? (count / cards.length) * 100 : 0;
            return pct > 0 ? (
              <div key={type} style={{ height: '100%', width: `${pct}%`, background: TYPE_COLORS[type] }} />
            ) : null;
          })}
        </div>
      </div>

      {/* Ready for editing list */}
      {readyForEditing.length > 0 && (
        <>
          {sectionTitle(`Ready for Editing — ${readyForEditing.length} card${readyForEditing.length !== 1 ? 's' : ''}`)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {readyForEditing.map(card => {
              const pipeline = pipelines.find(p => p.id === card.pipelineId);
              return (
                <div key={card.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{pipeline?.name}{card.format ? ` · ${card.format}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {card.editor ? (
                      <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e2130', padding: '2px 8px', borderRadius: 4 }}>{card.editor}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#ef4444', background: '#2d1515', padding: '2px 8px', borderRadius: 4 }}>No editor</span>
                    )}
                    {card.frameLink && (
                      <a href={card.frameLink} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none' }}>Frame.io →</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
