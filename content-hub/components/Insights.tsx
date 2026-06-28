'use client';
import { useState } from 'react';
import { Pipeline, ContentCard } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  pipelines: Pipeline[];
  cards: ContentCard[];
  hubUsers?: any[];
}

function StatCard({ label, value, sub, color = '#6366f1' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', padding: '32px 0 14px', width: '100%', textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={14} color="#475569" /> : <ChevronRight size={14} color="#475569" />}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
      </button>
      {open && children}
    </div>
  );
}

export default function Insights({ pipelines, cards, hubUsers = [] }: Props) {
  const now = new Date();

  const shortformPipelines = pipelines.filter(p =>
    p.name.toLowerCase().includes('short') || p.name.toLowerCase().includes('reel') || p.name.toLowerCase().includes('tiktok')
  );
  const youtubePipelines = pipelines.filter(p =>
    p.name.toLowerCase().includes('youtube') || p.name.toLowerCase().includes('yt')
  );
  const otherPipelines = pipelines.filter(p =>
    !shortformPipelines.includes(p) && !youtubePipelines.includes(p)
  );

  const shortformCards = cards.filter(c => shortformPipelines.some(p => p.id === c.pipelineId));
  const youtubeCards = cards.filter(c => youtubePipelines.some(p => p.id === c.pipelineId));

  const postedCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('posted') || stage?.name.toLowerCase().includes('scheduled');
  });

  const editingCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('editing') && !stage?.name.toLowerCase().includes('ready');
  });

  const readyToFilm = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('ready to film');
  });

  const ideaCards = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('idea');
  });

  const readyForEditing = cards.filter(c => {
    const pipeline = pipelines.find(p => p.id === c.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === c.stageId);
    return stage?.name.toLowerCase().includes('ready for editing');
  });

  const scheduledThisWeek = cards.filter(c => {
    if (!c.scheduledDate) return false;
    const d = new Date(c.scheduledDate);
    return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  const pipelineBreakdowns = pipelines.map(pipeline => {
    const pCards = cards.filter(c => c.pipelineId === pipeline.id);
    const stageBreakdown = pipeline.stages.map(stage => ({
      stage, count: pCards.filter(c => c.stageId === stage.id).length,
    })).filter(s => s.count > 0);
    return { pipeline, total: pCards.length, stageBreakdown };
  });

  const editorMap: Record<string, number> = {};
  cards.forEach(c => { if (c.editor) editorMap[c.editor] = (editorMap[c.editor] || 0) + 1; });

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

      {/* Overview — collapsible, open by default */}
      <CollapsibleSection title="Overview" defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          {shortformPipelines.length > 0 && (
            <StatCard label="Total Shortform Cards" value={shortformCards.length} sub={shortformPipelines.map(p => p.name).join(', ')} />
          )}
          {youtubePipelines.length > 0 && (
            <StatCard label="Total YouTube Cards" value={youtubeCards.length} sub={youtubePipelines.map(p => p.name).join(', ')} color="#ef4444" />
          )}
          {otherPipelines.map(p => {
            const count = cards.filter(c => c.pipelineId === p.id).length;
            return <StatCard key={p.id} label={`Total ${p.name}`} value={count} color="#8b5cf6" />;
          })}
          <StatCard label="Ready to Film" value={readyToFilm.length} sub="waiting for camera" color="#f59e0b" />
          <StatCard label="In Editing" value={editingCards.length} sub="editor has it" color="#3b82f6" />
          <StatCard label="Ideas" value={ideaCards.length} sub="not yet approved" color="#8b5cf6" />
          <StatCard label="Posted" value={postedCards.length} sub="live or scheduled" color="#64748b" />
        </div>

        {scheduledThisWeek.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '24px 0 12px' }}>Scheduled This Week</div>
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
      </CollapsibleSection>

      {/* Pipeline Breakdown */}
      <CollapsibleSection title="Pipeline Breakdown" defaultOpen={false}>
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
      </CollapsibleSection>

      {/* Editor workload */}
      {Object.keys(editorMap).length > 0 && (
        <CollapsibleSection title="Editor Workload" defaultOpen={false}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(editorMap).sort((a, b) => b[1] - a[1]).map(([editor, count]) => (
              <div key={editor} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 10, padding: '14px 20px', minWidth: 160 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{count}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{editor}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>active card{count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Per-member insights — collapsible, closed by default */}
      {hubUsers.length > 0 && (
        <CollapsibleSection title="Team Member Insights" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hubUsers.map(member => {
              const memberPipelines = pipelines.filter(p => member.permissions?.pipelineIds?.includes(p.id));
              const memberCards = cards.filter(c => memberPipelines.some(p => p.id === c.pipelineId));
              const memberPosted = memberCards.filter(c => {
                const pl = memberPipelines.find(p => p.id === c.pipelineId);
                const st = pl?.stages.find(s => s.id === c.stageId);
                return st?.name.toLowerCase().includes('posted');
              });
              const memberEditing = memberCards.filter(c => {
                const pl = memberPipelines.find(p => p.id === c.pipelineId);
                const st = pl?.stages.find(s => s.id === c.stageId);
                return st?.name.toLowerCase().includes('editing') && !st?.name.toLowerCase().includes('ready');
              });
              if (memberPipelines.length === 0) return null;
              return (
                <div key={member.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#6366f122', border: '1px solid #6366f133', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>{member.name[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{member.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{memberPipelines.map((p: any) => p.name).join(', ')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>{memberCards.length}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>Total Cards</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>{memberEditing.length}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>In Editing</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{memberPosted.length}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>Posted</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Ready for editing list */}
      {readyForEditing.length > 0 && (
        <CollapsibleSection title={`Ready for Editing — ${readyForEditing.length}`} defaultOpen={false}>
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
        </CollapsibleSection>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
