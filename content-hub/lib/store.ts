import { supabase } from './supabase';
import { AppState, Pipeline, ContentCard, HubUser, CustomTableRow } from './types';

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

// Danas uses legacy unprefixed IDs for backwards compatibility.
// All other hubs use hub__ prefix.
const DANAS_LEGACY = true;

function dbPipelineId(pipelineId: string, hub: string): string {
  if (hub === 'danas') return pipelineId; // legacy: no prefix
  return `${hub}__${pipelineId}`;
}

function appPipelineId(dbId: string, hub: string): string {
  if (hub === 'danas') return dbId;
  return dbId.replace(`${hub}__`, '');
}

function wsKey(key: string, hub: string): string {
  if (hub === 'danas') return key; // legacy: no prefix
  return `${hub}__${key}`;
}

export async function loadState(hub = 'danas'): Promise<AppState> {
  try {
    let pipelineRows: any[] | null = null;

    if (hub === 'danas') {
      // Load ALL pipelines that don't have a hub__ prefix (legacy danas pipelines + any new ones created for danas)
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .not('id', 'like', 'joris__%')
        .not('id', 'like', 'vainius__%')
        .order('created_at');
      pipelineRows = data;
    } else {
      const prefix = `${hub}__`;
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .like('id', `${prefix}%`)
        .order('created_at');
      pipelineRows = data;
    }

    let pipelines: Pipeline[];
    if (pipelineRows && pipelineRows.length > 0) {
      pipelines = pipelineRows.map(r => ({
        id: appPipelineId(r.id, hub),
        name: r.name,
        stages: r.stages,
        pipelineType: r.pipeline_type ?? undefined,
        columns: r.columns || undefined,
      }));
    } else {
      pipelines = DEFAULT_PIPELINES;
      await supabase.from('pipelines').insert(
        DEFAULT_PIPELINES.map(p => ({
          id: dbPipelineId(p.id, hub),
          name: p.name,
          stages: p.stages,
        }))
      );
    }

    // Load cards
    let cardRows: any[] | null = null;
    if (hub === 'danas') {
      // Load cards for ALL danas pipelines (no hub prefix)
      const { data } = await supabase
        .from('cards')
        .select('*')
        .not('pipeline_id', 'like', 'joris__%')
        .not('pipeline_id', 'like', 'vainius__%')
        .order('created_at');
      cardRows = data;
    } else {
      const prefix = `${hub}__`;
      const { data } = await supabase
        .from('cards')
        .select('*')
        .like('pipeline_id', `${prefix}%`)
        .order('created_at');
      cardRows = data;
    }

    const cards: ContentCard[] = cardRows
      ? cardRows.map(r => ({
          id: r.id,
          pipelineId: appPipelineId(r.pipeline_id, hub),
          stageId: r.stage_id,
          title: r.title,
          ...r.data,
        }))
      : [];

    // Load workspace
    let workspaceRows: any[] | null = null;
    if (hub === 'danas') {
      // Danas uses unprefixed keys (legacy). Fetch all and filter client-side.
      const { data } = await supabase
        .from('workspace')
        .select('*');
      // Only keep rows without __ prefix (danas keys)
      workspaceRows = (data || []).filter((r: any) => !r.key.includes('__'));
    } else {
      const prefix = `${hub}__`;
      const { data } = await supabase
        .from('workspace')
        .select('*')
        .like('key', `${prefix}%`);
      workspaceRows = data;
    }

    const ws = (workspaceRows || []).reduce((acc: any, row: any) => {
      const shortKey = hub === 'danas' ? row.key : row.key.replace(`${hub}__`, '');
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
      hubUsers: ws.hub_users || [],
      customTableRows: ws.custom_table_rows || [],
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
      hubUsers: [],
      customTableRows: [],
    };
  }
}

export async function savePipelines(pipelines: Pipeline[], hub = 'danas') {
  for (const p of pipelines) {
    const row: any = {
      id: dbPipelineId(p.id, hub),
      name: p.name,
      stages: p.stages,
      columns: p.columns || null,
    };
    // Only set pipeline_type if explicitly defined — never overwrite with null
    if (p.pipelineType !== undefined) {
      row.pipeline_type = p.pipelineType;
    }
    await supabase.from('pipelines').upsert(row);
  }
  // Delete removed pipelines scoped to this hub
  if (hub === 'danas') {
    // Load ALL danas pipelines (no hub prefix, excluding other hubs)
    const { data: existing } = await supabase
      .from('pipelines')
      .select('id')
      .not('id', 'like', 'joris__%')
      .not('id', 'like', 'vainius__%');
    const existingIds = (existing || []).map((r: any) => r.id);
    const currentIds = pipelines.map(p => p.id); // danas uses raw id (no prefix)
    const toDelete = existingIds.filter((id: string) => !currentIds.includes(id));
    if (toDelete.length > 0) await supabase.from('pipelines').delete().in('id', toDelete);
  } else {
    const pfx = `${hub}__`;
    const { data: existing } = await supabase.from('pipelines').select('id').like('id', `${pfx}%`);
    const existingIds = (existing || []).map((r: any) => r.id);
    const currentIds = pipelines.map(p => dbPipelineId(p.id, hub));
    const toDelete = existingIds.filter((id: string) => !currentIds.includes(id));
    if (toDelete.length > 0) await supabase.from('pipelines').delete().in('id', toDelete);
  }
}

export async function saveCard(card: ContentCard, hub = 'danas') {
  const { id, pipelineId, stageId, title, ...rest } = card;
  await supabase.from('cards').upsert({
    id,
    pipeline_id: dbPipelineId(pipelineId, hub),
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
  await supabase.from('workspace').upsert({ key: wsKey(key, hub), value });
}

export async function saveHubUsers(hubUsers: HubUser[], hub = 'danas') {
  await saveWorkspaceKey('hub_users', hubUsers, hub);
}

export async function saveCustomTableRows(rows: CustomTableRow[], hub = 'danas') {
  await saveWorkspaceKey('custom_table_rows', rows, hub);
}
