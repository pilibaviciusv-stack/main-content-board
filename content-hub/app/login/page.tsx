'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
    await new Promise(r => setTimeout(r, 500));
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: 380, background: '#0c0d11', border: '1px solid #18191f', borderRadius: 18, padding: '40px 36px', boxShadow: '0 0 60px #e11d4808' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ width: 42, height: 42, background: '#0f1015', border: '1px solid #e11d4833', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px #e11d4822' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#e11d48' }}>[</span>
              <span style={{ color: '#f1f5f9' }}>PI</span>
              <span style={{ color: '#e11d48' }}>]</span>
            </span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Content Hub</div>
            <div style={{ fontSize: 11, color: '#374151' }}>PlugInfo</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#374151', margin: '0 0 28px' }}>Access your content workspace</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: '100%', padding: '11px 14px', background: '#080a0e', border: '1px solid #18191f', borderRadius: 9, color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#e11d4844'}
              onBlur={e => e.target.style.borderColor = '#18191f'}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', background: '#080a0e', border: '1px solid #18191f', borderRadius: 9, color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#e11d4844'}
              onBlur={e => e.target.style.borderColor = '#18191f'}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: '#e11d48', background: '#e11d4810', border: '1px solid #e11d4825', borderRadius: 8, padding: '10px 14px' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{
              background: loading ? '#1a0a0e' : '#e11d48',
              color: '#fff', border: 'none', borderRadius: 9,
              padding: '12px 0', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
              boxShadow: loading ? 'none' : '0 0 20px #e11d4833',
              transition: 'all 0.2s', letterSpacing: '-0.01em',
            }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
