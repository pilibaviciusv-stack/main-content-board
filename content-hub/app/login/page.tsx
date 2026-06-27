'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Small delay to ensure session is stored before redirect
    await new Promise(r => setTimeout(r, 500));
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, background: '#0a0c11', border: '1px solid #1e2130', borderRadius: 16, padding: '40px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Content Hub</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Vabanque</div>
          </div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 28px' }}>Access your content workspace</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 14px', background: '#0d0f14', border: '1px solid #1e2130', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', background: '#0d0f14', border: '1px solid #1e2130', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ fontSize: 13, color: '#ef4444', background: '#1a0f0f', border: '1px solid #3b1515', borderRadius: 8, padding: '10px 14px' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ background: loading ? '#3730a3' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
