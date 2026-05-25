'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Quote } from '@/types/database'
import { getQuotes } from '@/lib/quotes'
import { supabase } from '@/lib/supabase'

const SL: Record<string,{label:string;bg:string;color:string}> = {
  draft:    { label:'Brouillon', bg:'#f3f4f6', color:'#4b5563' },
  sent:     { label:'Envoyé',    bg:'#dbeafe', color:'#1d4ed8' },
  accepted: { label:'Accepté',   bg:'#d1fae5', color:'#065f46' },
  rejected: { label:'Refusé',    bg:'#fee2e2', color:'#991b1b' },
  expired:  { label:'Expiré',    bg:'#f3f4f6', color:'#6b7280' },
}
const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }

export default function DashboardPage() {
  const [quotes,setQuotes]   = useState<Quote[]>([])
  const [loading,setLoading] = useState(true)
  const [filter,setFilter]   = useState('all')
  const [search,setSearch]   = useState('')

  useEffect(()=>{ getQuotes().then(q=>{ setQuotes(q); setLoading(false) }) },[])

  async function deleteQuote(id:string) {
    if (!confirm('Supprimer ce devis définitivement ?')) return
    await supabase.from('quotes').delete().eq('id',id)
    setQuotes(q=>q.filter(x=>x.id!==id))
  }

  const filtered = quotes.filter(q=>
    (filter==='all'||q.status===filter) &&
    (!search||q.quote_number.toLowerCase().includes(search.toLowerCase())||
      (q.client?.name||'').toLowerCase().includes(search.toLowerCase()))
  )
  const accepted = quotes.filter(q=>q.status==='accepted')
  const stats = {
    total:  quotes.length,
    ca:     accepted.reduce((s,q)=>s+q.total_client,0),
    profit: accepted.reduce((s,q)=>s+q.profit,0),
    clients:new Set(quotes.map(q=>q.client_id).filter(Boolean)).size,
  }
  const fmt = (n:number) => n.toLocaleString('fr-DZ')

  return (
    <div style={{ padding:'2rem', maxWidth:1200, margin:'0 auto' }} className="animate-fadeIn">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'2rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Tableau de bord</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-text-muted)', marginTop:4 }}>
            Gestion des devis — AELIA TRAVEL AGENCY
          </p>
        </div>
        <Link href="/devis/nouveau" style={{ display:'inline-flex', alignItems:'center', gap:6,
          padding:'0.625rem 1.25rem', borderRadius:'0.75rem', background:'var(--color-primary)',
          color:'white', textDecoration:'none', fontWeight:600, fontSize:'0.9375rem',
          boxShadow:'var(--shadow-sm)' }}>
          ＋ Nouveau devis
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { label:'Total devis',     value:String(stats.total),        icon:'📄' },
          { label:'CA (acceptés)',   value:`${fmt(stats.ca)} DA`,      icon:'💵' },
          { label:'Bénéfice net',    value:`${fmt(stats.profit)} DA`,  icon:'📈' },
          { label:'Clients uniques', value:String(stats.clients),      icon:'👥' },
        ].map(k=>(
          <div key={k.label} style={{ padding:'1.25rem', borderRadius:'1rem', ...S }}>
            <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>{k.icon}</div>
            <div style={{ fontSize:'1.375rem', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{k.value}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <input type="text" placeholder="🔍 N° devis ou nom client..."
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'0.5rem 0.875rem', borderRadius:'0.625rem',
            fontSize:'0.875rem', outline:'none', ...S }} />
        <div style={{ display:'flex', gap:4 }}>
          {[['all','Tous'],['draft','Brouillons'],['sent','Envoyés'],['accepted','Acceptés'],['rejected','Refusés']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              padding:'0.5rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8125rem', fontWeight:500,
              cursor:'pointer', transition:'all 0.15s',
              background: filter===v?'var(--color-primary)':'var(--color-surface)',
              color: filter===v?'white':'var(--color-text-muted)',
              border:`1px solid ${filter===v?'var(--color-primary)':'var(--color-border)'}`,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius:'1rem', overflow:'hidden', ...S }}>
        {loading ? (
          <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{ height:52 }} />)}
          </div>
        ) : filtered.length===0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'4rem 1rem', gap:'0.75rem',
            color:'var(--color-text-muted)' }}>
            <span style={{ fontSize:'3.5rem' }}>📄</span>
            <p style={{ fontWeight:500, fontSize:'1rem' }}>Aucun devis trouvé</p>
            <Link href="/devis/nouveau" style={{ marginTop:8, padding:'0.5rem 1.25rem', borderRadius:'0.625rem',
              background:'var(--color-primary)', color:'white', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>
              Créer un devis
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr style={{ background:'var(--color-surface-offset)', borderBottom:'1px solid var(--color-border)' }}>
                {['N° Devis','Client','Date','Statut','Total client','Bénéfice','Actions'].map(h=>(
                  <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.6875rem',
                    fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                    color:'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(q=>{
                const s = SL[q.status]||SL.draft
                return (
                  <tr key={q.id} style={{ borderBottom:'1px solid var(--color-border)', transition:'background 0.1s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--color-surface-offset)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', fontWeight:700,
                      color:'var(--color-primary)' }}>{q.quote_number}</td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem' }}>
                      {q.client?.name||<span style={{color:'var(--color-text-faint)'}}>—</span>}
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', fontVariantNumeric:'tabular-nums',
                      color:'var(--color-text-muted)' }}>
                      {new Date(q.issue_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <span style={{ padding:'2px 10px', borderRadius:9999, fontSize:'0.6875rem',
                        fontWeight:600, background:s.bg, color:s.color }}>{s.label}</span>
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', fontWeight:700,
                      fontVariantNumeric:'tabular-nums' }}>{fmt(q.total_client)} DA</td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', fontWeight:600,
                      fontVariantNumeric:'tabular-nums', color:'var(--color-success)' }}>
                      +{fmt(q.profit)} DA
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Link href={`/devis/${q.id}`} style={{
                          padding:'0.25rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem', fontWeight:600,
                          background:'var(--color-primary-highlight)', color:'var(--color-primary)', textDecoration:'none' }}>
                          Ouvrir
                        </Link>
                        <button onClick={()=>deleteQuote(q.id)} style={{
                          padding:'0.25rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem',
                          border:'1px solid var(--color-border)', cursor:'pointer', background:'transparent',
                          color:'var(--color-text-muted)' }}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
