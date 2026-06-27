import { supabase } from './supabase';
import { AppState, Pipeline, ContentCard } from './types';

const DEFAULT_PIPELINES: Pipeline[] = [
  {
    id: 'shortform',
    name: 'Shortform',
    stages: [
      { id: 'sf-ideas', name: 'Ideas', color: '#6366f1' },
      { id: 'sf-approved', name: 'Approved', color: '#8b5cf6' },
      { id: 'sf-ready-film', name: 'Ready to Film', color: '#f59e0b' },
      { id: 'sf-ready-editing', name: 'Ready for Editing', color: '#f97316' },
      { id: 'sf-editing', name: 'Editing', color: '#3b82f6' },
      { id: 'sf-revisions', name: 'Revisions', color: '#ef4444' },
      { id: 'sf-green-light', name: 'Green Light', color: '#22c55e' },
      { id: 'sf-posted', name: 'Posted / Scheduled', color: '#64748b' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    stages: [
      { id: 'yt-ideas', name: 'Ideas', color: '#6366f1' },
      { id: 'yt-approved', name: 'Approved', color: '#8b5cf6' },
      { id: 'yt-planning', name: 'Planning/Scripting', color: '#a855f7' },
      { id: 'yt-ready-film', name: 'Ready to Film', color: '#f59e0b' },
      { id: 'yt-ready-editing', name: 'Ready for Editing', color: '#f97316' },
      { id: 'yt-editing', name: 'Editing', color: '#3b82f6' },
      { id: 'yt-revisions', name: 'Revisions', color: '#ef4444' },
      { id: 'yt-green-light', name: 'Green Light', color: '#22c55e' },
      { id: 'yt-posted', name: 'Posted / Scheduled', color: '#64748b' },
    ],
  },
  {
    id: 'ig-stories',
    name: 'IG Stories',
    stages: [
      { id: 'ig-idea', name: 'Idea', color: '#6366f1' },
      { id: 'ig-approved', name: 'Approved', color: '#8b5cf6' },
      { id: 'ig-ready-post', name: 'Ready to Post', color: '#f59e0b' },
      { id: 'ig-revisions', name: 'Revisions', color: '#ef4444' },
      { id: 'ig-green-light', name: 'Green Light', color: '#22c55e' },
      { id: 'ig-posted', name: 'Posted / Scheduled', color: '#64748b' },
    ],
  },
];

// Prefix IDs with hub slug so each hub has isolated data in the same tables
function scopeId(id: string, hub: string) {
  return `${hub}__${id}`;
}

export async function loadState(hub = 'danas'): Promise<AppState> {
  try {
    const prefix = `${hub}__`;

    // Load pipelines
    const { data: pipelineRows } = await supabase
      .from('pipelines')
      .select('*')
      .like('id', `${prefix}%`)
      .order('created_at');

    let pipelines: Pipeline[];
    if (pipelineRows && pipelineRows.length > 0) {
      pipelines = pipelineRows.map(r => ({
        id: r.id.replace(prefix, ''),
        name: r.name,
        stages: r.stages,
      }));
    } else {
      // Seed default pipelines for this hub
      pipelines = DEFAULT_PIPELINES;
      await supabase.from('pipelines').insert(
        DEFAULT_PIPELINES.map(p => ({
          id: scopeId(p.id, hub),
          name: p.name,
          stages: p.stages,
        }))
      );
    }

    // Load cards
    const { data: cardRows } = await supabase
      .from('cards')
      .select('*')
      .like('id', `${prefix}%`)
      .order('created_at');

    const cards: ContentCard[] = cardRows
      ? cardRows.map(r => ({
          id: r.id,
          pipelineId: r.pipeline_id.replace(prefix, ''),
          stageId: r.stage_id,
          title: r.title,
          ...r.data,
        }))
      : [];

    // Load workspace items
    const { data: workspaceRows } = await supabase
      .from('workspace')
      .select('*')
      .like('key', `${prefix}%`);

    const ws = (workspaceRows || []).reduce((acc: any, row: any) => {
      const shortKey = row.key.replace(prefix, '');
      acc[shortKey] = row.value;
      return acc;
    }, {});

    return {
      pipelines,
      cards,
      musicBank: ws.music_bank || [],
      footageLinks: ws.footage_links || [],
      inspirationProfiles: ws.inspiration_profiles || [],
      users: ['Vainius', 'Danas'],
    };
  } catch (err) {
    console.error('loadState error:', err);
    return {
      pipelines: DEFAULT_PIPELINES,
      cards: [],
      musicBank: [],
      footageLinks: [],
      inspirationProfiles: [],
      users: ['Vainius', 'Danas'],
    };
  }
}

export async function savePipelines(pipelines: Pipeline[], hub = 'danas') {
  const prefix = `${hub}__`;
  for (const p of pipelines) {
    await supabase.from('pipelines').upsert({
      id: scopeId(p.id, hub),
      name: p.name,
      stages: p.stages,
    });
  }
  const { data: existing } = await supabase
    .from('pipelines')
    .select('id')
    .like('id', `${prefix}%`);
  const existingIds = (existing || []).map((r: any) => r.id);
  const currentIds = pipelines.map(p => scopeId(p.id, hub));
  const toDelete = existingIds.filter((id: string) => !currentIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('pipelines').delete().in('id', toDelete);
  }
}

export async function saveCard(card: ContentCard, hub = 'danas') {
  const { id, pipelineId, stageId, title, ...rest } = card;
  await supabase.from('cards').upsert({
    id,
    pipeline_id: scopeId(pipelineId, hub),
    stage_id: stageId,
    title,
    data: rest,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCard(id: string) {
  await supabase.from('cards').delete().eq('id', id);
}

export async function saveWorkspaceKey(key: string, value: any, hub = 'danas') {
  await supabase.from('workspace').upsert({ key: `${hub}__${key}`, value });
}
