'use client';
import { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Music, Film, Settings, Plus, Layers, PlaySquare, Video, BarChart2, Map, Users, Grid3x3, TrendingUp } from 'lucide-react';
import { AppState, ContentCard, Pipeline } from '@/lib/types';
import { loadState, savePipelines, saveCard, deleteCard, saveWorkspaceKey } from '@/lib/store';
import Board from '@/components/Board';
import MusicBank from '@/components/MusicBank';
import FootageLinks from '@/components/FootageLinks';
import PipelineSettings from '@/components/PipelineSettings';
import Insights from '@/components/Insights';
import YoutubeRoadmap from '@/components/YoutubeRoadmap';
import InspirationProfiles from '@/components/InspirationProfiles';
import ShortformGrid from '@/components/ShortformGrid';
import Analytics from '@/components/Analytics';

const HUB = 'vainius';

type View =
  | { type: 'insights' }
  | { type: 'analytics' }
  | { type: 'pipeline'; id: string }
  | { type: 'roadmap'; pipelineId: string }
  | { type: 'grid'; pipelineId: string }
  | { type: 'music' }
  | { type: 'footage' }
  | { type: 'inspiration' }
  | { type: 'settings' };

function getPipelineIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('youtube') || lower.includes('yt')) return <PlaySquare size={14} />;
  if (lower.includes('ig') || lower.includes('instagram') || lower.includes('reel') || lower.includes('stor')) return <Layers size={14} />;
  return <Video size={14} />;
}

const isYoutube = (name: string) => name.toLowerCase().includes('youtube') || name.toLowerCase().includes('yt');
const isShortform = (name: string) => name.toLowerCase().includes('short') || name.toLowerCase().includes('reel') || name.toLowerCase().includes('tiktok');

