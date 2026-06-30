'use client';
import { useState } from 'react';
import { Users, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { CreatorProfile, InspirationThumbnail, InspirationConcept } from '@/lib/types';
import InspirationProfiles from './InspirationProfiles';
import ThumbnailGallery from './ThumbnailGallery';
import ConceptsList from './ConceptsList';

interface Props {
  profiles: CreatorProfile[];
  onProfilesChange: (profiles: CreatorProfile[]) => void;
  thumbnails: InspirationThumbnail[];
  onThumbnailsChange: (thumbnails: InspirationThumbnail[]) => void;
  concepts: InspirationConcept[];
  onConceptsChange: (concepts: InspirationConcept[]) => void;
}

type SubTab = 'creators' | 'thumbnails' | 'concepts';

export default function InspirationHub({
  profiles, onProfilesChange,
  thumbnails, onThumbnailsChange,
  concepts, onConceptsChange,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('creators');

  const tabBtn = (tab: SubTab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setSubTab(tab)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: subTab === tab ? '#1e2130' : 'none',
        border: `1px solid ${subTab === tab ? '#6366f1' : '#1e2130'}`,
        color: subTab === tab ? '#e2e8f0' : '#64748b',
        borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
        fontSize: 13, fontWeight: subTab === tab ? 600 : 400,
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }}>
        {tabBtn('creators', 'Creators', <Users size={14} />)}
        {tabBtn('thumbnails', 'Thumbnails', <ImageIcon size={14} />)}
        {tabBtn('concepts', 'Concepts', <Lightbulb size={14} />)}
      </div>

      {subTab === 'creators' && <InspirationProfiles profiles={profiles} onChange={onProfilesChange} />}
      {subTab === 'thumbnails' && <ThumbnailGallery thumbnails={thumbnails} onChange={onThumbnailsChange} />}
      {subTab === 'concepts' && <ConceptsList concepts={concepts} onChange={onConceptsChange} />}
    </div>
  );
}
