'use client';
import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Users, Shield, Eye, EyeOff, Layers, Grid3x3, PlayCircle, Camera, Table2 } from 'lucide-react';
import { HubUser, Pipeline, PipelineType } from '@/lib/types';

interface Props {
  hubUsers: HubUser[];
  pipelines: Pipeline[];
  hub: string;
  onChange: (users: HubUser[]) => void;
  onPipelinesChange?: (pipelines: Pipeline[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

const inputStyle: React.CSSProperties = {
  background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 8,
  padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
};

const checkboxStyle: React.CSSProperties = {
  width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer', flexShrink: 0,
};

// Default stages for a shortform clipper pipeline
function makeShortformStages() {
  return [
    { id: generateId(), name: 'Ideas', color: '#6366f1' },
    { id: generateId(), name: 'Approved', color: '#8b5cf6' },
    { id: generateId(), name: 'Ready for Editing', color: '#f97316' },
    { id: generateId(), name: 'Editing', color: '#3b82f6' },
    { id: generateId(), name: 'Green Light', color: '#22c55e' },
    { id: generateId(), name: 'Posted / Scheduled', color: '#64748b' },
  ];
}

function makeYoutubeStages() {
  return [
    { id: generateId(), name: 'Ideas', color: '#6366f1' },
    { id: generateId(), name: 'Approved', color: '#8b5cf6' },
    { id: generateId(), name: 'Scripting', color: '#a855f7' },
    { id: generateId(), name: 'Ready to Film', color: '#f59e0b' },
    { id: generateId(), name: 'Editing', color: '#3b82f6' },
    { id: generateId(), name: 'Green Light', color: '#22c55e' },
    { id: generateId(), name: 'Posted / Scheduled', color: '#64748b' },
  ];
}

function makeInstagramStages() {
  return [
    { id: generateId(), name: 'Idea', color: '#ec4899' },
    { id: generateId(), name: 'Approved', color: '#8b5cf6' },
    { id: generateId(), name: 'Ready to Post', color: '#f59e0b' },
    { id: generateId(), name: 'Posted', color: '#22c55e' },
  ];
}

const PIPELINE_TYPE_OPTIONS: { type: PipelineType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { type: 'shortform', label: 'Shortform', desc: 'Kanban board for Reels, TikToks, Clips', icon: <Grid3x3 size={16} />, color: '#6366f1' },
  { type: 'youtube', label: 'YouTube', desc: 'Kanban + Roadmap timeline view', icon: <PlayCircle size={16} />, color: '#ef4444' },
  { type: 'instagram', label: 'Instagram Grid', desc: 'Visual grid of posts with thumbnails', icon: <Camera size={16} />, color: '#ec4899' },
  { type: 'custom-table', label: 'Custom Table', desc: 'Notion-style table with custom columns', icon: <Table2 size={16} />, color: '#22c55e' },
];

export default function AdminPanel({ hubUsers, pipelines, hub, onChange, onPipelinesChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineType, setNewPipelineType] = useState<PipelineType>('shortform');
  const [addingPipelineForUser, setAddingPipelineForUser] = useState<string | null>(null);
  const [newUserPipelineName, setNewUserPipelineName] = useState('');
  const [newUserPipelineType, setNewUserPipelineType] = useState<PipelineType>('shortform');
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '',
    pipelineIds: [] as string[],
    newPipelineNames: [] as string[], // custom pipeline names to create
    newPipelineTypes: [] as PipelineType[], // type for each new pipeline
    canViewInsights: false, canViewMusic: false,
    canViewFootage: false, canViewInspiration: false,
    isAdmin: false,
  });

  const addUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return;

    // Create any new pipelines for this user
    let updatedPipelines = [...pipelines];
    const newPipelineIds: string[] = [...newUser.pipelineIds];

    for (let i = 0; i < newUser.newPipelineNames.length; i++) {
      const pName = newUser.newPipelineNames[i];
      const pType: PipelineType = newUser.newPipelineTypes[i] || 'shortform';
      if (!pName.trim()) continue;
      const newPipelineId = generateId();
      let stages: { id: string; name: string; color: string }[] = [];
      if (pType === 'youtube') stages = makeYoutubeStages();
      else if (pType === 'instagram') stages = makeInstagramStages();
      else if (pType === 'custom-table') stages = [];
      else stages = makeShortformStages();
      const newPipeline: Pipeline = {
        id: newPipelineId,
        name: pName.trim(),
        stages,
        pipelineType: pType,
        columns: pType === 'custom-table' ? [] : undefined,
      };
      updatedPipelines = [...updatedPipelines, newPipeline];
      newPipelineIds.push(newPipelineId);
    }

    if (onPipelinesChange && newUser.newPipelineNames.some(n => n.trim())) {
      onPipelinesChange(updatedPipelines);
    }

    const user: HubUser = {
      id: generateId(),
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      passwordHash: newUser.password,
      hub,
      permissions: {
        pipelineIds: newPipelineIds,
        canViewInsights: newUser.canViewInsights,
        canViewMusic: newUser.canViewMusic,
        canViewFootage: newUser.canViewFootage,
        canViewInspiration: newUser.canViewInspiration,
        isAdmin: newUser.isAdmin,
      },
      createdAt: new Date().toISOString(),
    };
    onChange([...hubUsers, user]);
    setNewUser({ name: '', email: '', password: '', pipelineIds: [], newPipelineNames: [], newPipelineTypes: [], canViewInsights: false, canViewMusic: false, canViewFootage: false, canViewInspiration: false, isAdmin: false });
    setAdding(false);
  };

