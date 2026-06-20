'use client';
import { useState } from 'react';
import { Pipeline, ContentCard } from '@/lib/types';
import CardModal from './CardModal';
import { Plus, CheckCircle2, Clock, Circle } from 'lucide-react';

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

export default function YoutubeRoadmap({ pipeline, cards, users, onCardsChange, onCardSave, onCardDelete }: Props) {
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);

  const pipelineCards = cards
    .filter(c => c.pipelineId === pipeline.id)
    .sort((a, b) => {
      const aDate = a.scheduledDate ? new Date(a.scheduledDate).getTime() : new Date(a.updatedAt).getTime();
      const bDate = b.scheduledDate ? new Date(b.scheduledDate).getTime() : new Date(b.updatedAt).getTime();
      return bDate - aDate;
    });

  const addCard = () => {
    const firstStage = pipeline.stages[0];
    if (!firstStage) return;
    const newCard: ContentCard = {
      id: generateId(), title: 'New YouTube video',
      stageId: firstStage.id, pipelineId: pipeline.id,
      type: 'Top of Funnel', editor: '', format: '', scheduledDate: '', cost: '',
      headline: '', rawFileLink: '', referenceLink: '', frameLink: '',
      musicLink: '', idea: '', hook: '', body: '', thumbnail: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onCardsChange([...cards, newCard]);
    onCardSave(newCard);
    setSelectedCard(newCard);
  };

  const CARD_W = 340;
  const CARD_H = 110;
  const COL_GAP = 120;
  const ROW_GAP = 32;
  const RIGHT_X = CARD_W + COL_GAP;
  const CENTER_X = CARD_W + COL_GAP / 2;
  const totalHeight = pipelineCards.length * (CARD_H + ROW_GAP) + 40;

  return (
    <>
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>YouTube</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>Video Roadmap</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>{pipelineCards.length} videos · newest first</p>
          </div>
          <button onClick={addCard}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Plus size={15} /> New Video
          </button>
        </div>

        {pipelineCards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#475569' }}>No videos yet</p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>Hit "New Video" to add your first one to the roadmap.</p>
          </div>
        )}

        {pipelineCards.length > 0 && (
          <div style={{ position: 'relative', width: RIGHT_X + CARD_W, margin: '0 auto' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: totalHeight, pointerEvents: 'none', overflow: 'visible' }}
              viewBox={`0 0 ${RIGHT_X + CARD_W} ${totalHeight}`}>
              {pipelineCards.map((card, i) => {
                if (i >= pipelineCards.length - 1) return null;
                const isLeft = i % 2 === 0;
                const y1 = i * (CARD_H + ROW_GAP) + CARD_H / 2;
                const y2 = (i + 1) * (CARD_H + ROW_GAP) + CARD_H / 2;
                const x1 = isLeft ? CARD_W : RIGHT_X;
                const x2 = isLeft ? RIGHT_X : CARD_W;
                
                return (
                  <path key={card.id}
                    d={`M ${x1} ${y1} C ${CENTER_X + (isLeft ? 60 : -60)} ${y1}, ${CENTER_X + (isLeft ? 60 : -60)} ${y2}, ${x2} ${y2}`}
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

                return (
                  <div key={card.id} style={{ marginBottom: ROW_GAP, display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end' }}>
                    <div
                      onClick={() => setSelectedCard(card)}
                      style={{
                        width: CARD_W, background: '#13151e', border: '1px solid #1e2130',
                        borderRadius: 14, overflow: 'hidden', cursor: 'pointer', display: 'flex', height: CARD_H,
                        transition: 'border-color 0.15s, transform 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ width: 130, flexShrink: 0, position: 'relative', overflow: 'hidden', background: card.thumbnail ? '#000' : titleToGradient(card.title) }}>
                        {card.thumbnail
                          ? <img src={card.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="#e2e8f0" /></svg>
                            </div>
                        }
                        <div style={{ position: 'absolute', bottom: 6, left: 6, width: 8, height: 8, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}` }} />
                      </div>
                      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</div>
                          {card.hook && <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.hook}</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: status.color, background: status.color + '18', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{status.label}</span>
                          {dateLabel && <span style={{ fontSize: 10, color: isPosted ? '#22c55e' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{dateLabel}</span>}
                        </div>
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
          onSave={(updated) => { onCardSave(updated); setSelectedCard(null); }}
          onDelete={(id) => { onCardDelete(id); setSelectedCard(null); }}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