export default function VainiusHub() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ type: 'insights' });

  useEffect(() => {
    loadState(HUB).then(s => {
      setState(s);
      setLoading(false);
    });
  }, []);

  const handleCardsChange = useCallback(async (newCards: ContentCard[], changedCard?: ContentCard, deletedId?: string) => {
    setState(prev => prev ? { ...prev, cards: newCards } : prev);
    if (deletedId) {
      await deleteCard(deletedId);
    } else if (changedCard) {
      await saveCard(changedCard, HUB);
    }
  }, []);

  const handleCardSave = useCallback(async (card: ContentCard) => {
    setState(prev => prev ? { ...prev, cards: prev.cards.map(c => c.id === card.id ? card : c) } : prev);
    await saveCard(card, HUB);
  }, []);

  const handleCardDelete = useCallback(async (id: string) => {
    setState(prev => prev ? { ...prev, cards: prev.cards.filter(c => c.id !== id) } : prev);
    await deleteCard(id);
  }, []);

  const handleBoardCardsChange = useCallback(async (newCards: ContentCard[]) => {
    if (!state) return;
    const oldCards = state.cards;
    setState(prev => prev ? { ...prev, cards: newCards } : prev);
    for (const card of newCards) {
      const old = oldCards.find(c => c.id === card.id);
      if (!old || old.stageId !== card.stageId || old.title !== card.title) {
        await saveCard(card, HUB);
      }
    }
    for (const old of oldCards) {
      if (!newCards.find(c => c.id === old.id)) {
        await deleteCard(old.id);
      }
    }
  }, [state]);

  const handlePipelinesChange = useCallback(async (pipelines: Pipeline[]) => {
    setState(prev => prev ? { ...prev, pipelines } : prev);
    await savePipelines(pipelines, HUB);
  }, []);

  const handleMusicChange = useCallback(async (musicBank: any[]) => {
    setState(prev => prev ? { ...prev, musicBank } : prev);
    await saveWorkspaceKey('music_bank', musicBank, HUB);
  }, []);

  const handleFootageChange = useCallback(async (footageLinks: any[]) => {
    setState(prev => prev ? { ...prev, footageLinks } : prev);
    await saveWorkspaceKey('footage_links', footageLinks, HUB);
  }, []);

  const handleInspirationChange = useCallback(async (inspirationProfiles: any[]) => {
    setState(prev => prev ? { ...prev, inspirationProfiles } : prev);
    await saveWorkspaceKey('inspiration_profiles', inspirationProfiles, HUB);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d0f14', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10 }} />
      <div style={{ color: '#475569', fontSize: 14 }}>Loading Content Hub...</div>
    </div>
  );

  if (!state) return null;

  const activePipeline = (view.type === 'pipeline' || view.type === 'roadmap' || view.type === 'grid')
    ? state.pipelines.find(p => p.id === ((view as any).id || (view as any).pipelineId))
    : null;

  const totalCards = state.cards.length;
  const now = new Date();
  const thisWeek = state.cards.filter(c => now.getTime() - new Date(c.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000).length;

  const navItem = (label: string, icon: React.ReactNode, active: boolean, onClick: () => void, sub = false) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: sub ? '7px 12px 7px 28px' : '8px 12px',
      borderRadius: 8, background: active ? '#1e2130' : 'none', border: 'none',
      color: active ? '#e2e8f0' : sub ? '#4b5563' : '#64748b',
      cursor: 'pointer', fontSize: sub ? 12 : 13,
      fontWeight: active ? 600 : 400, width: '100%', textAlign: 'left', transition: 'all 0.15s',
    }}>{icon}{label}</button>
  );

  const getTitle = () => {
    if (view.type === 'insights') return 'Main Insights';
    if (view.type === 'analytics') return 'Analytics';
    if (view.type === 'pipeline') return activePipeline?.name || '';
    if (view.type === 'roadmap') return 'Video Roadmap';
    if (view.type === 'grid') return `${activePipeline?.name || 'Shortform'} Grid`;
    if (view.type === 'music') return 'Music Bank';
    if (view.type === 'footage') return 'Footage Links';
    if (view.type === 'inspiration') return 'Inspiration Profiles';
    return 'Pipelines';
  };

  const getSection = () => {
    if (view.type === 'insights') return 'Overview';
    if (view.type === 'analytics') return 'Overview';
    if (view.type === 'pipeline') return 'Pipeline';
    if (view.type === 'roadmap') return 'YouTube';
    if (view.type === 'grid') return 'Shortform';
    if (view.type === 'music' || view.type === 'footage') return 'Workspace';
    if (view.type === 'inspiration') return 'Research';
    return 'Admin';
  };

  const addNewCard = () => {
    if (!activePipeline) return;
    const firstStage = activePipeline.stages[0];
    if (!firstStage) return;
    const newCard: ContentCard = {
      id: `${HUB}_` + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      title: 'New card', stageId: firstStage.id, pipelineId: activePipeline.id,
      type: 'Top of Funnel', editor: '', format: '', scheduledDate: '', cost: '',
      headline: '', rawFileLink: '', referenceLink: '', frameLink: '', musicLink: '',
      videoLink: '', idea: '', hook: '', body: '', thumbnail: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setState(prev => prev ? { ...prev, cards: [...prev.cards, newCard] } : prev);
    saveCard(newCard, HUB);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d0f14' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#0a0c11', borderRight: '1px solid #1e2130', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e2130' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 11 }}>
                <span style={{ color: '#e11d48' }}>[</span><span style={{ color: '#f1f5f9' }}>PI</span><span style={{ color: '#e11d48' }}>]</span>
              </span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>⚡ Vainius</div>
              <div style={{ fontSize: 10, color: '#374151' }}>PlugInfo Agency</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItem('Main Insights', <BarChart2 size={14} />, view.type === 'insights', () => setView({ type: 'insights' }))}
          {navItem('Analytics', <TrendingUp size={14} />, view.type === 'analytics', () => setView({ type: 'analytics' }), true)}
          <div style={{ height: 16 }} />

          <div style={{ padding: '0 12px 6px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pipelines</div>
          {state.pipelines.map(p => (
            <div key={p.id}>
              {navItem(p.name, getPipelineIcon(p.name), view.type === 'pipeline' && (view as any).id === p.id, () => setView({ type: 'pipeline', id: p.id }))}
              {isYoutube(p.name) && navItem('Roadmap', <Map size={12} />, view.type === 'roadmap' && (view as any).pipelineId === p.id, () => setView({ type: 'roadmap', pipelineId: p.id }), true)}
              {(isShortform(p.name) || (!isYoutube(p.name) && !p.name.toLowerCase().includes('stor'))) && navItem('Grid', <Grid3x3 size={12} />, view.type === 'grid' && (view as any).pipelineId === p.id, () => setView({ type: 'grid', pipelineId: p.id }), true)}
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ padding: '0 12px 6px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Workspace</div>
            {navItem('Music Bank', <Music size={14} />, view.type === 'music', () => setView({ type: 'music' }))}
            {navItem('Footage Links', <Film size={14} />, view.type === 'footage', () => setView({ type: 'footage' }))}
            {navItem('Inspiration', <Users size={14} />, view.type === 'inspiration', () => setView({ type: 'inspiration' }))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ padding: '0 12px 6px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</div>
            {navItem('Pipelines', <Settings size={14} />, view.type === 'settings', () => setView({ type: 'settings' }))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2130' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#475569' }}>Total cards</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{totalCards}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#475569' }}>Active this week</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{thisWeek}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{getSection()}</div>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>{getTitle()}</h1>
          </div>
          {view.type === 'pipeline' && activePipeline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>{state.cards.filter(c => c.pipelineId === activePipeline.id).length} cards</span>
              <button onClick={addNewCard}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={15} /> New Card
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {view.type === 'insights' && <Insights pipelines={state.pipelines} cards={state.cards} />}
          {view.type === 'analytics' && <Analytics cards={state.cards} hubSlug="vainius" />}

          {view.type === 'pipeline' && activePipeline && (
            <Board
              pipeline={activePipeline}
              cards={state.cards}
              users={state.users}
              onCardsChange={handleBoardCardsChange}
              onCardSave={handleCardSave}
              onCardDelete={handleCardDelete}
            />
          )}

          {view.type === 'roadmap' && activePipeline && (
            <YoutubeRoadmap
              pipeline={activePipeline}
              cards={state.cards}
              users={state.users}
              onCardsChange={handleBoardCardsChange}
              onCardSave={handleCardSave}
              onCardDelete={handleCardDelete}
            />
          )}

          {view.type === 'grid' && activePipeline && (
            <ShortformGrid
              pipeline={activePipeline}
              cards={state.cards}
              users={state.users}
              onCardsChange={handleBoardCardsChange}
              onCardSave={handleCardSave}
              onCardDelete={handleCardDelete}
            />
          )}

          {view.type === 'music' && <MusicBank tracks={state.musicBank} onChange={handleMusicChange} />}
          {view.type === 'footage' && <FootageLinks items={state.footageLinks} onChange={handleFootageChange} />}
          {view.type === 'inspiration' && <InspirationProfiles profiles={state.inspirationProfiles} onChange={handleInspirationChange} />}
          {view.type === 'settings' && <PipelineSettings pipelines={state.pipelines} onChange={handlePipelinesChange} />}
        </div>
      </div>
    </div>
  );
}