  const removeUser = (id: string) => onChange(hubUsers.filter(u => u.id !== id));

  const updateUser = (id: string, updates: Partial<HubUser>) => {
    onChange(hubUsers.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const updatePermissions = (id: string, key: keyof HubUser['permissions'], value: any) => {
    onChange(hubUsers.map(u => u.id === id ? { ...u, permissions: { ...u.permissions, [key]: value } } : u));
  };

  const togglePipelineForUser = (userId: string, pipelineId: string) => {
    const user = hubUsers.find(u => u.id === userId);
    if (!user) return;
    const ids = user.permissions.pipelineIds.includes(pipelineId)
      ? user.permissions.pipelineIds.filter(id => id !== pipelineId)
      : [...user.permissions.pipelineIds, pipelineId];
    updatePermissions(userId, 'pipelineIds', ids);
  };

  const toggleNewPipeline = (pipelineId: string) => {
    setNewUser(prev => ({
      ...prev,
      pipelineIds: prev.pipelineIds.includes(pipelineId)
        ? prev.pipelineIds.filter(id => id !== pipelineId)
        : [...prev.pipelineIds, pipelineId],
    }));
  };

  const addNewPipelineToUser = () => {
    const name = newPipelineName.trim();
    if (!name) return;
    setNewUser(prev => ({
      ...prev,
      newPipelineNames: [...prev.newPipelineNames, name],
      newPipelineTypes: [...prev.newPipelineTypes, newPipelineType],
    }));
    setNewPipelineName('');
    setNewPipelineType('shortform');
  };

  const removeNewPipelineName = (idx: number) => {
    setNewUser(prev => ({
      ...prev,
      newPipelineNames: prev.newPipelineNames.filter((_, i) => i !== idx),
      newPipelineTypes: prev.newPipelineTypes.filter((_, i) => i !== idx),
    }));
  };

  const permLabel = (label: string, checked: boolean, onChange: () => void) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={checkboxStyle} />
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
    </label>
  );

  // Add pipeline directly to existing user
  const addPipelineForExistingUser = (userId: string, pipelineName: string, pType: PipelineType = 'shortform') => {
    if (!pipelineName.trim() || !onPipelinesChange) return;
    const newPipelineId = generateId();
    let stages;
    if (pType === 'youtube') stages = makeYoutubeStages();
    else if (pType === 'instagram') stages = makeInstagramStages();
    else if (pType === 'custom-table') stages = [];
    else stages = makeShortformStages();
    const newPipeline: Pipeline = {
      id: newPipelineId,
      name: pipelineName.trim(),
      stages,
      pipelineType: pType,
      columns: pType === 'custom-table' ? [] : undefined,
    };
    onPipelinesChange([...pipelines, newPipeline]);
    const user = hubUsers.find(u => u.id === userId);
    if (!user) return;
    const ids = [...user.permissions.pipelineIds, newPipelineId];
    updatePermissions(userId, 'pipelineIds', ids);
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} color="#6366f1" /> Team Access
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Create logins for editors, clippers, or anyone who needs access to specific parts of this hub.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add Member
        </button>
      </div>

      {/* Add user form */}
      {adding && (
        <div style={{ background: '#13151e', border: '1px solid #6366f1', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>New Hub Member</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Name</label>
              <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="e.g. Clipper1" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Email / Login</label>
              <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="clipper@example.com" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} style={inputStyle} placeholder="Set a password..." />
          </div>

          {/* Existing pipelines */}
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Existing Pipeline Access</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {pipelines.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: newUser.pipelineIds.includes(p.id) ? '#6366f122' : '#1a1d26', border: `1px solid ${newUser.pipelineIds.includes(p.id) ? '#6366f1' : '#2d3148'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="checkbox" checked={newUser.pipelineIds.includes(p.id)} onChange={() => toggleNewPipeline(p.id)} style={checkboxStyle} />
                <span style={{ fontSize: 13, color: newUser.pipelineIds.includes(p.id) ? '#a5b4fc' : '#94a3b8' }}>{p.name}</span>
              </label>
            ))}
          </div>

          {/* Create new custom pipelines */}
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Create New Pipeline for This Member</div>

          {/* Pipeline type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {PIPELINE_TYPE_OPTIONS.map(opt => (
              <label key={opt.type} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                background: newPipelineType === opt.type ? `${opt.color}18` : '#1a1d26',
                border: `1px solid ${newPipelineType === opt.type ? opt.color : '#2d3148'}`,
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="new-pipeline-type" checked={newPipelineType === opt.type} onChange={() => setNewPipelineType(opt.type)} style={{ display: 'none' }} />
                <span style={{ color: newPipelineType === opt.type ? opt.color : '#475569' }}>{opt.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: newPipelineType === opt.type ? '#e2e8f0' : '#64748b' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={newPipelineName}
              onChange={e => setNewPipelineName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNewPipelineToUser()}
              style={{ ...inputStyle, flex: 1 }}
              placeholder={`e.g. ${newPipelineType === 'custom-table' ? 'Raw Ideas' : newPipelineType === 'youtube' ? 'YouTube Main' : newPipelineType === 'instagram' ? 'IG Feed' : 'Shortform Clipper1'}`}
            />
            <button onClick={addNewPipelineToUser}
              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <Plus size={14} />
            </button>
          </div>
          {newUser.newPipelineNames.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {newUser.newPipelineNames.map((name, idx) => {
                const pType = newUser.newPipelineTypes[idx] || 'shortform';
                const typeOpt = PIPELINE_TYPE_OPTIONS.find(o => o.type === pType);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${typeOpt?.color || '#22c55e'}18`, border: `1px solid ${typeOpt?.color || '#22c55e'}44`, borderRadius: 8, padding: '4px 10px' }}>
                    <span style={{ color: typeOpt?.color || '#4ade80' }}>{typeOpt?.icon}</span>
                    <span style={{ fontSize: 12, color: typeOpt?.color || '#4ade80' }}>{name}</span>
                    <button onClick={() => removeNewPipelineName(idx)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Section Access</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {permLabel('Insights', newUser.canViewInsights, () => setNewUser(p => ({ ...p, canViewInsights: !p.canViewInsights })))}
            {permLabel('Music Bank', newUser.canViewMusic, () => setNewUser(p => ({ ...p, canViewMusic: !p.canViewMusic })))}
            {permLabel('Footage Links', newUser.canViewFootage, () => setNewUser(p => ({ ...p, canViewFootage: !p.canViewFootage })))}
            {permLabel('Inspiration', newUser.canViewInspiration, () => setNewUser(p => ({ ...p, canViewInspiration: !p.canViewInspiration })))}
            {permLabel('Admin Access', newUser.isAdmin, () => setNewUser(p => ({ ...p, isAdmin: !p.isAdmin })))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setAdding(false); setNewPipelineName(''); }}
              style={{ background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={addUser}
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Create Member
            </button>
          </div>
        </div>
      )}

      {hubUsers.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#475569' }}>No team members yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Add editors, clippers or collaborators and control exactly what they can see.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hubUsers.map(user => (
            <div key={user.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === user.id ? null : user.id)}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#6366f122', border: '1px solid #6366f133', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>{user.name[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{user.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {user.permissions.isAdmin && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: '#f59e0b18', padding: '2px 8px', borderRadius: 4 }}>ADMIN</span>
                  )}
                  {user.permissions.pipelineIds.map(pid => {
                    const p = pipelines.find(pl => pl.id === pid);
                    return p ? (
                      <span key={pid} style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', background: '#6366f118', padding: '2px 8px', borderRadius: 4 }}>{p.name}</span>
                    ) : null;
                  })}
                </div>
                {expanded === user.id ? <ChevronDown size={16} color="#475569" /> : <ChevronRight size={16} color="#475569" />}
                <button onClick={e => { e.stopPropagation(); removeUser(user.id); }}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {expanded === user.id && (
                <div style={{ borderTop: '1px solid #1e2130', padding: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Name</label>
                      <input value={user.name} onChange={e => updateUser(user.id, { name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Email</label>
                      <input value={user.email} onChange={e => updateUser(user.id, { email: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd[user.id] ? 'text' : 'password'} value={user.passwordHash}
                        onChange={e => updateUser(user.id, { passwordHash: e.target.value })}
                        style={{ ...inputStyle, paddingRight: 40 }} />
                      <button onClick={() => setShowPwd(p => ({ ...p, [user.id]: !p[user.id] }))}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0 }}>
                        {showPwd[user.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pipeline Access</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {pipelines.map(p => {
                      const hasAccess = user.permissions.pipelineIds.includes(p.id);
                      return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: hasAccess ? '#6366f122' : '#1a1d26', border: `1px solid ${hasAccess ? '#6366f1' : '#2d3148'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <input type="checkbox" checked={hasAccess} onChange={() => togglePipelineForUser(user.id, p.id)} style={checkboxStyle} />
                          <span style={{ fontSize: 13, color: hasAccess ? '#a5b4fc' : '#94a3b8' }}>{p.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Add new pipeline for this existing user */}
                  {onPipelinesChange && (
                    <div style={{ marginBottom: 14 }}>
                      {addingPipelineForUser !== user.id ? (
                        <button onClick={() => setAddingPipelineForUser(user.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1d26', border: '1px dashed #2d3148', borderRadius: 8, padding: '6px 12px', color: '#475569', cursor: 'pointer', fontSize: 12 }}>
                          <Plus size={12} /> Create new pipeline for this member
                        </button>
                      ) : (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
                            {PIPELINE_TYPE_OPTIONS.map(opt => (
                              <label key={opt.type} style={{
                                display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                                background: newUserPipelineType === opt.type ? `${opt.color}18` : '#0d0f14',
                                border: `1px solid ${newUserPipelineType === opt.type ? opt.color : '#1e2130'}`,
                                transition: 'all 0.15s',
                              }}>
                                <input type="radio" name={`pipeline-type-${user.id}`} checked={newUserPipelineType === opt.type} onChange={() => setNewUserPipelineType(opt.type)} style={{ display: 'none' }} />
                                <span style={{ color: newUserPipelineType === opt.type ? opt.color : '#475569' }}>{opt.icon}</span>
                                <div style={{ fontSize: 11, fontWeight: 700, color: newUserPipelineType === opt.type ? '#e2e8f0' : '#64748b' }}>{opt.label}</div>
                              </label>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={newUserPipelineName}
                              onChange={e => setNewUserPipelineName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { addPipelineForExistingUser(user.id, newUserPipelineName, newUserPipelineType); setNewUserPipelineName(''); setNewUserPipelineType('shortform'); setAddingPipelineForUser(null); } }}
                              style={{ ...inputStyle, flex: 1 }}
                              placeholder={newUserPipelineType === 'custom-table' ? 'e.g. Raw Ideas' : 'e.g. Clipper2'}
                              autoFocus
                            />
                            <button onClick={() => { addPipelineForExistingUser(user.id, newUserPipelineName, newUserPipelineType); setNewUserPipelineName(''); setNewUserPipelineType('shortform'); setAddingPipelineForUser(null); }}
                              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add</button>
                            <button onClick={() => { setAddingPipelineForUser(null); setNewUserPipelineName(''); setNewUserPipelineType('shortform'); }}
                              style={{ background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Section Access</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {permLabel('Insights', user.permissions.canViewInsights, () => updatePermissions(user.id, 'canViewInsights', !user.permissions.canViewInsights))}
                    {permLabel('Music Bank', user.permissions.canViewMusic, () => updatePermissions(user.id, 'canViewMusic', !user.permissions.canViewMusic))}
                    {permLabel('Footage Links', user.permissions.canViewFootage, () => updatePermissions(user.id, 'canViewFootage', !user.permissions.canViewFootage))}
                    {permLabel('Inspiration', user.permissions.canViewInspiration, () => updatePermissions(user.id, 'canViewInspiration', !user.permissions.canViewInspiration))}
                    {permLabel('Admin Access', user.permissions.isAdmin, () => updatePermissions(user.id, 'isAdmin', !user.permissions.isAdmin))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
