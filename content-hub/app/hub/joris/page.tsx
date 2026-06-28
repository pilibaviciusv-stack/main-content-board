'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Film, Settings, Plus, Layers, PlaySquare, Video, BarChart2, Map, Users, Grid3x3, TrendingUp, Home, ArrowLeft, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { AppState, ContentCard, Pipeline } from '@/lib/types';
import { loadState, savePipelines, saveCard, deleteCard, saveWorkspaceKey, saveHubUsers } from '@/lib/store';
import Board from '@/components/Board';
import MusicBank from '@/components/MusicBank';
import FootageLinks from '@/components/FootageLinks';
import PipelineSettings from '@/components/PipelineSettings';
import Insights from '@/components/Insights';
import YoutubeRoadmap from '@/components/YoutubeRoadmap';
import InspirationProfiles from '@/components/InspirationProfiles';
import ShortformGrid from '@/components/ShortformGrid';
import Analytics from '@/components/Analytics';
import AdminPanel from '@/components/AdminPanel';

const HUB = 'joris';
const HUB_EMOJI = '🎯';
const HUB_NAME = 'Joris';
const HUB_DESC = 'Content Strategy';
const HUB_ACCENT = '#ef4444';

type View =
  | { type: 'insights' }
  | { type: 'analytics' }
  | { type: 'pipeline'; id: string }
  | { type: 'roadmap'; pipelineId: string }
  | { type: 'grid'; pipelineId: string }
  | { type: 'music' }
  | { type: 'footage' }
  | { type: 'inspiration' }
  | { type: 'settings' }
  | { type: 'admin' };

function getPipelineIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('youtube') || lower.includes('yt')) return <PlaySquare size={14} />;
  if (lower.includes('ig') || lower.includes('instagram') || lower.includes('reel') || lower.includes('stor')) return <Layers size={14} />;
  return <Video size={14} />;
}

const isYoutube = (name: string) => name.toLowerCase().includes('youtube') || name.toLowerCase().includes('yt');
const isShortform = (name: string) =>
  name.toLowerCase().includes('short') || name.toLowerCase().includes('reel') ||
  name.toLowerCase().includes('tiktok') || name.toLowerCase().includes('clip');

// Mock logged-in user - in real app this would come from auth
const CURRENT_USER = { email: 'danas@pluginfo.com', isOwner: true };

function getHubUserSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('hub_user_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Expire after 7 days
    if (Date.now() - session.loginAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('hub_user_session');
      return null;
    }
    return session;
  } catch { return null; }
}

