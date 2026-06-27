'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target } from 'lucide-react';

export default function JorisHub() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #ef4444, #f97316)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Target size={28} color="white" />
      </div>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Content Strategy</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', margin: '0 0 12px' }}>Joris Hub</h1>
      <p style={{ fontSize: 14, color: '#475569', margin: '0 0 40px' }}>Coming soon — content workspace for Joris</p>
      <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e2130', border: '1px solid #2d3348', borderRadius: 10, padding: '10px 20px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
        <ArrowLeft size={15} /> Back to hubs
      </button>
    </div>
  );
}
