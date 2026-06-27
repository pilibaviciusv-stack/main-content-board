'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, LogOut, Clock, X, Check, Upload, Users, Eye, EyeOff } from 'lucide-react';

type HubAccess = { hub_slug: string; status: string };
type HubMeta = { slug: string; label: string; desc: string; logo: string; accentColor: string; };
type UserRow = { id: string; full_name: string; role: string; };
type AccessRow = { user_id: string; hub_slug: string; status: string; };

const DEFAULT_HUBS: HubMeta[] = [
  { slug: 'danas', label: 'Danas', desc: 'Organic AI Dropshipping', logo: '🌿', accentColor: '#22c55e' },
  { slug: 'vainius', label: 'Vainius', desc: 'PlugInfo Agency', logo: '⚡', accentColor: '#e11d48' },
  { slug: 'joris', label: 'Joris', desc: 'Content Strategy', logo: '🎯', accentColor: '#e11d48' },
];

const HUB_SLUGS = ['danas', 'vainius', 'joris'];

export default function LandingPage() {
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [access, setAccess] = useState<HubAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [hubs, setHubs] = useState<HubMeta[]>(DEFAULT_HUBS);

  // Edit modal
  const [editingHub, setEditingHub] = useState<HubMeta | null>(null);
  const [editDraft, setEditDraft] = useState<HubMeta | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Access panel
  const [showAccessPanel, setShowAccessPanel] = useState(false);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [allAccess, setAllAccess] = useState<AccessRow[]>([]);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

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
      if (hubMetaRes.data?.value) setHubs(hubMetaRes.data.value);
      setLoading(false);
    };
    load();
  }, [router]);

  const loadAccessPanel = async () => {
    const [usersRes, accessRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').neq('role', 'admin'),
      supabase.from('hub_access').select('user_id, hub_slug, status'),
    ]);
    setAllUsers(usersRes.data || []);
    setAllAccess(accessRes.data || []);
    setShowAccessPanel(true);
  };

  const getAccessStatus = (userId: string, hubSlug: string): string => {
    return allAccess.find(a => a.user_id === userId && a.hub_slug === hubSlug)?.status || 'hidden';
  };

  const toggleAccess = async (userId: string, hubSlug: string) => {
    const key = `${userId}__${hubSlug}`;
    setTogglingKey(key);
    const current = getAccessStatus(userId, hubSlug);
    // Cycle: hidden → unlocked → locked → hidden
    // hidden = row doesn't exist or status='hidden' (card invisible)
    // unlocked = can open
    // locked = card visible but locked (Request access)
    let next: string;
    if (current === 'hidden' || !allAccess.find(a => a.user_id === userId && a.hub_slug === hubSlug)) {
      next = 'unlocked';
    } else if (current === 'unlocked') {
      next = 'locked';
    } else {
      next = 'hidden';
    }

    if (next === 'hidden') {
      // delete the row
      await supabase.from('hub_access').delete().eq('user_id', userId).eq('hub_slug', hubSlug);
      setAllAccess(prev => prev.filter(a => !(a.user_id === userId && a.hub_slug === hubSlug)));
    } else {
      await supabase.from('hub_access').upsert(
        { user_id: userId, hub_slug: hubSlug, status: next },
        { onConflict: 'user_id,hub_slug' }
      );
      setAllAccess(prev => {
        const filtered = prev.filter(a => !(a.user_id === userId && a.hub_slug === hubSlug));
        return [...filtered, { user_id: userId, hub_slug: hubSlug, status: next }];
      });
    }
    setTogglingKey(null);
  };

  const saveHubMeta = async (updated: HubMeta[]) => {
    await supabase.from('workspace').upsert({ key: 'hub_meta', value: updated });
  };

  const openEdit = (hub: HubMeta) => { setEditingHub(hub); setEditDraft({ ...hub }); };
  const commitEdit = async () => {
    if (!editDraft) return;
    setSaving(true);
    const updated = hubs.map(h => h.slug === editDraft.slug ? editDraft : h);
    setHubs(updated);
    await saveHubMeta(updated);
    setSaving(false);
    setEditingHub(null); setEditDraft(null);
  };
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editDraft) return;
    const reader = new FileReader();
    reader.onload = ev => setEditDraft(d => d ? { ...d, logo: ev.target?.result as string } : d);
    reader.readAsDataURL(file);
  };

  const getStatus = (slug: string) => {
    if (isAdmin) return 'unlocked';
    return access.find(a => a.hub_slug === slug)?.status || 'locked';
  };

  const handleRequest = async (slug: string) => {
    setRequesting(slug);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('hub_access').upsert({ user_id: user.id, hub_slug: slug, status: 'pending' }, { onConflict: 'user_id,hub_slug' });
    setAccess(prev => [...prev.filter(a => a.hub_slug !== slug), { hub_slug: slug, status: 'pending' }]);
    setRequesting(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080a0e' }}>
      <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:18 }}>
        <span style={{ color:'#e11d48' }}>[</span><span style={{ color:'#f1f5f9' }}>PI</span><span style={{ color:'#e11d48' }}>]</span>
      </span>
    </div>
  );

  // Non-admins: only see hubs they have a non-hidden row for
  const visibleHubs = hubs.filter(hub => isAdmin || access.some(a => a.hub_slug === hub.slug));

  const statusColor = (s: string) => s === 'unlocked' || s === 'owner' ? '#22c55e' : s === 'locked' ? '#f59e0b' : '#374151';
  const statusLabel = (s: string) => s === 'unlocked' || s === 'owner' ? 'Open' : s === 'locked' ? 'Locked' : 'Hidden';
  const statusIcon = (s: string) => s === 'unlocked' || s === 'owner' ? <Eye size={13} /> : s === 'locked' ? <Lock size={13} /> : <EyeOff size={13} />;

  return (
    <div style={{ minHeight:'100vh', background:'#080a0e', display:'flex', flexDirection:'column', fontFamily:'system-ui,-apple-system,sans-serif', position:'relative', overflow:'hidden' }}>

      <style>{`
        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(80px,-60px) scale(1.2)}66%{transform:translate(-40px,70px) scale(0.85)}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-70px,80px) scale(1.1)}66%{transform:translate(90px,-40px) scale(0.9)}}
        @keyframes blob3{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(50px,60px) scale(0.88)}66%{transform:translate(-80px,-30px) scale(1.15)}}
        @keyframes blob4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-50px) scale(1.1)}}
        .hub-card:hover{transform:translateY(-2px)}
        .hub-card{transition:all 0.2s ease!important}
        .toggle-btn{transition:all 0.15s ease}
        .toggle-btn:hover{opacity:0.8}
      `}</style>

      {/* Animated blobs */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-15%', left:'-15%', width:'70vw', height:'70vw', background:'radial-gradient(circle, #e11d4814 0%, transparent 65%)', animation:'blob1 14s ease-in-out infinite', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'65vw', height:'65vw', background:'radial-gradient(circle, #be123c10 0%, transparent 65%)', animation:'blob2 18s ease-in-out infinite', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'35%', right:'15%', width:'45vw', height:'45vw', background:'radial-gradient(circle, #e11d480c 0%, transparent 65%)', animation:'blob3 22s ease-in-out infinite', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'10%', right:'40%', width:'30vw', height:'30vw', background:'radial-gradient(circle, #9f123808 0%, transparent 65%)', animation:'blob4 26s ease-in-out infinite', borderRadius:'50%' }} />
      </div>

      {/* Header */}
      <div style={{ padding:'18px 32px', borderBottom:'1px solid #ffffff06', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'#0f1015', border:'1px solid #e11d4833', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px #e11d4818' }}>
            <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:11 }}>
              <span style={{ color:'#e11d48' }}>[</span><span style={{ color:'#f1f5f9' }}>PI</span><span style={{ color:'#e11d48' }}>]</span>
            </span>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.01em' }}>Content Hub</div>
            <div style={{ fontSize:10, color:'#2d3340', fontWeight:500 }}>PlugInfo</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'#374151' }}>{userName}</span>
          {isAdmin && (
            <>
              <span style={{ fontSize:10, background:'#e11d4815', color:'#e11d48', borderRadius:5, padding:'3px 8px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>Admin</span>
              <button onClick={loadAccessPanel}
                style={{ display:'flex', alignItems:'center', gap:6, background:'#1a1c22', border:'1px solid #2a2d36', borderRadius:8, padding:'7px 13px', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                <Users size={13} /> Manage Access
              </button>
            </>
          )}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid #1a1c22', borderRadius:7, padding:'6px 12px', color:'#374151', cursor:'pointer', fontSize:12 }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 32px', position:'relative', zIndex:1 }}>
        <div style={{ marginBottom:52, textAlign:'center' }}>
          <div style={{ fontSize:44, fontFamily:'monospace', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1 }}>
            <span style={{ color:'#e11d48', textShadow:'0 0 50px #e11d4850' }}>[</span>
            <span style={{ color:'#f8fafc' }}>PlugInfo</span>
            <span style={{ color:'#e11d48', textShadow:'0 0 50px #e11d4850' }}>]</span>
          </div>
          <div style={{ marginTop:10, fontSize:10, color:'#2d3340', textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:700 }}>Content Hub</div>
        </div>

        <h1 style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', margin:'0 0 6px', letterSpacing:'-0.02em' }}>Choose a workspace</h1>
        <p style={{ fontSize:13, color:'#2d3340', margin:'0 0 44px' }}>Select a hub to open</p>

        <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center', maxWidth:860 }}>
          {visibleHubs.map(hub => {
            const status = getStatus(hub.slug);
            const isOpen = status === 'owner' || status === 'unlocked';
            const isPending = status === 'pending';
            const isLocked = status === 'locked';
            const accent = hub.accentColor || '#e11d48';
            const isImg = hub.logo?.startsWith('data:') || hub.logo?.startsWith('http');

            return (
              <div key={hub.slug} className="hub-card"
                style={{ width:215, background:'#0c0d1190', backdropFilter:'blur(12px)', border:`1px solid ${isOpen ? accent+'33' : '#1a1c22'}`, borderRadius:18, padding:'26px 22px', cursor:isOpen?'pointer':'default', position:'relative' }}
                onClick={() => isOpen && router.push(`/hub/${hub.slug}`)}>

                {isOpen && <div style={{ position:'absolute', top:14, right:14, width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e99' }} />}
                {isPending && <div style={{ position:'absolute', top:12, right:12 }}><Clock size={11} color="#f59e0b" /></div>}
                {isLocked && <div style={{ position:'absolute', top:12, right:12 }}><Lock size={12} color="#2d3340" /></div>}

                {isAdmin && (
                  <button onClick={e => { e.stopPropagation(); openEdit(hub); }}
                    style={{ position:'absolute', top:12, right: isOpen ? 28 : 12, background:'#1a1c22', border:'1px solid #2a2d36', borderRadius:6, padding:'3px 8px', color:'#4b5563', cursor:'pointer', fontSize:10, fontWeight:600 }}>
                    ✏️ Edit
                  </button>
                )}

                <div style={{ width:54, height:54, background:`${accent}18`, border:`1.5px solid ${accent}30`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, fontSize:isImg?undefined:26, overflow:'hidden' }}>
                  {isImg ? <img src={hub.logo} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : hub.logo}
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:'#f1f5f9', marginBottom:5, letterSpacing:'-0.01em' }}>{hub.label}</div>
                <div style={{ fontSize:11, color:accent, marginBottom:20, fontWeight:500, opacity:0.85 }}>{hub.desc}</div>

                {isOpen && <div style={{ fontSize:12, fontWeight:700, color:accent }}>Open →</div>}
                {isPending && <div style={{ fontSize:12, color:'#f59e0b' }}>Request pending</div>}
                {isLocked && (
                  <button onClick={e => { e.stopPropagation(); handleRequest(hub.slug); }} disabled={requesting===hub.slug}
                    style={{ fontSize:11, color:'#4b5563', background:'#1a1c22', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer' }}>
                    {requesting===hub.slug ? '...' : 'Request access'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding:'14px 32px', borderTop:'1px solid #ffffff04', display:'flex', justifyContent:'center', position:'relative', zIndex:1 }}>
        <span style={{ fontSize:10, color:'#1f2937', fontFamily:'monospace' }}><span style={{ color:'#e11d4833' }}>[PI]</span> PlugInfo Content Hub</span>
      </div>

      {/* ── ACCESS PANEL MODAL ── */}
      {showAccessPanel && (
        <div style={{ position:'fixed', inset:0, background:'#000000cc', backdropFilter:'blur(8px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowAccessPanel(false)}>
          <div style={{ background:'#0f1015', border:'1px solid #1e2130', borderRadius:20, padding:'32px', width:560, maxHeight:'80vh', overflowY:'auto', position:'relative', boxShadow:'0 32px 80px #00000080' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.01em' }}>Manage Access</div>
                <div style={{ fontSize:11, color:'#374151', marginTop:2 }}>Control who can see and open each hub</div>
              </div>
              <button onClick={() => setShowAccessPanel(false)} style={{ background:'#1a1c22', border:'none', borderRadius:8, padding:'6px', cursor:'pointer', color:'#4b5563', display:'flex' }}><X size={15} /></button>
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:16, marginBottom:20, padding:'10px 14px', background:'#080a0e', borderRadius:10, border:'1px solid #1a1c22' }}>
              {[['#22c55e', 'Open', 'Can access the hub'], ['#f59e0b', 'Locked', 'Card visible, no access'], ['#374151', 'Hidden', 'Card not visible at all']].map(([color, label, desc]) => (
                <div key={label as string} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: color as string }} />
                  <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{label as string}</span>
                  <span style={{ fontSize:10, color:'#374151' }}>{desc as string}</span>
                </div>
              ))}
            </div>

            {/* Grid header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(3, 100px)', gap:8, marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.08em' }}>User</div>
              {hubs.map(h => (
                <div key={h.slug} style={{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <span style={{ fontSize:14 }}>{h.logo?.startsWith('data:') || h.logo?.startsWith('http') ? '🖼' : h.logo}</span> {h.label}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'#1a1c22', marginBottom:12 }} />

            {/* User rows */}
            {allUsers.length === 0 && (
              <div style={{ textAlign:'center', color:'#374151', fontSize:13, padding:'24px 0' }}>No non-admin users found</div>
            )}
            {allUsers.map(user => (
              <div key={user.id} style={{ display:'grid', gridTemplateColumns:'1fr repeat(3, 100px)', gap:8, marginBottom:10, alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'#1a1c22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#64748b', flexShrink:0 }}>
                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{user.full_name || 'Unknown'}</div>
                    <div style={{ fontSize:10, color:'#374151' }}>{user.role}</div>
                  </div>
                </div>
                {hubs.map(hub => {
                  const st = getAccessStatus(user.id, hub.slug);
                  const isOwner = st === 'owner';
                  const key = `${user.id}__${hub.slug}`;
                  const isBusy = togglingKey === key;
                  const color = statusColor(st);
                  return (
                    <div key={hub.slug} style={{ display:'flex', justifyContent:'center' }}>
                      <button className="toggle-btn"
                        onClick={() => !isOwner && !isBusy && toggleAccess(user.id, hub.slug)}
                        disabled={isOwner || isBusy}
                        title={isOwner ? "Owner — can't change" : `Click to cycle: ${statusLabel(st)} → next`}
                        style={{
                          display:'flex', alignItems:'center', gap:5,
                          background: `${color}18`,
                          border: `1px solid ${color}44`,
                          borderRadius:8, padding:'6px 10px',
                          color, cursor: isOwner ? 'not-allowed' : 'pointer',
                          fontSize:11, fontWeight:700,
                          opacity: isBusy ? 0.5 : 1,
                          minWidth:80, justifyContent:'center',
                        }}>
                        {isBusy ? '...' : <>{statusIcon(st)} {statusLabel(st)}</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}

            <div style={{ marginTop:20, padding:'12px 14px', background:'#080a0e', borderRadius:10, border:'1px solid #1a1c22' }}>
              <div style={{ fontSize:11, color:'#374151' }}>💡 Click any status badge to cycle: <span style={{ color:'#22c55e' }}>Open</span> → <span style={{ color:'#f59e0b' }}>Locked</span> → <span style={{ color:'#374151' }}>Hidden</span> → <span style={{ color:'#22c55e' }}>Open</span>. Changes apply instantly.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT HUB MODAL ── */}
      {editingHub && editDraft && (
        <div style={{ position:'fixed', inset:0, background:'#000000cc', backdropFilter:'blur(8px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => { setEditingHub(null); setEditDraft(null); }}>
          <div style={{ background:'#0f1015', border:'1px solid #1e2130', borderRadius:20, padding:'32px', width:380, position:'relative', boxShadow:'0 32px 80px #00000080, 0 0 60px #e11d4810' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.01em' }}>Edit Hub Card</div>
                <div style={{ fontSize:11, color:'#374151', marginTop:2 }}>/{editDraft.slug}</div>
              </div>
              <button onClick={() => { setEditingHub(null); setEditDraft(null); }} style={{ background:'#1a1c22', border:'none', borderRadius:8, padding:'6px', cursor:'pointer', color:'#4b5563', display:'flex' }}><X size={15} /></button>
            </div>

            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Logo / Icon</div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:56, height:56, background:`${editDraft.accentColor}18`, border:`1.5px solid ${editDraft.accentColor}33`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, overflow:'hidden', flexShrink:0 }}>
                  {editDraft.logo?.startsWith('data:') || editDraft.logo?.startsWith('http')
                    ? <img src={editDraft.logo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : editDraft.logo}
                </div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                  <input value={editDraft.logo?.startsWith('data:') ? '' : editDraft.logo} onChange={e => setEditDraft(d => d ? { ...d, logo: e.target.value } : d)}
                    placeholder="Paste emoji or image URL"
                    style={{ width:'100%', background:'#080a0e', border:'1px solid #1e2130', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                  <button onClick={() => fileRef.current?.click()}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'#1a1c22', border:'1px solid #2a2d36', borderRadius:8, padding:'8px 12px', color:'#64748b', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    <Upload size={12} /> Upload photo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display:'none' }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Name</label>
              <input value={editDraft.label} onChange={e => setEditDraft(d => d ? { ...d, label: e.target.value } : d)}
                style={{ width:'100%', background:'#080a0e', border:'1px solid #1e2130', borderRadius:8, padding:'10px 12px', color:'#f1f5f9', fontSize:14, fontWeight:700, outline:'none', boxSizing:'border-box' }} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Subheading</label>
              <input value={editDraft.desc} onChange={e => setEditDraft(d => d ? { ...d, desc: e.target.value } : d)}
                style={{ width:'100%', background:'#080a0e', border:'1px solid #1e2130', borderRadius:8, padding:'10px 12px', color:'#f1f5f9', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>

            <div style={{ marginBottom:28 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Accent Color</label>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="color" value={editDraft.accentColor} onChange={e => setEditDraft(d => d ? { ...d, accentColor: e.target.value } : d)}
                  style={{ width:36, height:34, border:'none', borderRadius:8, cursor:'pointer', padding:2, background:'#080a0e' }} />
                <input value={editDraft.accentColor} onChange={e => setEditDraft(d => d ? { ...d, accentColor: e.target.value } : d)}
                  style={{ flex:1, background:'#080a0e', border:'1px solid #1e2130', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13, fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
                {['#e11d48','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#06b6d4'].map(c => (
                  <div key={c} onClick={() => setEditDraft(d => d ? { ...d, accentColor: c } : d)}
                    style={{ width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer', border:editDraft.accentColor===c?'2px solid #fff':'2px solid transparent', flexShrink:0 }} />
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={commitEdit} disabled={saving}
                style={{ flex:1, background:'#e11d48', color:'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 0 20px #e11d4830' }}>
                <Check size={14} /> {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={() => { setEditingHub(null); setEditDraft(null); }}
                style={{ background:'#1a1c22', color:'#64748b', border:'none', borderRadius:10, padding:'12px 18px', fontSize:14, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
