'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const SERVICES = [
  { href:'/',            icon:'📋', label:'Devis',       match: (p: string) => p === '/' || p.startsWith('/devis') || p.startsWith('/settings') },
  { href:'/visa',        icon:'🛂', label:'Visa',        match: (p: string) => p.startsWith('/visa') },
  { href:'/omra',        icon:'🕌', label:'Omra',        match: (p: string) => p.startsWith('/omra') },
  { href:'/billetterie', icon:'✈️', label:'Billetterie', match: (p: string) => p.startsWith('/billetterie') },
  { href:'/attestation', icon:'📄', label:'Attestation', match: (p: string) => p.startsWith('/attestation') },
]

export default function ServiceNav() {
  const pathname = usePathname()
  const router   = useRouter()

  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method:'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:500, height:44,
      background:'#1C1A17', borderBottom:'1px solid rgba(255,255,255,0.08)',
      display:'flex', alignItems:'center', padding:'0 1rem',
      boxShadow:'0 2px 12px rgba(0,0,0,0.25)',
    }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:'1.25rem', flexShrink:0 }}>
        <div style={{ width:24, height:24, borderRadius:6,
          background:'linear-gradient(135deg,#C96A2E,#E8956A)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.75rem', flexShrink:0 }}>✈️</div>
        <span style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'1.5px',
          color:'#C96A2E', fontFamily:'serif' }}>AELIA</span>
      </div>

      <div style={{ width:'1px', height:20, background:'rgba(255,255,255,0.12)', marginRight:'1.25rem', flexShrink:0 }}/>

      {/* Services */}
      <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto',
        msOverflowStyle:'none', scrollbarWidth:'none' }}>
        {SERVICES.map(s => {
          const active = s.match(pathname)
          return (
            <Link key={s.href} href={s.href}
              style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'0 10px', height:44, borderBottom:'2px solid',
                borderBottomColor: active ? '#C96A2E' : 'transparent',
                background: active ? 'rgba(201,106,46,0.1)' : 'transparent',
                color: active ? '#E8956A' : 'rgba(255,255,255,0.5)',
                textDecoration:'none', fontSize:'0.8125rem', fontWeight: active ? 600 : 400,
                whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
              }}>
              <span style={{ fontSize:'0.875rem' }}>{s.icon}</span>
              <span>{s.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        style={{ display:'flex', alignItems:'center', gap:5, marginLeft:'0.75rem',
          padding:'0.25rem 0.75rem', borderRadius:'0.5rem',
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
          color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:'0.75rem',
          fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0,
          transition:'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.7)' }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.45)' }}>
        ⏻ Déconnexion
      </button>
    </nav>
  )
}
