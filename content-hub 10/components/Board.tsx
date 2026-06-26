'use client';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Pipeline, ContentCard, Stage } from '@/lib/types';
import CardModal from './CardModal';

interface Props {
  pipeline: Pipeline;
  cards: ContentCard[];
  users: string[];
  onCardsChange: (cards: ContentCard[]) => void;
  onCardSave: (card: ContentCard) => void;
  onCardDelete: (id: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  'Top of Funnel': '#6366f1',
  'Middle of Funnel': '#f59e0b',
  'Bottom of Funnel': '#22c55e',
};

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function Board({ pipeline, cards, users, onCardsChange, onCardSave, onCardDelete }: Props) {
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);

  const pipelineCards = cards.filter(c => c.pipelineId === pipeline.id);
  const getStageCards = (stageId: string) => pipelineCards.filter(c => c.stageId === stageId);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const cardId = result.draggableId;
    const newStageId = result.destination.droppableId;
    if (newStageId === result.source.droppableId && result.destination.index === result.source.index) return;
    const updated = cards.map(c =>
      c.id === cardId ? { ...c, stageId: newStageId, updatedAt: new Date().toISOString() } : c
    );
    onCardsChange(updated);
  };

  const addCard = (stageId: string) => {
    const newCard: ContentCard = {
      id: generateId(), title: 'New card', stageId, pipelineId: pipeline.id,
      type: 'Top of Funnel', editor: '', format: '', scheduledDate: '', cost: '',
      headline: '', rawFileLink: '', referenceLink: '', frameLink: '',
      musicLink: '', videoLink: '', idea: '', hook: '', body: '', thumbnail: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onCardsChange([...cards, newCard]);
    onCardSave(newCard);
    setSelectedCard(newCard);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0 16px', minHeight: 'calc(100vh - 180px)' }}>
          {pipeline.stages.map((stage: Stage) => {
            const stageCards = getStageCards(stage.id);
            return (
              <div key={stage.id} style={{ minWidth: 280, maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#13151e', borderRadius: 10, border: '1px solid #1e2130' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{stage.name}</span>
                    <span style={{ fontSize: 12, color: '#475569', background: '#1e2130', borderRadius: 10, padding: '1px 7px' }}>{stageCards.length}</span>
                  </div>
                  <button onClick={() => addCard(stage.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <Plus size={16} />
                  </button>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80,
                        background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.07)' : 'transparent',
                        borderRadius: 10, padding: 4,
                        border: snapshot.isDraggingOver ? '1px dashed #6366f1' : '1px dashed transparent',
                        transition: 'all 0.12s',
                      }}>
                      {stageCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => !snapshot.isDragging && setSelectedCard(card)}
                              style={{
                                ...provided.draggableProps.style,
                                background: snapshot.isDragging ? '#1e2438' : '#13151e',
                                border: `1px solid ${snapshot.isDragging ? '#6366f1' : '#1e2130'}`,
                                borderRadius: 10, padding: '12px 14px',
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                boxShadow: snapshot.isDragging ? '0 8px 30px rgba(99,102,241,0.25)' : 'none',
                                userSelect: 'none',
                              }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 10 }}>{card.title}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: TYPE_COLORS[card.type] + '22', color: TYPE_COLORS[card.type], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.type.split(' ')[0]}</span>
                                {card.editor && <span style={{ fontSize: 11, color: '#64748b', background: '#1e2130', padding: '2px 7px', borderRadius: 4 }}>{card.editor}</span>}
                                {card.scheduledDate && <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(card.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                              </div>
                              {card.hook && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.hook}</p>}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {stageCards.length === 0 && !snapshot.isDraggingOver && (
                        <div style={{ border: '1px dashed #1a1d26', borderRadius: 10, padding: '16px', color: '#2d3148', fontSize: 12, textAlign: 'center' }}>Drop here</div>
                      )}
                    </div>
                  )}
                </Droppable>

                <button onClick={() => addCard(stage.id)}
                  style={{ background: 'none', border: '1px dashed #1e2130', borderRadius: 10, padding: '10px', color: '#334155', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.color = '#334155'; }}>
                  <Plus size={14} /> Add card
                </button>
              </div>
            );
          })}
        </div>
      </DragDropContext>

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
