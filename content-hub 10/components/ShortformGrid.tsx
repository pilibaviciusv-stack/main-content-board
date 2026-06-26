'use client';
import { useState } from 'react';
import { Pipeline, ContentCard, CardType } from '@/lib/types';
import CardModal from './CardModal';
import { Plus, CheckCircle2, ExternalLink, Grid3x3 } from 'lucide-react';

interface Props {
  pipeline: Pipeline;
  cards: ContentCard[];
  users: string[];
  onCardsChange: (cards: ContentCard[]) => void;
  onCardSave: (card: ContentCard) => void;
  onCardDelete: (id: string) => void;
}

const TYPE_COLORS: Record<CardType, { bg: string; color: string; short: string }> = {
  'Top of Funnel':    { bg: '#6366f122', color: '#818cf8', short: 'TOF' },
  'Middle of Funnel': { bg: '#f59e0b22', color: '#fbbf24', short: 'MOF' },
  'Bottom of Funnel': { bg: '#22c55e22', color: '#4ade80', short: 'BOF' },
};

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getVideoPreviewUrl(videoLink: string): string | null {
  if (!videoLink) return null;
  // TikTok — no reliable embed thumbnail without API, show placeholder
  // Instagram — same limitation
  return null;
}

function getVideoPlatform(link: string): { name: string; color: string } {
  if (link.includes('tiktok')) return { name: 'TikTok', color: '#fe2c55' };
  if (link.includes('instagram')) return { name: 'Instagram', color: '#e1306c' };
  if (link.includes('youtube')) return { name: 'YouTube', color: '#ff0000' };
  return { name: 'Link', color: '#6366f1' };
}

