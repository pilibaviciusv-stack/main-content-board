'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, LogOut, Clock, Edit2, Check, X, Upload } from 'lucide-react';

type HubAccess = { hub_slug: string; status: string };

type HubMeta = {
  slug: string;
  label: string;
  desc: string;
  logo: string; // emoji or image URL
  accentColor: string;
};

const DEFAULT_HUBS: HubMeta[] = [
  { slug: 'danas', label: 'Danas', desc: 'Organic AI Dropshipping', logo: '🌿', accentColor: '#22c55e' },
  { slug: 'vainius', label: 'Vainius', desc: 'PlugInfo Agency', logo: '⚡', accentColor: '#e11d48' },
  { slug: 'joris', label: 'Joris', desc: 'Content Strategy', logo: '🎯', accentColor: '#e11d48' },
];

const PI_LOGO = () => (
  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 15, letterSpacing: '-0.02em' }}>
    <span style={{ color: '#e11d48' }}>[</span>
    <span style={{ color: '#fff' }}>PI</span>
    <span style={{ color: '#e11d48' }}>]</span>
  </span>
);

export default function LandingPage() {
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [access, setAccess] = useState<HubAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [hubs, setHubs] = useState<HubMeta[]>(DEFAULT_HUBS);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<HubMeta>>({});
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const userId = session.user.id;

      const [profRes, accRes, hubMetaRes] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', userId).single(),
        supabase.from('hub_access').select('hub_slug, status').eq('user_id', userId),
        supabase.from('workspace').select('value').eq('key', 'hub_meta').single(),
      ]);

      setUserName(profRes.data?.full_name || session.user.email || '');
      setIsAdmin(profRes.data?.role === 'admin');
      setAccess(accRes.data || []);

      if (hubMetaRes.data?.value) {
        setHubs(hubMetaRes.data.value);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const saveHubMeta = async (updated: HubMeta[]) => {
    await supabase.from('workspace').upsert({ key: 'hub_meta', value: updated });
  };

  const startEdit = (hub: HubMeta) => {
    setEditingSlug(hub.slug);
    setEditDraft({ label: hub.label, desc: hub.desc, logo: hub.logo, accentColor: hub.accentColor });
  };

  const commitEdit = async (slug: string) => {
    const updated = hubs.map(h => h.slug === slug ? { ...h, ...editDraft } : h);
    setHubs(updated);
    setEditingSlug(null);
    await saveHubMeta(updated);
  };

  const cancelEdit = () => { setEditingSlug(null); setEditDraft({}); };

  const getStatus = (slug: string) => {
    if (isAdmin) return 'unlocked';
    return access.find(a => a.hub_slug === slug)?.status || 'locked';
  };

  const handleRequest = async (slug: string) => {
    setRequesting(slug);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('hub_access').upsert(
      { user_id: user.id, hub_slug: slug, status: 'pending' },
      { onConflict: 'user_id,hub_slug' }
    );
    setAccess(prev => [...prev.filter(a => a.hub_slug !== slug), { hub_slug: slug, status: 'pending' }]);
    setRequesting(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080a0e' }}>
      <PI_LOGO />
    </div>
  );

  const visibleHubs = hubs.filter(hub => {
    if (isAdmin) return true;
    return access.some(a => a.hub_slug === hub.slug);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '18px 32px', borderBottom: '1px solid #18191f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PI_LOGO />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Content Hub</div>
            <div style={{ fontSize: 10, color: '#374151', fontWeight: 500 }}>PlugInfo</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: '#4b5563' }}>{userName}</span>
          {isAdmin && (
            <span style={{ fontSize: 10, background: '#e11d4815', color: '#e11d48', borderRadius: 5, padding: '3px 7px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin</span>
          )}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #18191f', borderRadius: 7, padding: '6px 12px', color: '#4b5563', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>

        {/* Big PI logo */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 42, fontFamily: 'monospace', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
            <span style={{ color: '#e11d48', textShadow: '0 0 40px #e11d4844' }}>[</span>
            <span style={{ color: '#f8fafc' }}>PlugInfo</span>
            <span style={{ color: '#e11d48', textShadow: '0 0 40px #e11d4844' }}>]</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Content Hub</div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px', textAlign: 'center', letterSpacing: '-0.02em' }}>Choose a workspace</h1>
        <p style={{ fontSize: 13, color: '#374151', margin: '0 0 44px', textAlign: 'center' }}>Select a hub to open</p>

        {/* Hub cards */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 820 }}>
          {visibleHubs.map(hub => {
            const status = getStatus(hub.slug);
            const isOpen = status === 'owner' || status === 'unlocked';
            const isPending = status === 'pending';
            const isLocked = status === 'locked';
            const isEditing = editingSlug === hub.slug;
            const accent = hub.accentColor || '#e11d48';

            return (
              <div key={hub.slug}
                style={{
                  width: 210,
                  background: '#0c0d11',
                  border: `1px solid ${isOpen ? accent + '44' : '#18191f'}`,
                  borderRadius: 16,
                  padding: '24px 20px',
                  cursor: isOpen && !isEditing ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative',
                  boxShadow: isOpen ? `0 0 0 0px ${accent}22, inset 0 0 30px ${accent}08` : 'none',
                }}
                onClick={() => isOpen && !isEditing && router.push(`/hub/${hub.slug}`)}
              >
                {/* Status indicator */}
                {isOpen && !isEditing && <div style={{ position: 'absolute', top: 12, right: 12, width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e88' }} />}
                {isPending && <div style={{ position: 'absolute', top: 11, right: 11 }}><Clock size={11} color="#f59e0b" /></div>}
                {isLocked && <div style={{ position: 'absolute', top: 11, right: 11 }}><Lock size={12} color="#374151" /></div>}

                {/* Admin edit button */}
                {isAdmin && !isEditing && (
                  <button
                    onClick={e => { e.stopPropagation(); startEdit(hub); }}
                    style={{ position: 'absolute', top: 10, right: isOpen ? 26 : 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#374151', opacity: 0.5 }}
                  >
                    <Edit2 size={11} />
                  </button>
                )}

                {/* Logo */}
                <div style={{ marginBottom: 16 }}>
                  {isEditing ? (
                    <input
                      value={editDraft.logo || ''}
                      onChange={e => setEditDraft(d => ({ ...d, logo: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      placeholder="emoji or URL"
                      style={{ width: '100%', background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 7, padding: '6px 8px', color: '#f1f5f9', fontSize: 12, outline: 'none' }}
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48,
                      background: `${accent}18`,
                      border: `1.5px solid ${accent}33`,
                      borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: hub.logo?.startsWith('http') ? undefined : 24,
                      overflow: 'hidden',
                    }}>
                      {hub.logo?.startsWith('http')
                        ? <img src={hub.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : hub.logo}
                    </div>
                  )}
                </div>

                {/* Label */}
                {isEditing ? (
                  <input
                    value={editDraft.label || ''}
                    onChange={e => setEditDraft(d => ({ ...d, label: e.target.value }))}
                    onClick={e => e.stopPropagation()}
                    placeholder="Name"
                    style={{ width: '100%', background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 7, padding: '6px 8px', color: '#f1f5f9', fontSize: 14, fontWeight: 700, outline: 'none', marginBottom: 6 }}
                  />
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.01em' }}>{hub.label}</div>
                )}

                {/* Desc */}
                {isEditing ? (
                  <input
                    value={editDraft.desc || ''}
                    onChange={e => setEditDraft(d => ({ ...d, desc: e.target.value }))}
                    onClick={e => e.stopPropagation()}
                    placeholder="Subheading"
                    style={{ width: '100%', background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 7, padding: '6px 8px', color: '#6b7280', fontSize: 11, outline: 'none', marginBottom: 12 }}
                  />
                ) : (
                  <div style={{ fontSize: 11, color: accent, marginBottom: 18, fontWeight: 500 }}>{hub.desc}</div>
                )}

                {/* Accent color picker (edit mode) */}
                {isEditing && (
                  <div style={{ marginBottom: 12 }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 4 }}>Accent color</div>
                    <input type="color" value={editDraft.accentColor || '#e11d48'}
                      onChange={e => setEditDraft(d => ({ ...d, accentColor: e.target.value }))}
                      style={{ width: '100%', height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }}
                    />
                  </div>
                )}

                {/* Actions */}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => commitEdit(hub.slug)} style={{ flex: 1, background: '#e11d48', color: '#fff', border: 'none', borderRadius: 7, padding: '7px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Check size={12} /> Save
                    </button>
                    <button onClick={cancelEdit} style={{ flex: 1, background: '#18191f', color: '#6b7280', border: 'none', borderRadius: 7, padding: '7px', cursor: 'pointer', fontSize: 12 }}>
                      Cancel
                    </button>
                  </div>
                ) : isOpen ? (
                  <div style={{ fontSize: 12, fontWeight: 600, color: accent }}>Open →</div>
                ) : isPending ? (
                  <div style={{ fontSize: 12, color: '#f59e0b' }}>Request pending</div>
                ) : isLocked ? (
                  <button
                    onClick={e => { e.stopPropagation(); handleRequest(hub.slug); }}
                    disabled={requesting === hub.slug}
                    style={{ fontSize: 11, color: '#4b5563', background: '#18191f', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {requesting === hub.slug ? '...' : 'Request access'}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 32px', borderTop: '1px solid #18191f', display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, color: '#1f2937', fontFamily: 'monospace' }}>
          <span style={{ color: '#e11d4844' }}>[PI]</span> PlugInfo · PlugInfo
        </span>
      </div>
    </div>
  );
}
