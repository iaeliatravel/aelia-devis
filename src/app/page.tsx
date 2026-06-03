'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Quote, DocumentType } from '@/types/database'
import { getQuotes, effectiveProfit } from '@/lib/quotes'
import { supabase } from '@/lib/supabase'
import DocTypeBadge, { DOC_TYPE_CONFIG } from '@/components/DocTypeBadge'

const SL: Record<string,{label:string;bg:string;color:string}> = {
  draft:    { label:'Brouillon', bg:'#f3f4f6', color:'#4b5563' },
  sent:     { label:'Envoyé',    bg:'#dbeafe', color:'#1d4ed8' },
  accepted: { label:'Accepté',   bg:'#d1fae5', color:'#065f46' },
  rejected: { label:'Refusé',    bg:'#fee2e2', color:'#991b1b' },
  expired:  { label:'Expiré',    bg:'#f3f4f6', color:'#6b7280' },
}
const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }

const DOC_FILTERS = [
  { value:'all',           label:'Tous' },
  { value:'devis',         label:'Devis' },
  { value:'proforma',      label:'Proforma' },
  { value:'facture',       label:'Factures' },
  { value:'bon_versement', label:'Bons' },
]

export default function DashboardPage() {
  const [quotes,  setQuotes]  = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    getQuotes().then(q => { setQuotes(q); setLoading(false) })
  }, [])

  async function deleteQuote(id: string) {
    if (!confirm('Supprimer ce document définitivement ?')) return
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes(q => q.filter(x => x.id !== id))
  }

  const fmt = (n: number) => Math.round(n).toLocaleString('fr-DZ')

  const filtered = quotes.filter(q =>
    (filter === 'all' || (q.document_type || 'devis') === filter) &&
    (!search ||
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      (q.client?.name || '').toLowerCase().includes(search.toLowerCase()))
  )

  /* ── Stats par type — CA et bénéfice sur documents ACCEPTÉS uniquement ── */
  const byType = (type: DocumentType) =>
    quotes.filter(q => (q.document_type || 'devis') === type)

  /* Total count (tous statuts) + CA (acceptés seulement) */
  const sumClientAccepted = (arr: Quote[]) =>
    arr.filter(q => q.status === 'accepted').reduce((s, q) => s + (q.total_client || 0), 0)

  const sumProfitAccepted = (arr: Quote[]) =>
    arr.filter(q => q.status === 'accepted').reduce((s, q) => s + effectiveProfit(q), 0)

  const acceptedAll = quotes.filter(q => q.status === 'accepted')
  const totalProfit  = acceptedAll.reduce((s, q) => s + effectiveProfit(q), 0)
  const totalCA      = acceptedAll.reduce((s, q) => s + (q.total_client || 0), 0)
  const totalClients = new Set(quotes.map(q => q.client_id).filter(Boolean)).size

  const kpis: { type: DocumentType; suffix: string }[] = [
    { type:'devis',         suffix:' HT' },
    { type:'proforma',      suffix:' HT' },
    { type:'facture',       suffix:' TTC' },
    { type:'bon_versement', suffix:'' },
  ]

  return (
    <div style={{ padding:'2rem', maxWidth:1200, margin:'0 auto' }} className="animate-fadeIn">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'2rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Tableau de bord</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--color-text-muted)', marginTop:4 }}>
            Gestion des documents — AELIA TRAVEL AGENCY
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <Link href="/settings"
            style={{ display:'inline-flex', alignItems:'center', gap:6,
              padding:'0.5rem 1rem', borderRadius:'0.625rem',
              border:'1px solid var(--color-border)', background:'var(--color-surface)',
              color:'var(--color-text)', textDecoration:'none', fontWeight:500, fontSize:'0.875rem' }}>
            ⚙️ Paramètres
          </Link>
          <Link href="/devis/nouveau"
            style={{ display:'inline-flex', alignItems:'center', gap:6,
              padding:'0.5rem 1.25rem', borderRadius:'0.75rem',
              background:'var(--color-primary)', color:'white',
              textDecoration:'none', fontWeight:600, fontSize:'0.9375rem' }}>
            ＋ Nouveau
          </Link>
        </div>
      </div>

      {/* KPIs par type — montants = acceptés seulement */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1rem' }}>
        {kpis.map(k => {
          const cfg    = DOC_TYPE_CONFIG[k.type]
          const arr    = byType(k.type)
          const active = filter === k.type
          const ca     = sumClientAccepted(arr)
          return (
            <button key={k.type} onClick={() => setFilter(active ? 'all' : k.type)}
              style={{ padding:'1.125rem', borderRadius:'1rem', cursor:'pointer', textAlign:'left',
                border:`2px solid ${active ? cfg.border : 'var(--color-border)'}`,
                background: active ? cfg.bg : 'var(--color-surface)',
                transition:'all 0.15s', outline:'none' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.625rem' }}>
                <span style={{ fontSize:'1.375rem' }}>{cfg.icon}</span>
                <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'2px 8px',
                  borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                  {arr.length} doc{arr.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ fontSize:'1.125rem', fontWeight:800, fontVariantNumeric:'tabular-nums',
                color: active ? cfg.color : 'var(--color-text)', lineHeight:1.2 }}>
                {fmt(ca)} DA
              </div>
              <div style={{ fontSize:'0.6875rem', color:'var(--color-text-muted)', marginTop:4 }}>
                {cfg.label}{k.suffix} · acceptés
              </div>
            </button>
          )
        })}
      </div>

      {/* KPIs secondaires */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
        <div style={{ padding:'1rem 1.25rem', borderRadius:'1rem', display:'flex', alignItems:'center', gap:'1rem', ...S }}>
          <span style={{ fontSize:'1.75rem' }}>💰</span>
          <div>
            <div style={{ fontSize:'1.125rem', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
              {fmt(totalCA)} DA
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:2 }}>CA total (acceptés)</div>
          </div>
        </div>
        <div style={{ padding:'1rem 1.25rem', borderRadius:'1rem', display:'flex', alignItems:'center', gap:'1rem', ...S }}>
          <span style={{ fontSize:'1.75rem' }}>📈</span>
          <div>
            <div style={{ fontSize:'1.125rem', fontWeight:700, fontVariantNumeric:'tabular-nums',
              color:'var(--color-success)' }}>+{fmt(totalProfit)} DA</div>
            <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:2 }}>Bénéfice (acceptés)</div>
          </div>
        </div>
        <div style={{ padding:'1rem 1.25rem', borderRadius:'1rem', display:'flex', alignItems:'center', gap:'1rem', ...S }}>
          <span style={{ fontSize:'1.75rem' }}>👥</span>
          <div>
            <div style={{ fontSize:'1.125rem', fontWeight:700 }}>{totalClients}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:2 }}>Clients uniques</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <input type="text" placeholder="🔍 N° ou nom client…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'0.5rem 0.875rem',
            borderRadius:'0.625rem', fontSize:'0.875rem', outline:'none', ...S }} />
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {DOC_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding:'0.5rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8125rem',
                fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                background: filter===f.value ? 'var(--color-primary)' : 'var(--color-surface)',
                color:       filter===f.value ? 'white' : 'var(--color-text-muted)',
                border:`1px solid ${filter===f.value ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ borderRadius:'1rem', overflow:'hidden', ...S }}>
        {loading ? (
          <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:52 }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            padding:'4rem 1rem', gap:'0.75rem', color:'var(--color-text-muted)' }}>
            <span style={{ fontSize:'3.5rem' }}>📄</span>
            <p style={{ fontWeight:500 }}>Aucun document trouvé</p>
            <Link href="/devis/nouveau"
              style={{ padding:'0.5rem 1.25rem', borderRadius:'0.625rem',
                background:'var(--color-primary)', color:'white',
                textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>
              ＋ Nouveau
            </Link>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--color-surface-offset)', borderBottom:'1px solid var(--color-border)' }}>
                {['N°','Type','Client','Date','Statut','Total','Bénéfice','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.6875rem',
                    fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                    color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => {
                const s  = SL[q.status] || SL.draft
                const bp = effectiveProfit(q)
                const hasManual = q.manual_profit_enabled && q.manual_profit != null
                return (
                  <tr key={q.id}
                    style={{ borderBottom:'1px solid var(--color-border)', transition:'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-offset)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem',
                      fontWeight:700, color:'var(--color-primary)', whiteSpace:'nowrap' }}>
                      {q.quote_number}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <DocTypeBadge type={q.document_type} size="sm"/>
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem' }}>
                      {q.client?.name || <span style={{ color:'var(--color-text-faint)' }}>—</span>}
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem',
                      fontVariantNumeric:'tabular-nums', color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>
                      {new Date(q.issue_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <span style={{ padding:'2px 10px', borderRadius:9999, fontSize:'0.6875rem',
                        fontWeight:600, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem',
                      fontWeight:700, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                      {fmt(q.total_client || 0)} DA
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem',
                      fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                      <span style={{ fontWeight:600, color:'var(--color-success)' }}>
                        +{fmt(bp)} DA
                      </span>
                      {hasManual && (
                        <span style={{ marginLeft:4, fontSize:'0.6875rem', color:'#f59e0b' }}
                          title="Bénéfice manuel">✎</span>
                      )}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Link href={`/devis/${q.id}`}
                          style={{ padding:'0.25rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem',
                            fontWeight:600, background:'var(--color-primary-highlight)',
                            color:'var(--color-primary)', textDecoration:'none', whiteSpace:'nowrap' }}>
                          Ouvrir
                        </Link>
                        <button onClick={() => deleteQuote(q.id)}
                          style={{ padding:'0.25rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem',
                            border:'1px solid var(--color-border)', cursor:'pointer',
                            background:'transparent', color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>
                          Suppr.
                        </button>
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
