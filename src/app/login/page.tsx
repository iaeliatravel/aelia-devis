'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [show,     setShow]     = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Remplissez tous les champs.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: username.trim(), password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push(from); router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Erreur de connexion')
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F7F5F0', padding:'1rem',
      fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:380 }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:64, height:64, borderRadius:'16px', margin:'0 auto 1rem',
            background:'linear-gradient(135deg,#C96A2E,#E8956A)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'2rem', boxShadow:'0 4px 20px rgba(201,106,46,0.3)' }}>✈️</div>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'#1C1A17', letterSpacing:'0.03em' }}>AELIA TRAVEL</div>
          <div style={{ fontSize:'0.8125rem', color:'#9B9589', marginTop:4 }}>Accès espace de travail</div>
        </div>

        <form onSubmit={handleSubmit} style={{ background:'#fff', borderRadius:'1rem',
          border:'1px solid #E3DEDA', padding:'1.75rem',
          boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em', color:'#9B9589', marginBottom:'0.5rem' }}>
              Identifiant
            </label>
            <input type="text" value={username} autoComplete="username" autoFocus
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder="Votre identifiant"
              style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'0.625rem',
                border:`1px solid ${error ? '#F0AEAD' : '#CCC8C2'}`,
                fontSize:'0.9375rem', outline:'none', fontFamily:'inherit', color:'#1C1A17',
                background:'#FAFAF8' }} />
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em', color:'#9B9589', marginBottom:'0.5rem' }}>
              Mot de passe
            </label>
            <div style={{ position:'relative' }}>
              <input type={show ? 'text' : 'password'} value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Votre mot de passe"
                style={{ width:'100%', padding:'0.75rem 2.75rem 0.75rem 1rem', borderRadius:'0.625rem',
                  border:`1px solid ${error ? '#F0AEAD' : '#CCC8C2'}`,
                  fontSize:'0.9375rem', outline:'none', fontFamily:'inherit', color:'#1C1A17',
                  background:'#FAFAF8' }} />
              <button type="button" onClick={() => setShow(!show)}
                style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:'1.125rem',
                  color:'#9B9589', padding:'0.25rem', lineHeight:1 }}>
                {show ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom:'1rem', padding:'0.625rem 0.875rem',
              background:'#FDEEEC', border:'1px solid #F0AEAD',
              borderRadius:'0.5rem', fontSize:'0.8125rem', color:'#C0392B' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.75rem',
              background: loading ? '#E8956A' : '#C96A2E', color:'white', border:'none',
              cursor: loading ? 'wait' : 'pointer', fontWeight:700, fontSize:'0.9375rem',
              fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.75rem', color:'#C4BEB6' }}>
          AELIA TRAVEL AGENCY — Espace privé
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#F7F5F0' }}/>}>
      <LoginForm />
    </Suspense>
  )
}