export default function HubPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ type: 'insights' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(new Set());
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [hubUserSession, setHubUserSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const session = getHubUserSession();
    setHubUserSession(session);
    // If hub user session exists but for wrong hub, redirect to their hub
    if (session && session.hub !== HUB) {
      router.push(`/hub/${session.hub}`);
      return;
    }
    loadState(HUB).then((s: AppState) => { setState(s); setLoading(false); });
  }, [router]);

  const handleCardSave = useCallback(async (card: ContentCard) => {
    setState((prev: AppState | null) => prev ? { ...prev, cards: prev.cards.map((c: ContentCard) => c.id === card.id ? card : c) } : prev);
    await saveCard(card, HUB);
  }, []);

  const handleCardDelete = useCallback(async (id: string) => {
    setState((prev: AppState | null) => prev ? { ...prev, cards: prev.cards.filter((c: ContentCard) => c.id !== id) } : prev);
    await deleteCard(id);
  }, []);

  const handleBoardCardsChange = useCallback(async (newCards: ContentCard[]) => {
    if (!state) return;
    const oldCards = state.cards;
    setState((prev: AppState | null) => prev ? { ...prev, cards: newCards } : prev);
    for (const card of newCards) {
      const old = oldCards.find((c: ContentCard) => c.id === card.id);
      if (!old || old.stageId !== card.stageId || old.title !== card.title) await saveCard(card, HUB);
    }
    for (const old of oldCards) {
      if (!newCards.find((c: ContentCard) => c.id === old.id)) await deleteCard(old.id);
    }
  }, [state]);

  const handlePipelinesChange = useCallback(async (pipelines: Pipeline[]) => {
    setState((prev: AppState | null) => prev ? { ...prev, pipelines } : prev);
    await savePipelines(pipelines, HUB);
  }, []);

  const handleMusicChange = useCallback(async (musicBank: any[]) => {
    setState((prev: AppState | null) => prev ? { ...prev, musicBank } : prev);
    await saveWorkspaceKey('music_bank', musicBank, HUB);
  }, []);

  const handleFootageChange = useCallback(async (footageLinks: any[]) => {
    setState((prev: AppState | null) => prev ? { ...prev, footageLinks } : prev);
    await saveWorkspaceKey('footage_links', footageLinks, HUB);
  }, []);

  const handleInspirationChange = useCallback(async (inspirationProfiles: any[]) => {
    setState((prev: AppState | null) => prev ? { ...prev, inspirationProfiles } : prev);
    await saveWorkspaceKey('inspiration_profiles', inspirationProfiles, HUB);
  }, []);

  const handleHubUsersChange = useCallback(async (hubUsers: any[]) => {
    setState((prev: AppState | null) => prev ? { ...prev, hubUsers } : prev);
    await saveHubUsers(hubUsers, HUB);
  }, []);

  const navigate = (v: View) => { setView(v); setSidebarOpen(false); };

  const togglePipelineExpand = (pipelineId: string) => {
    setExpandedPipelines(prev => {
      const next = new Set(prev);
      if (next.has(pipelineId)) next.delete(pipelineId);
      else next.add(pipelineId);
      return next;
    });
  };

  const addNewCard = (pipeline: Pipeline) => {
    const firstStage = pipeline.stages[0];
    if (!firstStage) return;
    const newCard: ContentCard = {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      title: 'New card', stageId: firstStage.id, pipelineId: pipeline.id,
      type: 'Top of Funnel', editor: '', format: '', scheduledDate: '', cost: '',
      headline: '', rawFileLink: '', referenceLink: '', frameLink: '', musicLink: '',
      videoLink: '', idea: '', hook: '', body: '', thumbnail: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setState((prev: AppState | null) => prev ? { ...prev, cards: [...prev.cards, newCard] } : prev);
    saveCard(newCard, HUB);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d0f14' }}>
      <div style={{ color: '#475569', fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!state) return null;

  const activePipeline = (view.type === 'pipeline' || view.type === 'roadmap' || view.type === 'grid')
    ? state.pipelines.find((p: Pipeline) => p.id === ((view as any).id || (view as any).pipelineId))
    : null;

  const navBtn = (label: string, icon: React.ReactNode, active: boolean, onClick: () => void, sub = false) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: sub ? '6px 12px 6px 28px' : '8px 12px',
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
    if (view.type === 'grid') return `${activePipeline?.name || ''} Grid`;
    if (view.type === 'music') return 'Music Bank';
    if (view.type === 'footage') return 'Footage Links';
    if (view.type === 'inspiration') return 'Inspiration';
    if (view.type === 'admin') return 'Team Access';
    return 'Settings';
  };

  const insightsActive = view.type === 'insights' || view.type === 'analytics';

  // Permission filtering for hub users
  const isHubUser = !!hubUserSession;
  const perms = hubUserSession?.permissions;
  const visiblePipelines = isHubUser && !perms?.isAdmin
    ? state.pipelines.filter((p: Pipeline) => perms?.pipelineIds?.includes(p.id))
    : state.pipelines;
  const canViewInsights = !isHubUser || perms?.isAdmin || perms?.canViewInsights;
  const canViewMusic = !isHubUser || perms?.isAdmin || perms?.canViewMusic;
  const canViewFootage = !isHubUser || perms?.isAdmin || perms?.canViewFootage;
  const canViewInspiration = !isHubUser || perms?.isAdmin || perms?.canViewInspiration;
  const canViewAdmin = !isHubUser || perms?.isAdmin;

  const sidebarInner = (
    <>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e2130' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 11 }}>
              <span style={{ color: '#e11d48' }}>[</span><span style={{ color: '#f1f5f9' }}>PI</span><span style={{ color: '#e11d48' }}>]</span>
            </span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{HUB_EMOJI} {HUB_NAME}</div>
            <div style={{ fontSize: 10, color: '#374151' }}>{HUB_DESC}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {/* Main Insights — collapsible in sidebar */}
        {canViewInsights && (
        <button
          onClick={() => {
            if (!insightsExpanded) {
              setInsightsExpanded(true);
              navigate({ type: 'insights' });
            } else {
              setInsightsExpanded(false);
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
            borderRadius: 8, background: insightsActive ? '#1e2130' : 'none', border: 'none',
            color: insightsActive ? '#e2e8f0' : '#64748b',
            cursor: 'pointer', fontSize: 13, fontWeight: insightsActive ? 600 : 400,
            width: '100%', textAlign: 'left', transition: 'all 0.15s',
          }}
        >
          <BarChart2 size={14} />
          <span style={{ flex: 1 }}>Main Insights</span>
          {insightsExpanded ? <ChevronDown size={12} style={{ opacity: 0.5 }} /> : <ChevronRight size={12} style={{ opacity: 0.5 }} />}
        </button>
        )}

        {/* Analytics + member insights sub-items — only when expanded */}
        {canViewInsights && insightsExpanded && (
          <>
            {navBtn('Analytics', <TrendingUp size={12} />, view.type === 'analytics', () => navigate({ type: 'analytics' }), true)}
          </>
        )}

        <div style={{ height: 16 }} />
        <div style={{ padding: '0 12px 6px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pipelines</div>

        {visiblePipelines.map((p: Pipeline) => {
          const isExpanded = expandedPipelines.has(p.id);
          const isPipelineActive = view.type === 'pipeline' && (view as any).id === p.id;
          const hasYT = isYoutube(p.name);
          const hasSF = isShortform(p.name);
          const hasSubViews = hasYT || hasSF;
          return (
            <div key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    navigate({ type: 'pipeline', id: p.id });
                    if (hasSubViews) togglePipelineExpand(p.id);
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
                    borderRadius: 8, background: isPipelineActive ? '#1e2130' : 'none', border: 'none',
                    color: isPipelineActive ? '#e2e8f0' : '#64748b', cursor: 'pointer', fontSize: 13,
                    fontWeight: isPipelineActive ? 600 : 400, textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  {getPipelineIcon(p.name)}
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {hasSubViews && (
                    isExpanded
                      ? <ChevronDown size={12} style={{ opacity: 0.4 }} />
                      : <ChevronRight size={12} style={{ opacity: 0.4 }} />
                  )}
                </button>
              </div>
              {/* Sub-views only visible when pipeline expanded */}
              {isExpanded && (
                <>
                  {hasYT && navBtn('Roadmap', <Map size={12} />, view.type === 'roadmap' && (view as any).pipelineId === p.id, () => navigate({ type: 'roadmap', pipelineId: p.id }), true)}
                  {hasSF && navBtn('Grid', <Grid3x3 size={12} />, view.type === 'grid' && (view as any).pipelineId === p.id, () => navigate({ type: 'grid', pipelineId: p.id }), true)}
                </>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 16 }}>
          <div style={{ padding: '0 12px 6px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Workspace</div>
          {canViewMusic && navBtn('Music Bank', <Music size={14} />, view.type === 'music', () => navigate({ type: 'music' }))}
          {canViewFootage && navBtn('Footage Links', <Film size={14} />, view.type === 'footage', () => navigate({ type: 'footage' }))}
          {canViewInspiration && navBtn('Inspiration', <Users size={14} />, view.type === 'inspiration', () => navigate({ type: 'inspiration' }))}
        </div>
        {canViewAdmin && (
          <div style={{ marginTop: 16 }}>
            <div style={{ padding: '0 12px 6px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</div>
            {navBtn('Pipelines', <Settings size={14} />, view.type === 'settings', () => navigate({ type: 'settings' }))}
            {navBtn('Team Access', <Shield size={14} />, view.type === 'admin', () => navigate({ type: 'admin' }))}
          </div>
        )}
        {isHubUser && (
          <div style={{ marginTop: 16, padding: '0 8px' }}>
            <button onClick={() => { localStorage.removeItem('hub_user_session'); window.location.href = '/login'; }}
              style={{ width: '100%', background: 'none', border: '1px solid #1e2130', borderRadius: 8, padding: '7px 12px', color: '#475569', cursor: 'pointer', fontSize: 12, textAlign: 'left' }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="hub-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d0f14' }}>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#000000aa' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ width: 260, background: '#0a0c11', borderRight: '1px solid #1e2130', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, height: '100%' }}>
            {sidebarInner}
          </div>
        </div>
      )}

      <div className="hub-sidebar" style={{ width: 220, background: '#0a0c11', borderRight: '1px solid #1e2130', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {sidebarInner}
      </div>

      <div className="hub-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="hub-header" style={{ padding: '16px 24px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"
              style={{ display: 'none', background: 'none', border: '1px solid #1e2130', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: '#64748b', fontSize: 16 }}>
              ☰
            </button>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>{getTitle()}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {view.type === 'pipeline' && activePipeline && (
              <>
                <span style={{ fontSize: 12, color: '#475569' }}>{state.cards.filter((c: ContentCard) => c.pipelineId === activePipeline.id).length} cards</span>
                <button onClick={() => addNewCard(activePipeline)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: HUB_ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <Plus size={15} /> New
                </button>
              </>
            )}
            <button onClick={() => router.push('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #1e2130', borderRadius: 7, padding: '6px 10px', color: '#4b5563', cursor: 'pointer', fontSize: 12 }}>
              <ArrowLeft size={13} />
            </button>
          </div>
        </div>

        <div className="hub-content" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {view.type === 'insights' && <Insights pipelines={state.pipelines} cards={state.cards} hubUsers={state.hubUsers || []} />}
          {view.type === 'analytics' && <Analytics cards={state.cards} channelHandle="JorisChannel" hubSlug="joris" />}
          {view.type === 'pipeline' && activePipeline && (
            <Board pipeline={activePipeline} cards={state.cards} users={state.users}
              onCardsChange={handleBoardCardsChange} onCardSave={handleCardSave} onCardDelete={handleCardDelete} />
          )}
          {view.type === 'roadmap' && activePipeline && (
            <YoutubeRoadmap pipeline={activePipeline} cards={state.cards} users={state.users}
              onCardsChange={handleBoardCardsChange} onCardSave={handleCardSave} onCardDelete={handleCardDelete} />
          )}
          {view.type === 'grid' && activePipeline && (
            <ShortformGrid pipeline={activePipeline} cards={state.cards} users={state.users}
              onCardsChange={handleBoardCardsChange} onCardSave={handleCardSave} onCardDelete={handleCardDelete} />
          )}
          {view.type === 'music' && <MusicBank tracks={state.musicBank} onChange={handleMusicChange} />}
          {view.type === 'footage' && <FootageLinks items={state.footageLinks} onChange={handleFootageChange} />}
          {view.type === 'inspiration' && <InspirationProfiles profiles={state.inspirationProfiles} onChange={handleInspirationChange} />}
          {view.type === 'settings' && <PipelineSettings pipelines={state.pipelines} onChange={handlePipelinesChange} />}
          {view.type === 'admin' && (
            <AdminPanel
              hubUsers={state.hubUsers || []}
              pipelines={state.pipelines}
              hub={HUB}
              onChange={handleHubUsersChange}
              onPipelinesChange={handlePipelinesChange}
            />
          )}
        </div>
      </div>

      <nav className="hub-mobile-nav">
        <button className={`hub-mobile-nav-btn${view.type === 'insights' ? ' active' : ''}`} onClick={() => navigate({ type: 'insights' })}>
          <Home size={18} /><span>Home</span>
        </button>
        {state.pipelines.slice(0, 2).map((p: Pipeline) => (
          <button key={p.id} className={`hub-mobile-nav-btn${view.type === 'pipeline' && (view as any).id === p.id ? ' active' : ''}`}
            onClick={() => navigate({ type: 'pipeline', id: p.id })}>
            {isYoutube(p.name) ? <PlaySquare size={18} /> : <Video size={18} />}
            <span>{p.name.length > 6 ? p.name.slice(0, 6) + '…' : p.name}</span>
          </button>
        ))}
        <button className={`hub-mobile-nav-btn${view.type === 'analytics' ? ' active' : ''}`} onClick={() => navigate({ type: 'analytics' })}>
          <TrendingUp size={18} /><span>Stats</span>
        </button>
        <button className="hub-mobile-nav-btn" onClick={() => setSidebarOpen(true)}>
          <Settings size={18} /><span>More</span>
        </button>
      </nav>

      <style>{`@media(max-width:768px){.mobile-menu-btn{display:flex!important}}`}</style>
    </div>
  );
}
