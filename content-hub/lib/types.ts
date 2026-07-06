export type CardType = 'Top of Funnel' | 'Middle of Funnel' | 'Bottom of Funnel';

export type PipelineType = 'shortform' | 'youtube' | 'instagram' | 'custom-table';

export interface CustomTableColumn {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  options?: string[]; // for 'select' type
  width?: number;
}

export interface CustomTableRow {
  id: string;
  tableId: string; // pipeline id this belongs to
  values: Record<string, string | boolean>; // columnId -> value
  createdAt: string;
  updatedAt: string;
}

export interface HubUserPermissions {
  pipelineIds: string[];   // which pipelines they can see
  canViewInsights: boolean;
  canViewMusic: boolean;
  canViewFootage: boolean;
  canViewInspiration: boolean;
  isAdmin: boolean;
}

export interface HubUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // simple plain-text for now (no sensitive data)
  hub: string;
  permissions: HubUserPermissions;
  createdAt: string;
}

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
  videoLink: string;
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
  pipelineType?: PipelineType; // defaults to 'shortform' if not set
  columns?: CustomTableColumn[]; // only used when pipelineType === 'custom-table'
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

export interface SopLink {
  id: string;
  name: string;
  link: string;
}

export interface InspirationThumbnail {
  id: string;
  title: string;
  imageUrl: string;
}

export interface InspirationConcept {
  id: string;
  name: string;
  explanation: string;
}

export interface AppState {
  pipelines: Pipeline[];
  cards: ContentCard[];
  musicBank: MusicTrack[];
  footageLinks: FootageItem[];
  inspirationProfiles: CreatorProfile[];
  inspirationThumbnails: InspirationThumbnail[];
  inspirationConcepts: InspirationConcept[];
  sfInspirationProfiles: CreatorProfile[];
  sfInspirationConcepts: InspirationConcept[];
  sops: SopLink[];
  users: string[];
  hubUsers: HubUser[];
  customTableRows: CustomTableRow[];
}
