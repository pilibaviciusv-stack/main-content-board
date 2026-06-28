'use client';
import { useState } from 'react';
import { Pipeline, ContentCard } from '@/lib/types';
import CardModal from './CardModal';
import { Plus } from 'lucide-react';

interface Props {
  pipeline: Pipeline;
  cards: ContentCard[];
  users: string[];
  onCardsChange: (cards: ContentCard[]) => void;
  onCardSave: (card: ContentCard) => void;
  onCardDelete: (id: string) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function titleToGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,16%), hsl(${(hue + 50) % 360},45%,10%))`;
}

function getStatusInfo(stageName: string): { label: string; color: string } {
  const n = stageName.toLowerCase();
  if (n.includes('posted') || n.includes('scheduled')) return { label: 'Posted', color: '#22c55e' };
  if (n.includes('green')) return { label: 'Green Light', color: '#84cc16' };
  if (n.includes('revision')) return { label: 'Revisions', color: '#ef4444' };
  if (n.includes('editing') && !n.includes('ready')) return { label: 'Editing', color: '#3b82f6' };
  if (n.includes('ready to film')) return { label: 'Ready to Film', color: '#f59e0b' };
  if (n.includes('planning') || n.includes('scripting')) return { label: 'Scripting', color: '#a855f7' };
  if (n.includes('approved')) return { label: 'Approved', color: '#8b5cf6' };
  return { label: 'Idea', color: '#6366f1' };
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

export default function YoutubeRoadmap({ pipeline, cards, users, onCardsChange, onCardSave, onCardDelete }: Props) {
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);

  // Only show cards that have a scheduled date
  const pipelineCards = cards
    .filter(c => c.pipelineId === pipeline.id && !!c.scheduledDate)
    .sort((a, b) => {
      return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
    });

  const unscheduledCount = cards.filter(c => c.pipelineId === pipeline.id && !c.scheduledDate).length;

  const addCard = () => {
    const firstStage = pipeline.stages[0];
    if (!firstStage) return;
    const newCard: ContentCard = {
      id: generateId(), title: 'New YouTube video',
      stageId: firstStage.id, pipelineId: pipeline.id,
      type: 'Top of Funnel', editor: '', format: '', scheduledDate: '', cost: '',
      headline: '', rawFileLink: '', referenceLink: '', frameLink: '',
      musicLink: '', videoLink: '', idea: '', hook: '', body: '', thumbnail: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onCardsChange([...cards, newCard]);
    onCardSave(newCard);
    setSelectedCard(newCard);
  };

  // Bigger card dimensions for PC
  const CARD_W = 420;
  const THUMB_H = 236; // 16:9 ratio for 420px width
  const CARD_H = THUMB_H + 80; // thumbnail + info area
  const COL_GAP = 140;
  const ROW_GAP = 40;
  const RIGHT_X = CARD_W + COL_GAP;
  const CENTER_X = CARD_W + COL_GAP / 2;
  const totalHeight = pipelineCards.length * (CARD_H + ROW_GAP) + 40;

  return (
    <>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, maxWidth: RIGHT_X + CARD_W, margin: '0 auto 40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>YouTube</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>Video Roadmap</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
              {pipelineCards.length} scheduled video{pipelineCards.length !== 1 ? 's' : ''}
              {unscheduledCount > 0 && <span style={{ color: '#334155' }}> · {unscheduledCount} unscheduled (set a date to show here)</span>}
            </p>
          </div>
          <button onClick={addCard}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Plus size={15} /> New Video
          </button>
        </div>

        {pipelineCards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#475569' }}>No scheduled videos</p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              Videos only appear here once you set a scheduled date.
              {unscheduledCount > 0 && <><br /><span style={{ color: '#6366f1' }}>{unscheduledCount} video{unscheduledCount !== 1 ? 's' : ''} waiting for a date.</span></>}
            </p>
          </div>
        )}

        {pipelineCards.length > 0 && (
          <div style={{ position: 'relative', width: RIGHT_X + CARD_W, margin: '0 auto', overflow: 'visible' }}>
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: totalHeight, pointerEvents: 'none', overflow: 'visible' }}
              viewBox={`0 0 ${RIGHT_X + CARD_W} ${totalHeight}`}
            >
              {pipelineCards.map((card, i) => {
                if (i >= pipelineCards.length - 1) return null;
                const isLeft = i % 2 === 0;
                const y1 = i * (CARD_H + ROW_GAP) + CARD_H / 2;
                const y2 = (i + 1) * (CARD_H + ROW_GAP) + CARD_H / 2;
                const x1 = isLeft ? CARD_W : RIGHT_X;
                const x2 = isLeft ? RIGHT_X : CARD_W;
                return (
                  <path key={card.id}
                    d={`M ${x1} ${y1} C ${CENTER_X + (isLeft ? 70 : -70)} ${y1}, ${CENTER_X + (isLeft ? 70 : -70)} ${y2}, ${x2} ${y2}`}
                    fill="none" stroke="#2d3148" strokeWidth="2" strokeDasharray="6 4" />
                );
              })}
            </svg>

            <div style={{ position: 'relative' }}>
              {pipelineCards.map((card, i) => {
                const isLeft = i % 2 === 0;
                const stage = pipeline.stages.find(s => s.id === card.stageId);
                const status = getStatusInfo(stage?.name || '');
                const dateObj = card.scheduledDate ? new Date(card.scheduledDate) : null;
                const dateLabel = dateObj ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
                const isPosted = (stage?.name || '').toLowerCase().includes('posted');
                // views from card data if available
                const views = (card as any).views;

                return (
                  <div key={card.id} style={{ marginBottom: ROW_GAP, display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end' }}>
                    <div
                      onClick={() => setSelectedCard(card)}
                      style={{
                        width: CARD_W, background: '#13151e', border: '1px solid #1e2130',
                        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column',
                        transition: 'border-color 0.15s, transform 0.12s, box-shadow 0.15s',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.2)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#1e2130';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
                      }}
                    >
                      {/* Full thumbnail — 16:9 */}
                      <div style={{
                        width: '100%', height: THUMB_H, position: 'relative', overflow: 'hidden',
                        background: card.thumbnail ? '#000' : titleToGradient(card.title), flexShrink: 0,
                      }}>
                        {card.thumbnail
                          ? <img src={card.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="#e2e8f0" /></svg>
                            </div>
                        }
                        {/* Status dot */}
                        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '3px 8px' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}` }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: status.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{status.label}</span>
                        </div>
                        {/* Date badge */}
                        {dateLabel && (
                          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '3px 8px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: isPosted ? '#22c55e' : '#94a3b8' }}>{dateLabel}</span>
                          </div>
                        )}
                        {/* Views overlay */}
                        {views != null && (
                          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{formatViews(views)}</span>
                          </div>
                        )}
                      </div>

                      {/* Title + hook below thumbnail */}
                      <div style={{ padding: '12px 16px 14px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {card.title}
                        </div>
                        {card.hook && (
                          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {card.hook}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          users={users}
          pipeline={pipeline}
          onSave={(updated) => { onCardSave(updated); setSelectedCard(null); }}
          onDelete={(id) => { onCardDelete(id); setSelectedCard(null); }}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
