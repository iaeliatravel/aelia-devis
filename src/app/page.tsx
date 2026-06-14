'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Quote, DocumentType } from '@/types/database'
import { getQuotes, effectiveProfit } from '@/lib/quotes'
import { supabase } from '@/lib/supabase'
import DocTypeBadge, { DOC_TYPE_CONFIG } from '@/components/DocTypeBadge'
const SL:Record<string,{label:string;bg:string;color:string}>={
  draft:{label:'Brouillon',bg:'#f3f4f6',color:'#4b5563'},sent:{label:'Envoyé',bg:'#dbeafe',color:'#1d4ed8'},
  accepted:{label:'Accepté',bg:'#d1fae5',color:'#065f46'},rejected:{label:'Refusé',bg:'#fee2e2',color:'#991b1b'},
  expired:{label:'Expiré',bg:'#f3f4f6',color:'#6b7280'}}
const BS={border:'1px solid var(--color-border)',background:'var(--color-surface)'}
const DF=[{v:'all',l:'Tous'},{v:'devis',l:'Devis'},{v:'proforma',l:'Proforma'},{v:'facture',l:'Factures'},{v:'bon_versement',l:'Bons'}]
const SF=[{v:'all',l:'Tous statuts'},{v:'draft',l:'Brouillon'},{v:'sent',l:'Envoyé'},{v:'accepted',l:'Accepté'},{v:'rejected',l:'Refusé'},{v:'expired',l:'Expiré'}]
export default function DashboardPage(){
  const router=useRouter()
  const[quotes,setQuotes]=useState<Quote[]>([]);const[loading,setLoading]=useState(true)
  const[filter,setFilter]=useState('all');const[sf,setSf]=useState('all')
  const[search,setSearch]=useState('');const[mobile,setMobile]=useState(false)
  useEffect(()=>{
    getQuotes().then(q=>{setQuotes(q);setLoading(false)})
    const c=()=>setMobile(window.innerWidth<768);c();window.addEventListener('resize',c)
    return()=>window.removeEventListener('resize',c)
  },[])
  async function del(id:string){if(!confirm('Supprimer ?'))return;await supabase.from('quotes').delete().eq('id',id);setQuotes(q=>q.filter(x=>x.id!==id))}
  const fmt=(n:number)=>Math.round(n).toLocaleString('fr-DZ')
  const filt=quotes.filter(q=>(filter==='all'||(q.document_type||'devis')===filter)&&(sf==='all'||q.status===sf)&&(!search||q.quote_number.toLowerCase().includes(search.toLowerCase())||(q.client?.name||'').toLowerCase().includes(search.toLowerCase())||(q.client?.phone||'').includes(search)))
  const byT=(t:DocumentType)=>quotes.filter(q=>(q.document_type||'devis')===t)
  const sumCA=(a:Quote[])=>a.filter(q=>q.status==='accepted').reduce((s,q)=>s+(q.total_client||0),0)
  const acc=quotes.filter(q=>q.status==='accepted')
  const tCA=acc.reduce((s,q)=>s+(q.total_client||0),0)
  const tPr=acc.reduce((s,q)=>s+effectiveProfit(q),0)
  const tCl=new Set(quotes.map(q=>q.client_id).filter(Boolean)).size
  const kpis:[DocumentType,string][]=[['devis',' HT'],['proforma',' HT'],['facture',' TTC'],['bon_versement','']]
  return(
    <div style={{padding:mobile?'1rem':'2rem',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <div><h1 style={{fontSize:mobile?'1.25rem':'1.5rem',fontWeight:700}}>Tableau de bord</h1><p style={{fontSize:'0.8125rem',color:'var(--color-text-muted)',marginTop:2}}>AELIA TRAVEL AGENCY</p></div>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <Link href="/settings" style={{padding:'0.5rem 0.875rem',borderRadius:'0.625rem',border:'1px solid var(--color-border)',background:'var(--color-surface)',color:'var(--color-text)',textDecoration:'none',fontWeight:500,fontSize:'0.875rem',display:'flex',alignItems:'center',gap:5}}>⚙️{!mobile&&' Paramètres'}</Link>
          <Link href="/devis/nouveau" style={{padding:'0.5rem 1.25rem',borderRadius:'0.75rem',background:'var(--color-primary)',color:'white',textDecoration:'none',fontWeight:600,fontSize:'0.875rem',display:'flex',alignItems:'center',gap:5}}>＋ Nouveau</Link>
        </div>
      </div>
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'0.75rem',overflowX:'auto',paddingBottom:4,msOverflowStyle:'none',scrollbarWidth:'none'}}>
        {kpis.map(([type,suffix])=>{const cfg=DOC_TYPE_CONFIG[type];const arr=byT(type);const active=filter===type;return(
          <button key={type} onClick={()=>setFilter(active?'all':type)} style={{padding:mobile?'0.75rem':'1rem',borderRadius:'0.875rem',cursor:'pointer',textAlign:'left',border:`2px solid ${active?cfg.border:'var(--color-border)'}`,background:active?cfg.bg:'var(--color-surface)',transition:'all 0.15s',outline:'none',flexShrink:0,minWidth:mobile?140:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
              <span style={{fontSize:'1.25rem'}}>{cfg.icon}</span><span style={{fontSize:'0.625rem',fontWeight:700,padding:'1px 6px',borderRadius:20,background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{arr.length}</span>
            </div>
            <div style={{fontSize:mobile?'0.9375rem':'1rem',fontWeight:800,fontVariantNumeric:'tabular-nums',color:active?cfg.color:'var(--color-text)',lineHeight:1.2}}>{fmt(sumCA(arr))} DA</div>
            <div style={{fontSize:'0.625rem',color:'var(--color-text-muted)',marginTop:3}}>{cfg.label}{suffix} · acceptés</div>
          </button>
        )})}
      </div>
      <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'1.25rem'}}>
        {[{icon:'💰',val:`${fmt(tCA)} DA`,label:'CA (acceptés)'},{icon:'📈',val:`+${fmt(tPr)} DA`,label:'Bénéfice',green:true},{icon:'👥',val:String(tCl),label:'Clients'}].map((k,i)=>(
          <div key={i} style={{padding:'0.875rem 1rem',borderRadius:'0.875rem',display:'flex',alignItems:'center',gap:'0.75rem',...BS}}>
            <span style={{fontSize:'1.5rem'}}>{k.icon}</span>
            <div><div style={{fontSize:mobile?'0.875rem':'1rem',fontWeight:700,fontVariantNumeric:'tabular-nums',color:k.green?'var(--color-success)':undefined}}>{k.val}</div><div style={{fontSize:'0.6875rem',color:'var(--color-text-muted)',marginTop:1}}>{k.label}</div></div>
          </div>
        ))}
      </div>
      <input type="text" placeholder="🔍 N°, nom ou téléphone…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.625rem 0.875rem',borderRadius:'0.625rem',fontSize:'0.875rem',outline:'none',marginBottom:'0.625rem',...BS}}/>
      <div style={{display:'flex',gap:4,overflowX:'auto',marginBottom:'0.5rem',msOverflowStyle:'none',scrollbarWidth:'none'}}>
        {DF.map(f=><button key={f.v} onClick={()=>setFilter(f.v)} style={{padding:'0.4rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.8125rem',fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,background:filter===f.v?'var(--color-primary)':'var(--color-surface)',color:filter===f.v?'white':'var(--color-text-muted)',border:`1px solid ${filter===f.v?'var(--color-primary)':'var(--color-border)'}`}}>{f.l}</button>)}
      </div>
      <div style={{display:'flex',gap:4,overflowX:'auto',marginBottom:'1rem',msOverflowStyle:'none',scrollbarWidth:'none'}}>
        {SF.map(f=>{const sl=f.v!=='all'?SL[f.v]:null;const a=sf===f.v;return(<button key={f.v} onClick={()=>setSf(f.v)} style={{padding:'0.4rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.75rem',fontWeight:a?700:500,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,background:a?(sl?.bg||'var(--color-primary)'):'var(--color-surface)',color:a?(sl?.color||'white'):'var(--color-text-muted)',border:`1px solid ${a?(sl?.color||'var(--color-primary)'):'var(--color-border)'}`}}>{f.l}</button>)})}
      </div>
      {loading?<div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:mobile?96:52,borderRadius:'0.875rem'}}/>)}</div>:
      filt.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'3rem 1rem',gap:'0.75rem',color:'var(--color-text-muted)'}}><span style={{fontSize:'3rem'}}>📄</span><p style={{fontWeight:500}}>Aucun document trouvé</p><Link href="/devis/nouveau" style={{padding:'0.5rem 1.25rem',borderRadius:'0.625rem',background:'var(--color-primary)',color:'white',textDecoration:'none',fontWeight:600,fontSize:'0.875rem'}}>＋ Nouveau</Link></div>:
      mobile?(
        <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
          {filt.map(q=>{const sl=SL[q.status]||SL.draft;const bp=effectiveProfit(q);return(
            <div key={q.id} style={{background:'var(--color-surface)',borderRadius:'0.875rem',padding:'0.875rem 1rem',border:'1px solid var(--color-border)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.375rem'}}>
                <span style={{fontWeight:700,color:'var(--color-primary)',fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums'}}>{q.quote_number}</span>
                <DocTypeBadge type={q.document_type} size="sm"/>
              </div>
              <div style={{fontSize:'1rem',fontWeight:600}}>{q.client?.name||'N/A'}</div>
              {q.client?.phone&&<div style={{fontSize:'0.8125rem',color:'var(--color-text-muted)',marginBottom:'0.375rem'}}>{q.client.phone}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem',marginTop:'0.375rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:'0.75rem',color:'var(--color-text-muted)'}}>{new Date(q.issue_date).toLocaleDateString('fr-FR')}</span>
                  <span style={{padding:'2px 8px',borderRadius:9999,fontSize:'0.6875rem',fontWeight:600,background:sl.bg,color:sl.color}}>{sl.label}</span>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums'}}>{fmt(q.total_client||0)} DA</div>
                  <div style={{fontSize:'0.6875rem',color:'var(--color-success)',fontVariantNumeric:'tabular-nums'}}>+{fmt(bp)} DA</div>
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>router.push(`/devis/${q.id}`)} style={{flex:1,padding:'0.625rem',borderRadius:'0.625rem',fontSize:'0.875rem',fontWeight:600,background:'var(--color-primary)',color:'white',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Ouvrir</button>
                <button onClick={()=>del(q.id)} style={{padding:'0.625rem 1rem',borderRadius:'0.625rem',fontSize:'1rem',border:'1px solid var(--color-border)',background:'transparent',cursor:'pointer',color:'var(--color-text-muted)'}}>🗑</button>
              </div>
            </div>
          )})}
        </div>
      ):(
        <div style={{borderRadius:'1rem',overflow:'hidden',...BS}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--color-surface-offset)',borderBottom:'1px solid var(--color-border)'}}>
              {['N°','Type','Client','Date','Statut','Total','Bénéfice','Actions'].map(h=><th key={h} style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.6875rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--color-text-muted)',whiteSpace:'nowrap'}}>{h}</th>)}
            </tr></thead>
            <tbody>{filt.map(q=>{const sl=SL[q.status]||SL.draft;const bp=effectiveProfit(q);return(
              <tr key={q.id} style={{borderBottom:'1px solid var(--color-border)',transition:'background 0.1s'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--color-surface-offset)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <td style={{padding:'0.75rem 1rem',fontSize:'0.875rem',fontWeight:700,color:'var(--color-primary)',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{q.quote_number}</td>
                <td style={{padding:'0.75rem 1rem'}}><DocTypeBadge type={q.document_type} size="sm"/></td>
                <td style={{padding:'0.75rem 1rem'}}>
                  <div style={{fontSize:'0.875rem',fontWeight:500}}>{q.client?.name||'N/A'}</div>
                  {q.client?.phone&&<div style={{fontSize:'0.75rem',color:'var(--color-text-muted)',marginTop:2,fontVariantNumeric:'tabular-nums'}}>{q.client.phone}</div>}
                </td>
                <td style={{padding:'0.75rem 1rem',fontSize:'0.875rem',fontVariantNumeric:'tabular-nums',color:'var(--color-text-muted)',whiteSpace:'nowrap'}}>{new Date(q.issue_date).toLocaleDateString('fr-FR')}</td>
                <td style={{padding:'0.75rem 1rem'}}><span style={{padding:'2px 10px',borderRadius:9999,fontSize:'0.6875rem',fontWeight:600,background:sl.bg,color:sl.color,whiteSpace:'nowrap'}}>{sl.label}</span></td>
                <td style={{padding:'0.75rem 1rem',fontSize:'0.875rem',fontWeight:700,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>{fmt(q.total_client||0)} DA</td>
                <td style={{padding:'0.75rem 1rem',fontSize:'0.875rem',fontWeight:600,fontVariantNumeric:'tabular-nums',color:'var(--color-success)',whiteSpace:'nowrap'}}>+{fmt(bp)} DA</td>
                <td style={{padding:'0.75rem 1rem'}}><div style={{display:'flex',gap:6}}>
                  <Link href={`/devis/${q.id}`} style={{padding:'0.25rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.75rem',fontWeight:600,background:'var(--color-primary-highlight)',color:'var(--color-primary)',textDecoration:'none',whiteSpace:'nowrap'}}>Ouvrir</Link>
                  <button onClick={()=>del(q.id)} style={{padding:'0.25rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.75rem',border:'1px solid var(--color-border)',cursor:'pointer',background:'transparent',color:'var(--color-text-muted)',whiteSpace:'nowrap'}}>Suppr.</button>
                </div></td>
              </tr>
            )})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
