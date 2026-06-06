'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const SERVICES = [
  { href:'/',            icon:'📋', label:'Devis',       match:(p:string)=>p==='/'||p.startsWith('/devis')||p.startsWith('/settings') },
  { href:'/visa',        icon:'🛂', label:'Visa',        match:(p:string)=>p.startsWith('/visa') },
  { href:'/omra',        icon:'🕌', label:'Omra',        match:(p:string)=>p.startsWith('/omra') },
  { href:'/billetterie', icon:'✈️', label:'Billetterie', match:(p:string)=>p.startsWith('/billetterie') },
  { href:'/attestation', icon:'📄', label:'Attestation', match:(p:string)=>p.startsWith('/attestation') },
]

export default function ServiceNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)
  if (pathname === '/login') return null
  const current = SERVICES.find(s => s.match(pathname))

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' })
    router.push('/login'); router.refresh()
  }

  return (
    <>
      <nav style={{ position:'sticky',top:0,zIndex:500,height:44,background:'#1C1A17',
        borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',
        padding:'0 1rem',boxShadow:'0 2px 12px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
          <div style={{ width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,#C96A2E,#E8956A)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem' }}>✈️</div>
          <span style={{ fontSize:'0.75rem',fontWeight:700,letterSpacing:'1.5px',color:'#C96A2E',fontFamily:'serif' }}>AELIA</span>
        </div>
        <div style={{ width:1,height:20,background:'rgba(255,255,255,0.12)',margin:'0 0.75rem',flexShrink:0 }}/>
        <span className="mob-label" style={{ flex:1,fontSize:'0.875rem',fontWeight:600,color:'rgba(255,255,255,0.85)' }}>
          {current?.icon} {current?.label}
        </span>
        <button className="mob-burger" onClick={()=>setOpen(true)}
          style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)',
            fontSize:'1.375rem',padding:'0.25rem',lineHeight:1,flexShrink:0 }}>☰</button>
        <div className="dsk-links" style={{ display:'flex',gap:2,flex:1,overflow:'hidden' }}>
          {SERVICES.map(s=>{ const a=s.match(pathname); return (
            <Link key={s.href} href={s.href} style={{ display:'flex',alignItems:'center',gap:5,padding:'0 10px',height:44,
              borderBottom:`2px solid ${a?'#C96A2E':'transparent'}`,background:a?'rgba(201,106,46,0.1)':'transparent',
              color:a?'#E8956A':'rgba(255,255,255,0.5)',textDecoration:'none',fontSize:'0.8125rem',
              fontWeight:a?600:400,whiteSpace:'nowrap',flexShrink:0,transition:'all 0.15s' }}>
              <span>{s.icon}</span><span>{s.label}</span>
            </Link>
          )})}
        </div>
        <button className="dsk-logout" onClick={logout}
          style={{ display:'flex',alignItems:'center',gap:5,marginLeft:'0.5rem',padding:'0.25rem 0.625rem',
            borderRadius:'0.5rem',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
            color:'rgba(255,255,255,0.45)',cursor:'pointer',fontSize:'0.75rem',fontFamily:'inherit',
            whiteSpace:'nowrap',flexShrink:0 }}>⏻ Déco.</button>
      </nav>
      {open && <>
        <div onClick={()=>setOpen(false)} style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(2px)' }}/>
        <div style={{ position:'fixed',top:0,left:0,bottom:0,zIndex:700,width:288,background:'#1C1A17',
          borderRight:'1px solid rgba(255,255,255,0.1)',display:'flex',flexDirection:'column',
          boxShadow:'6px 0 32px rgba(0,0,0,0.5)',animation:'slideIn .2s ease' }}>
          <div style={{ padding:'1rem 1.25rem',borderBottom:'1px solid rgba(255,255,255,0.08)',
            display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#C96A2E,#E8956A)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.125rem' }}>✈️</div>
              <div>
                <div style={{ fontSize:'0.875rem',fontWeight:700,color:'#C96A2E',fontFamily:'serif',letterSpacing:'1px' }}>AELIA TRAVEL</div>
                <div style={{ fontSize:'0.6875rem',color:'rgba(255,255,255,0.35)' }}>Espace de travail</div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',
              color:'rgba(255,255,255,0.4)',fontSize:'1.25rem',padding:'0.25rem',lineHeight:1 }}>✕</button>
          </div>
          <div style={{ flex:1,padding:'0.75rem',display:'flex',flexDirection:'column',gap:4,overflowY:'auto' }}>
            {SERVICES.map(s=>{ const a=s.match(pathname); return (
              <Link key={s.href} href={s.href} onClick={()=>setOpen(false)}
                style={{ display:'flex',alignItems:'center',gap:14,padding:'0.875rem 1rem',borderRadius:'0.875rem',
                  textDecoration:'none',transition:'all 0.15s',background:a?'rgba(201,106,46,0.15)':'transparent',
                  border:`1px solid ${a?'rgba(201,106,46,0.3)':'transparent'}` }}>
                <span style={{ fontSize:'1.5rem',width:36,textAlign:'center' }}>{s.icon}</span>
                <span style={{ fontSize:'1rem',fontWeight:a?600:400,color:a?'#E8956A':'rgba(255,255,255,0.65)' }}>{s.label}</span>
                {a&&<span style={{ marginLeft:'auto',color:'#C96A2E' }}>●</span>}
              </Link>
            )})}
          </div>
          <div style={{ padding:'1rem',borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={logout} style={{ width:'100%',padding:'0.75rem',borderRadius:'0.75rem',
              background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
              color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'0.875rem',fontFamily:'inherit',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>⏻ Déconnexion</button>
          </div>
        </div>
      </>}
      <style>{`
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @media(min-width:768px){.mob-label,.mob-burger{display:none!important}.dsk-links{display:flex!important}.dsk-logout{display:flex!important}}
        @media(max-width:767px){.dsk-links,.dsk-logout{display:none!important}.mob-label{display:block}.mob-burger{display:block}}
      `}</style>
    </>
  )
}
