export type CardType = 'Top of Funnel' | 'Middle of Funnel' | 'Bottom of Funnel';

export interface ContentCard {
  id: string;
  title: string;
  stageId: string;
  pipelineId: string;
  type: CardType;
  editor: string;
  format: string;
  scheduledDate: string;
  cost: string;
  headline: string;
  rawFileLink: string;
  referenceLink: string;
  frameLink: string;
  musicLink: string;
  idea: string;
  hook: string;
  body: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  name: string;
  color: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export interface MusicTrack {
  id: string;
  name: string;
  link: string;
  genre: string;
  notes: string;
}

export interface FootageItem {
  id: string;
  name: string;
  link: string;
  tags: string;
  notes: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  youtubeUrl: string;
  youtubePfp: string;
  youtubeHandle: string;
  instagramUrl: string;
  instagramPfp: string;
  instagramHandle: string;
  notes: string;
  tags: string;
}

export interface AppState {
  pipelines: Pipeline[];
  cards: ContentCard[];
  musicBank: MusicTrack[];
  footageLinks: FootageItem[];
  inspirationProfiles: CreatorProfile[];
  users: string[];
}
