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

export async function loadState(): Promise<AppState> {
  try {
    // Load pipelines
    const { data: pipelineRows } = await supabase
      .from('pipelines')
      .select('*')
      .order('created_at');

    let pipelines: Pipeline[] = pipelineRows && pipelineRows.length > 0
      ? pipelineRows.map(r => ({ id: r.id, name: r.name, stages: r.stages }))
      : DEFAULT_PIPELINES;

    // If no pipelines exist yet, seed them
    if (!pipelineRows || pipelineRows.length === 0) {
      await supabase.from('pipelines').insert(
        DEFAULT_PIPELINES.map(p => ({ id: p.id, name: p.name, stages: p.stages }))
      );
    }

    // Load cards
    const { data: cardRows } = await supabase
      .from('cards')
      .select('*')
      .order('created_at');

    const cards: ContentCard[] = cardRows
      ? cardRows.map(r => ({
          id: r.id,
          pipelineId: r.pipeline_id,
          stageId: r.stage_id,
          title: r.title,
          ...r.data,
        }))
      : [];

    // Load workspace items
    const { data: workspaceRows } = await supabase
      .from('workspace')
      .select('*');

    const ws = (workspaceRows || []).reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
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

export async function savePipelines(pipelines: Pipeline[]) {
  for (const p of pipelines) {
    await supabase.from('pipelines').upsert({ id: p.id, name: p.name, stages: p.stages });
  }
  // Delete removed pipelines
  const { data: existing } = await supabase.from('pipelines').select('id');
  const existingIds = (existing || []).map((r: any) => r.id);
  const currentIds = pipelines.map(p => p.id);
  const toDelete = existingIds.filter((id: string) => !currentIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('pipelines').delete().in('id', toDelete);
  }
}

export async function saveCard(card: ContentCard) {
  const { id, pipelineId, stageId, title, ...rest } = card;
  await supabase.from('cards').upsert({
    id,
    pipeline_id: pipelineId,
    stage_id: stageId,
    title,
    data: rest,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCard(id: string) {
  await supabase.from('cards').delete().eq('id', id);
}

export async function saveWorkspaceKey(key: string, value: any) {
  await supabase.from('workspace').upsert({ key, value });
}