function VideoCard({
  card,
  pipeline,
  onClick,
  onQuickApprove,
}: {
  card: ContentCard;
  pipeline: Pipeline;
  onClick: () => void;
  onQuickApprove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const typeInfo = TYPE_COLORS[card.type] || TYPE_COLORS['Top of Funnel'];
  const stage = pipeline.stages.find(s => s.id === card.stageId);
  const isApproved = stage?.name.toLowerCase().includes('approved') || stage?.name.toLowerCase().includes('green') || stage?.name.toLowerCase().includes('posted');
  const hasVideoLink = !!card.videoLink;
  const platform = card.videoLink ? getVideoPlatform(card.videoLink) : null;

  return (
    <div
      style={{
        background: hovered ? '#1a1d26' : '#13151e',
        border: `1px solid ${hovered ? '#3d4266' : '#1e2130'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.18s',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail / Preview area */}
      <div
        style={{ position: 'relative', aspectRatio: '9/16', maxHeight: 220, overflow: 'hidden', background: '#0d0f14', flexShrink: 0 }}
        onClick={onClick}
      >
        {card.thumbnail ? (
          <img
            src={card.thumbnail}
            alt={card.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, #1a1d26 0%, #0d0f14 100%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Grid3x3 size={28} color="#334155" />
            <span style={{ color: '#334155', fontSize: 11 }}>No thumbnail</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 0.18s',
          pointerEvents: 'none',
        }} />

        {/* TOF/MOF/BOF tag */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: typeInfo.bg,
          border: `1px solid ${typeInfo.color}44`,
          color: typeInfo.color,
          borderRadius: 6, padding: '3px 7px',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          backdropFilter: 'blur(4px)',
        }}>
          {typeInfo.short}
        </div>

        {/* Platform badge if has video link */}
        {platform && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: `${platform.color}22`,
            border: `1px solid ${platform.color}55`,
            color: platform.color,
            borderRadius: 6, padding: '3px 7px',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
            backdropFilter: 'blur(4px)',
          }}>
            {platform.name}
          </div>
        )}

        {/* Open video link button — visible on hover if videoLink exists */}
        {hasVideoLink && hovered && (
          <a
            href={card.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(99,102,241,0.9)',
              borderRadius: 8, padding: '6px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
              color: '#fff', fontSize: 11, fontWeight: 700,
              textDecoration: 'none',
              zIndex: 2,
            }}
          >
            <ExternalLink size={11} /> Watch
          </a>
        )}
      </div>

      {/* Card info */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }} onClick={onClick}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#e2e8f0',
          lineHeight: 1.3, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
        }}>
          {card.title}
        </div>

        {/* Stage pill */}
        {stage && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${stage.color}18`, border: `1px solid ${stage.color}44`,
            borderRadius: 20, padding: '2px 8px',
            fontSize: 10, fontWeight: 600, color: stage.color,
            width: 'fit-content',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: stage.color }} />
            {stage.name}
          </div>
        )}
      </div>

      {/* Quick Approve button */}
      {!isApproved && (
        <button
          onClick={e => { e.stopPropagation(); onQuickApprove(); }}
          style={{
            margin: '0 12px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: hovered ? '#15803d22' : 'transparent',
            border: `1px solid ${hovered ? '#16a34a' : '#1e2130'}`,
            color: hovered ? '#22c55e' : '#334155',
            borderRadius: 7, padding: '6px 10px',
            cursor: 'pointer', fontSize: 11, fontWeight: 700,
            transition: 'all 0.18s',
          }}
        >
          <CheckCircle2 size={12} /> Approve
        </button>
      )}
      {isApproved && (
        <div style={{ margin: '0 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Approved
        </div>
      )}
    </div>
  );
}

export default function ShortformGrid({ pipeline, cards, users, onCardsChange, onCardSave, onCardDelete }: Props) {
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);
  const [filterType, setFilterType] = useState<CardType | 'all'>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [search, setSearch] = useState('');

  const pipelineCards = cards.filter(c => c.pipelineId === pipeline.id);

  const filtered = pipelineCards.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStage !== 'all' && c.stageId !== filterStage) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleQuickApprove = (card: ContentCard) => {
    const approvedStage = pipeline.stages.find(s => s.name.toLowerCase().includes('approved'));
    if (!approvedStage) return;
    const updated = { ...card, stageId: approvedStage.id, updatedAt: new Date().toISOString() };
    const newCards = cards.map(c => c.id === card.id ? updated : c);
    onCardsChange(newCards);
    onCardSave(updated);
  };

  const addCard = () => {
    const firstStage = pipeline.stages[0];
    if (!firstStage) return;
    const newCard: ContentCard = {
      id: generateId(), title: 'New video idea',
      stageId: firstStage.id, pipelineId: pipeline.id,
      type: 'Top of Funnel', editor: '', format: '', scheduledDate: '', cost: '',
      headline: '', rawFileLink: '', referenceLink: '', frameLink: '',
      musicLink: '', videoLink: '', idea: '', hook: '', body: '', thumbnail: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const newCards = [...cards, newCard];
    onCardsChange(newCards);
    onCardSave(newCard);
    setSelectedCard(newCard);
  };

  const types: { value: CardType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Top of Funnel', label: 'TOF' },
    { value: 'Middle of Funnel', label: 'MOF' },
    { value: 'Bottom of Funnel', label: 'BOF' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search videos..."
          style={{
            background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 8,
            padding: '8px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none',
            width: 220, fontFamily: 'inherit',
          }}
        />

        {/* Type filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {types.map(t => {
            const typeInfo = t.value !== 'all' ? TYPE_COLORS[t.value] : null;
            const active = filterType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${active && typeInfo ? typeInfo.color : active ? '#6366f1' : '#2d3148'}`,
                  background: active && typeInfo ? typeInfo.bg : active ? '#6366f122' : 'transparent',
                  color: active && typeInfo ? typeInfo.color : active ? '#818cf8' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Stage filter */}
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          style={{
            background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 8,
            padding: '7px 12px', color: filterStage === 'all' ? '#64748b' : '#e2e8f0',
            fontSize: 12, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">All Stages</option>
          {pipeline.stages.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#475569' }}>{filtered.length} video{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={addCard}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#6366f1', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <Plus size={15} /> New Video
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 0', color: '#334155', gap: 12,
        }}>
          <Grid3x3 size={40} color="#1e2130" />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>No videos yet</div>
          <div style={{ fontSize: 13 }}>Add your first shortform video to get started</div>
          <button onClick={addCard} style={{ marginTop: 8, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> Add Video
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
        }}>
          {filtered.map(card => (
            <VideoCard
              key={card.id}
              card={card}
              pipeline={pipeline}
              onClick={() => setSelectedCard(card)}
              onQuickApprove={() => handleQuickApprove(card)}
            />
          ))}
        </div>
      )}

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          users={users}
          pipeline={pipeline}
          onSave={card => {
            const newCards = cards.map(c => c.id === card.id ? card : c);
            onCardsChange(newCards);
            onCardSave(card);
            setSelectedCard(null);
          }}
          onDelete={id => {
            const newCards = cards.filter(c => c.id !== id);
            onCardsChange(newCards);
            onCardDelete(id);
            setSelectedCard(null);
          }}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
