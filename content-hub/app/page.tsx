'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutGrid, Lock, LogOut, Clock } from 'lucide-react';

type HubAccess = { hub_slug: string; status: string };
type Profile = { full_name: string; role: string };

const HUBS = [
  { slug: 'danas', label: 'Danas', emoji: '🌿', desc: 'Organic AI Dropshipping' },
  { slug: 'vainius', label: 'Vainius', emoji: '⚡', desc: 'Vabanque Agency' },
  { slug: 'joris', label: 'Joris', emoji: '🎯', desc: 'Content Strategy' },
];

export default function LandingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [access, setAccess] = useState<HubAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const [{ data: prof }, { data: acc }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').single(),
        supabase.from('hub_access').select('hub_slug, status'),
      ]);

      setProfile(prof);
      setAccess(acc || []);
      setLoading(false);
    };
    load();
  }, []);

  const getStatus = (slug: string) => {
    if (profile?.role === 'admin') return 'unlocked';
    return access.find(a => a.hub_slug === slug)?.status || 'locked';
  };

  const handleRequest = async (slug: string) => {
    setRequesting(slug);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('hub_access').upsert({ user_id: user!.id, hub_slug: slug, status: 'pending' });
    setAccess(prev => [...prev.filter(a => a.hub_slug !== slug), { hub_slug: slug, status: 'pending' }]);
    setRequesting(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d0f14' }}>
      <div style={{ color: '#475569', fontSize: 14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Content Hub</div>
            <div style={{ fontSize: 11, color: '#475569' }}>Vabanque</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>{profile?.full_name}</span>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #1e2130', borderRadius: 8, padding: '7px 12px', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px', textAlign: 'center' }}>Choose a workspace</h1>
        <p style={{ fontSize: 14, color: '#475569', margin: '0 0 48px', textAlign: 'center' }}>Select a hub to open</p>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
          {HUBS.map(hub => {
            const status = getStatus(hub.slug);
            const isOpen = status === 'owner' || status === 'unlocked';
            const isPending = status === 'pending';
            const isLocked = status === 'locked';

            return (
              <div key={hub.slug} style={{
                width: 220, background: '#0a0c11',
                border: `1px solid ${isOpen ? '#6366f1' : '#1e2130'}`,
                borderRadius: 16, padding: '28px 24px',
                cursor: isOpen ? 'pointer' : 'default',
                transition: 'all 0.2s',
                opacity: isLocked || isPending ? 0.7 : 1,
                position: 'relative',
              }}
                onClick={() => isOpen && router.push(`/hub/${hub.slug}`)}
              >
                {/* Status badge */}
                {isOpen && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                )}
                {isPending && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} color="#f59e0b" />
                  </div>
                )}
                {isLocked && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <Lock size={13} color="#475569" />
                  </div>
                )}

                <div style={{ fontSize: 36, marginBottom: 16 }}>{hub.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{hub.label}</div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>{hub.desc}</div>

                {isOpen && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>Open →</div>
                )}
                {isPending && (
                  <div style={{ fontSize: 12, color: '#f59e0b' }}>Request pending</div>
                )}
                {isLocked && (
                  <button
                    onClick={e => { e.stopPropagation(); handleRequest(hub.slug); }}
                    disabled={requesting === hub.slug}
                    style={{ fontSize: 12, color: '#64748b', background: '#1e2130', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
                  >
                    {requesting === hub.slug ? '...' : 'Request access'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
