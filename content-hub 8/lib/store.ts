import { AppState, Pipeline, ContentCard, MusicTrack, FootageItem } from './types';

const DEFAULT_STATE: AppState = {
  pipelines: [
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
  ],
  cards: [],
  musicBank: [],
  footageLinks: [],
  users: ['Vainius', 'Danas'],
  inspirationProfiles: [],
};

const STORAGE_KEY = 'content-hub-state';

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export { DEFAULT_STATE };
