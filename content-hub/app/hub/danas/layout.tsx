'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed', top: 14, right: 16, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#0a0c11', border: '1px solid #1e2130',
          borderRadius: 8, padding: '7px 12px',
          color: '#64748b', cursor: 'pointer', fontSize: 12,
        }}
      >
        <ArrowLeft size={13} /> All hubs
      </button>
      {children}
    </div>
  );
}
