'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    await new Promise(r => setTimeout(r, 500));
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Animated red sea background */}
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.15)} 66%{transform:translate(-30px,50px) scale(0.9)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,60px) scale(1.1)} 66%{transform:translate(70px,-30px) scale(0.95)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,50px) scale(0.9)} 66%{transform:translate(-60px,-20px) scale(1.2)} }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #080a0e inset!important; -webkit-text-fill-color:#f1f5f9!important; }
      `}</style>

      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60vw', height:'60vw', background:'radial-gradient(circle, #e11d4818 0%, transparent 70%)', animation:'blob1 12s ease-in-out infinite', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'55vw', height:'55vw', background:'radial-gradient(circle, #e11d4812 0%, transparent 70%)', animation:'blob2 16s ease-in-out infinite', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'40%', right:'20%', width:'40vw', height:'40vw', background:'radial-gradient(circle, #be123c0e 0%, transparent 70%)', animation:'blob3 20s ease-in-out infinite', borderRadius:'50%' }} />
      </div>

      <div className="login-card" style={{ width:380, background:'#0c0d1188', backdropFilter:'blur(24px)', border:'1px solid #ffffff08', borderRadius:20, padding:'40px 36px', boxShadow:'0 0 80px #e11d480a, 0 32px 64px #00000060', position:'relative', zIndex:1 }}>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:36 }}>
          <div style={{ width:42, height:42, background:'#0f1015', border:'1px solid #e11d4840', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px #e11d4828' }}>
            <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:13 }}>
              <span style={{ color:'#e11d48' }}>[</span><span style={{ color:'#f1f5f9' }}>PI</span><span style={{ color:'#e11d48' }}>]</span>
            </span>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.01em' }}>Content Hub</div>
            <div style={{ fontSize:11, color:'#374151' }}>PlugInfo</div>
          </div>
        </div>

        <h1 style={{ fontSize:22, fontWeight:800, color:'#f1f5f9', margin:'0 0 6px', letterSpacing:'-0.02em' }}>Sign in</h1>
        <p style={{ fontSize:13, color:'#374151', margin:'0 0 28px' }}>Access your content workspace</p>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'#4b5563', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width:'100%', padding:'11px 14px', background:'#080a0e', border:'1px solid #1a1c22', borderRadius:9, color:'#f1f5f9', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border 0.15s' }}
              onFocus={e=>e.target.style.borderColor='#e11d4855'} onBlur={e=>e.target.style.borderColor='#1a1c22'} />
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'#4b5563', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width:'100%', padding:'11px 14px', background:'#080a0e', border:'1px solid #1a1c22', borderRadius:9, color:'#f1f5f9', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border 0.15s' }}
              onFocus={e=>e.target.style.borderColor='#e11d4855'} onBlur={e=>e.target.style.borderColor='#1a1c22'} />
          </div>
          {error && <div style={{ fontSize:13, color:'#e11d48', background:'#e11d4810', border:'1px solid #e11d4825', borderRadius:8, padding:'10px 14px' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ background:loading?'#3a0a14':'#e11d48', color:'#fff', border:'none', borderRadius:9, padding:'12px 0', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:6, boxShadow:loading?'none':'0 0 24px #e11d4840', transition:'all 0.2s' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
