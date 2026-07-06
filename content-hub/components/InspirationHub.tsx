'use client';
import { useState } from 'react';
import { Users, Image as ImageIcon, Lightbulb, Film, Play } from 'lucide-react';
import { CreatorProfile, InspirationThumbnail, InspirationConcept } from '@/lib/types';
import InspirationProfiles from './InspirationProfiles';
import ThumbnailGallery from './ThumbnailGallery';
import ConceptsList from './ConceptsList';

interface Props {
  // YouTube inspiration
  profiles: CreatorProfile[];
  onProfilesChange: (profiles: CreatorProfile[]) => void;
  thumbnails: InspirationThumbnail[];
  onThumbnailsChange: (thumbnails: InspirationThumbnail[]) => void;
  concepts: InspirationConcept[];
  onConceptsChange: (concepts: InspirationConcept[]) => void;
  // Shortform inspiration
  sfProfiles: CreatorProfile[];
  onSfProfilesChange: (profiles: CreatorProfile[]) => void;
  sfConcepts: InspirationConcept[];
  onSfConceptsChange: (concepts: InspirationConcept[]) => void;
}

type TopTab = 'shortform' | 'youtube';
type SubTab = 'creators' | 'thumbnails' | 'concepts';

export default function InspirationHub({
  profiles, onProfilesChange,
  thumbnails, onThumbnailsChange,
  concepts, onConceptsChange,
  sfProfiles, onSfProfilesChange,
  sfConcepts, onSfConceptsChange,
}: Props) {
  const [topTab, setTopTab] = useState<TopTab>('shortform');
  const [ytSubTab, setYtSubTab] = useState<SubTab>('creators');
  const [sfSubTab, setSfSubTab] = useState<SubTab>('creators');

  const topTabBtn = (tab: TopTab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTopTab(tab)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: topTab === tab ? '#6366f1' : 'transparent',
        border: `1px solid ${topTab === tab ? '#6366f1' : '#2d3148'}`,
        color: topTab === tab ? '#fff' : '#94a3b8',
        borderRadius: 10, padding: '9px 20px', cursor: 'pointer',
        fontSize: 14, fontWeight: topTab === tab ? 600 : 400,
        transition: 'all 0.15s ease',
      }}
    >
      {icon} {label}
    </button>
  );

  const subTabBtn = (tab: SubTab, label: string, icon: React.ReactNode, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: active ? '#1e2130' : 'none',
        border: `1px solid ${active ? '#6366f1' : '#1e2130'}`,
        color: active ? '#e2e8f0' : '#64748b',
        borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
        fontSize: 13, fontWeight: active ? 600 : 400,
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div>
      {/* Top-level tabs: Shortform / YouTube */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }}>
        {topTabBtn('shortform', 'Shortform', <Film size={15} />)}
        {topTabBtn('youtube', 'YouTube', <Play size={15} />)}
      </div>

      {/* Sub-tabs row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }}>
        {topTab === 'shortform' && (
          <>
            {subTabBtn('creators', 'Creators', <Users size={14} />, sfSubTab === 'creators', () => setSfSubTab('creators'))}
            {subTabBtn('concepts', 'Concepts', <Lightbulb size={14} />, sfSubTab === 'concepts', () => setSfSubTab('concepts'))}
          </>
        )}
        {topTab === 'youtube' && (
          <>
            {subTabBtn('creators', 'Creators', <Users size={14} />, ytSubTab === 'creators', () => setYtSubTab('creators'))}
            {subTabBtn('thumbnails', 'Thumbnails', <ImageIcon size={14} />, ytSubTab === 'thumbnails', () => setYtSubTab('thumbnails'))}
            {subTabBtn('concepts', 'Concepts', <Lightbulb size={14} />, ytSubTab === 'concepts', () => setYtSubTab('concepts'))}
          </>
        )}
      </div>

      {/* Content */}
      {topTab === 'shortform' && sfSubTab === 'creators' && (
        <InspirationProfiles profiles={sfProfiles} onChange={onSfProfilesChange} />
      )}
      {topTab === 'shortform' && sfSubTab === 'concepts' && (
        <ConceptsList concepts={sfConcepts} onChange={onSfConceptsChange} />
      )}
      {topTab === 'youtube' && ytSubTab === 'creators' && (
        <InspirationProfiles profiles={profiles} onChange={onProfilesChange} />
      )}
      {topTab === 'youtube' && ytSubTab === 'thumbnails' && (
        <ThumbnailGallery thumbnails={thumbnails} onChange={onThumbnailsChange} />
      )}
      {topTab === 'youtube' && ytSubTab === 'concepts' && (
        <ConceptsList concepts={concepts} onChange={onConceptsChange} />
      )}
    </div>
  );
}
