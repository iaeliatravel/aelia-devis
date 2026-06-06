'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface VisaOption {
  type: string; typeColor: string; price: string; delai: string;
  validite?: string; docs_client?: string[]; docs_agence?: string[];
  docs_cas1?: string[]; docs_cas2?: string[]; docs_cas3?: string[];
  docs_mineur?: string[]; note?: string; conditions?: string;
}
interface Country { id: string; country: string; flag: string; conditions?: string; options: VisaOption[]; available: boolean; sort_order: number }

const BADGE_COLORS: Record<string,{bg:string;color:string;label:string}> = {
  green:  { bg:'#d1fae5',color:'#065f46',label:'E-Visa' },
  blue:   { bg:'#dbeafe',color:'#1d4ed8',label:'Sticker' },
  amber:  { bg:'#fef3c7',color:'#92400e',label:'Express' },
  purple: { bg:'#ede9fe',color:'#6d28d9',label:'Renouvellement' },
  red:    { bg:'#fee2e2',color:'#991b1b',label:'Annulation' },
}
const COLORS_LIST = ['green','blue','amber','purple','red']

const EMPTY_OPT: VisaOption = { type:'',typeColor:'green',price:'',delai:'',validite:'',docs_client:[],conditions:'' }
const EMPTY_CTR: Omit<Country,'id'> = { country:'',flag:'🌍',conditions:'',options:[{...EMPTY_OPT}],available:true,sort_order:99 }

export default function VisaPage() {
  const [data,      setData]      = useState<Country[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editMode,  setEditMode]  = useState(false)
  const [open,      setOpen]      = useState<Record<string,boolean>>({})
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState<Partial<Country>|null>(null)
  const [saving,    setSaving]    = useState(false)

  async function load() {
    const { data: rows } = await supabase.from('visa_countries').select('*').order('sort_order')
    setData(rows || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(c => !c.available && !editMode ? false :
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.options.some(o => o.type.toLowerCase().includes(search.toLowerCase()))
  )

  function toggle(id: string) { setOpen(p => ({ ...p, [id]: !p[id] })) }

  async function deleteCountry(id: string) {
    if (!confirm('Supprimer ce pays ?')) return
    await supabase.from('visa_countries').delete().eq('id', id)
    setData(d => d.filter(c => c.id !== id))
  }

  async function toggleAvailable(c: Country) {
    await supabase.from('visa_countries').update({ available: !c.available }).eq('id', c.id)
    setData(d => d.map(x => x.id === c.id ? { ...x, available: !x.available } : x))
  }

  function openModal(c?: Country) {
    setModal(c ? { ...c, options: c.options.map(o => ({ ...o })) } : { ...EMPTY_CTR, options: [{ ...EMPTY_OPT }] })
  }

  function setOpt(i: number, k: keyof VisaOption, v: string) {
    setModal(m => {
      if (!m) return m
      const opts = [...(m.options || [])]
      opts[i] = { ...opts[i], [k]: v }
      return { ...m, options: opts }
    })
  }
  function addOpt() { setModal(m => m ? { ...m, options: [...(m.options||[]), { ...EMPTY_OPT }] } : m) }
  function delOpt(i: number) { setModal(m => m ? { ...m, options: (m.options||[]).filter((_,j)=>j!==i) } : m) }

  async function save() {
    if (!modal) return
    if (!modal.country?.trim()) { alert('Nom du pays requis'); return }
    setSaving(true)
    const payload = {
      country:    modal.country!.trim(),
      flag:       modal.flag || '🌍',
      conditions: modal.conditions || null,
      available:  modal.available ?? true,
      sort_order: modal.sort_order ?? 99,
      options:    (modal.options || []).map(o => ({
        ...o,
        docs_client: typeof o.docs_client === 'string'
          ? (o.docs_client as unknown as string).split('\n').map((s:string)=>s.trim()).filter(Boolean)
          : (o.docs_client || []),
        docs_agence: typeof o.docs_agence === 'string'
          ? (o.docs_agence as unknown as string).split('\n').map((s:string)=>s.trim()).filter(Boolean)
          : (o.docs_agence || []),
      })),
      updated_at: new Date().toISOString(),
    }
    if (modal.id) {
      await supabase.from('visa_countries').update(payload).eq('id', modal.id)
    } else {
      await supabase.from('visa_countries').insert(payload)
    }
    setSaving(false); setModal(null); await load()
  }

  const darkBg = '#0e1c2e'
  const cardBg = '#13253a'
  const borderC = 'rgba(255,255,255,0.08)'
  const textMut = 'rgba(255,255,255,0.5)'

  return (
    <div style={{ minHeight:'calc(100vh - 44px)', background:darkBg, color:'#e8ecf0',
      fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#0a1828', borderBottom:`1px solid ${borderC}`, padding:'1rem 1.25rem' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.75rem' }}>
            <div>
              <h1 style={{ fontSize:'1.25rem',fontWeight:800,letterSpacing:'-0.3px' }}>🛂 Guide Visa</h1>
              <p style={{ fontSize:'0.8125rem',color:textMut,marginTop:3 }}>Aelia Travel — Offres disponibles</p>
            </div>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <button onClick={()=>setEditMode(!editMode)}
                style={{ padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8125rem',
                  fontWeight:600,fontFamily:'inherit',border:'none',
                  background:editMode?'#C96A2E':'rgba(255,255,255,0.08)',
                  color:editMode?'#fff':'rgba(255,255,255,0.7)' }}>
                {editMode?'✅ Fin édition':'✏️ Éditer'}
              </button>
              {editMode&&(
                <button onClick={()=>openModal()}
                  style={{ padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',
                    fontSize:'0.8125rem',fontWeight:700,background:'#1e6fa5',color:'white',
                    border:'none',fontFamily:'inherit' }}>+ Pays</button>
              )}
            </div>
          </div>
          <div style={{ marginTop:'0.75rem',position:'relative' }}>
            <input type="text" placeholder="🔍 Rechercher un pays ou type de visa…" value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%',padding:'0.625rem 1rem 0.625rem 2.5rem',borderRadius:'0.75rem',
                background:'rgba(255,255,255,0.06)',border:`1px solid ${borderC}`,
                color:'#e8ecf0',fontSize:'0.9375rem',outline:'none',fontFamily:'inherit' }}/>
            <span style={{ position:'absolute',left:'0.875rem',top:'50%',transform:'translateY(-50%)',
              color:textMut,fontSize:'0.9375rem' }}>🔍</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:800,margin:'0 auto',padding:'1rem 1.25rem',display:'flex',flexDirection:'column',gap:'0.625rem' }}>
        {loading ? [...Array(5)].map((_,i)=>(
          <div key={i} style={{ height:64,borderRadius:'0.875rem',background:cardBg,animation:'pulse 1.5s infinite' }}/>
        )) : filtered.length===0 ? (
          <div style={{ textAlign:'center',padding:'3rem',color:textMut }}>Aucun pays trouvé</div>
        ) : filtered.map(c=>(
          <div key={c.id} style={{ background:cardBg,borderRadius:'0.875rem',
            border:`1px solid ${borderC}`,overflow:'hidden',
            opacity:!c.available&&editMode?0.6:1,transition:'opacity 0.2s' }}>
            <div onClick={()=>toggle(c.id)}
              style={{ display:'flex',alignItems:'center',gap:12,padding:'0.875rem 1rem',cursor:'pointer' }}>
              <span style={{ fontSize:'1.75rem',flexShrink:0 }}>{c.flag}</span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:700,fontSize:'1rem' }}>{c.country}</div>
                <div style={{ display:'flex',gap:6,marginTop:4,flexWrap:'wrap' }}>
                  {[...new Set(c.options.map(o=>o.typeColor))].map(col=>{
                    const b=BADGE_COLORS[col]||BADGE_COLORS.green
                    return <span key={col} style={{ padding:'1px 8px',borderRadius:20,fontSize:'0.6875rem',
                      fontWeight:600,background:b.bg,color:b.color }}>{b.label}</span>
                  })}
                  <span style={{ fontSize:'0.75rem',color:'#C96A2E',fontWeight:600 }}>
                    {c.options.length>1?'dès ':''}{c.options[0].price}
                  </span>
                </div>
              </div>
              {editMode&&(
                <div style={{ display:'flex',gap:6 }} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>toggleAvailable(c)}
                    style={{ padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',
                      fontSize:'0.75rem',border:'1px solid rgba(255,255,255,0.15)',
                      background:'transparent',color:c.available?'#10b981':'#9ca3af',fontFamily:'inherit' }}>
                    {c.available?'Visible':'Masqué'}
                  </button>
                  <button onClick={()=>openModal(c)}
                    style={{ padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',
                      fontSize:'0.875rem',border:'1px solid rgba(255,255,255,0.15)',
                      background:'transparent',color:'#60a5fa',fontFamily:'inherit' }}>✏️</button>
                  <button onClick={()=>deleteCountry(c.id)}
                    style={{ padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',
                      fontSize:'0.875rem',border:'1px solid rgba(255,0,0,0.2)',
                      background:'transparent',color:'#f87171',fontFamily:'inherit' }}>🗑</button>
                </div>
              )}
              <span style={{ color:textMut,fontSize:'1rem',flexShrink:0,transition:'transform 0.2s',
                transform:open[c.id]?'rotate(180deg)':'rotate(0deg)' }}>▼</span>
            </div>
            {open[c.id]&&(
              <div style={{ borderTop:`1px solid ${borderC}`,padding:'0.875rem 1rem',
                display:'flex',flexDirection:'column',gap:'1rem' }}>
                {c.options.map((opt,oi)=>(
                  <div key={oi} style={{ background:'rgba(255,255,255,0.04)',borderRadius:'0.75rem',padding:'0.875rem' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',
                      flexWrap:'wrap',gap:8,marginBottom:'0.75rem' }}>
                      <div>
                        <span style={{ ...(BADGE_COLORS[opt.typeColor]||BADGE_COLORS.green),
                          padding:'2px 10px',borderRadius:20,fontSize:'0.75rem',fontWeight:700 }}>
                          {BADGE_COLORS[opt.typeColor]?.label||opt.typeColor}
                        </span>
                        <div style={{ fontWeight:700,fontSize:'0.9375rem',marginTop:6 }}>{opt.type}</div>
                      </div>
                      <span style={{ fontSize:'1.25rem',fontWeight:800,color:'#C96A2E',whiteSpace:'nowrap' }}>{opt.price}</span>
                    </div>
                    <div style={{ display:'flex',gap:'1.5rem',flexWrap:'wrap',marginBottom:'0.75rem' }}>
                      {opt.delai&&<div><div style={{ fontSize:'0.6875rem',color:textMut,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:2 }}>Délai</div><div style={{ fontSize:'0.875rem' }}>{opt.delai}</div></div>}
                      {opt.validite&&<div><div style={{ fontSize:'0.6875rem',color:textMut,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:2 }}>Validité</div><div style={{ fontSize:'0.875rem' }}>{opt.validite}</div></div>}
                    </div>
                    {opt.docs_client?.length ? <div style={{ marginBottom:'0.625rem' }}><div style={{ fontSize:'0.6875rem',color:textMut,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6 }}>Documents client</div><ul style={{ margin:0,paddingLeft:'1.25rem',display:'flex',flexDirection:'column',gap:3 }}>{opt.docs_client.map((d,di)=><li key={di} style={{ fontSize:'0.875rem' }}>{d}</li>)}</ul></div>:null}
                    {opt.note&&<div style={{ background:'rgba(201,106,46,0.1)',border:'1px solid rgba(201,106,46,0.2)',borderRadius:'0.5rem',padding:'0.625rem 0.75rem',fontSize:'0.8125rem',color:'#C96A2E',marginBottom:'0.5rem' }}>📌 {opt.note}</div>}
                    {opt.conditions&&<div style={{ background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:'0.5rem',padding:'0.625rem 0.75rem',fontSize:'0.8125rem',color:'#fca5a5' }}>⚠️ {opt.conditions}</div>}
                  </div>
                ))}
                {c.conditions&&<div style={{ background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:'0.75rem',padding:'0.75rem',fontSize:'0.875rem',color:'#fca5a5' }}>⚠️ Conditions générales : {c.conditions}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal CRUD */}
      {modal&&(
        <div style={{ position:'fixed',inset:0,zIndex:800,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'1rem',overflow:'auto',background:'rgba(0,0,0,0.8)' }}>
          <div style={{ width:'100%',maxWidth:600,background:'#162232',borderRadius:'1rem',
            border:`1px solid ${borderC}`,marginTop:'1rem',marginBottom:'1rem' }}>
            <div style={{ padding:'1rem 1.25rem',borderBottom:`1px solid ${borderC}`,
              display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h3 style={{ fontWeight:700,color:'#e8ecf0',fontSize:'1rem' }}>
                {modal.id?`✏️ Modifier — ${modal.country}`:'➕ Nouveau pays'}
              </h3>
              <button onClick={()=>setModal(null)} style={{ background:'none',border:'none',cursor:'pointer',
                color:textMut,fontSize:'1.25rem',padding:'0.25rem',lineHeight:1,fontFamily:'inherit' }}>✕</button>
            </div>
            <div style={{ padding:'1.25rem',display:'flex',flexDirection:'column',gap:'1rem',maxHeight:'70vh',overflowY:'auto' }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 80px',gap:'0.75rem' }}>
                <div>
                  <label style={{ display:'block',fontSize:'0.75rem',color:textMut,marginBottom:4 }}>Nom du pays *</label>
                  <input value={modal.country||''} onChange={e=>setModal(m=>m?{...m,country:e.target.value}:m)}
                    placeholder="Ex: Turquie" style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',
                      background:'rgba(255,255,255,0.07)',border:`1px solid ${borderC}`,color:'#e8ecf0',
                      fontSize:'0.875rem',outline:'none',fontFamily:'inherit' }}/>
                </div>
                <div>
                  <label style={{ display:'block',fontSize:'0.75rem',color:textMut,marginBottom:4 }}>Drapeau</label>
                  <input value={modal.flag||'🌍'} onChange={e=>setModal(m=>m?{...m,flag:e.target.value}:m)}
                    style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',fontSize:'1.25rem',
                      background:'rgba(255,255,255,0.07)',border:`1px solid ${borderC}`,color:'#e8ecf0',
                      outline:'none',fontFamily:'inherit',textAlign:'center' }}/>
                </div>
              </div>
              <div>
                <label style={{ display:'block',fontSize:'0.75rem',color:textMut,marginBottom:4 }}>Conditions générales du pays (optionnel)</label>
                <textarea value={modal.conditions||''} onChange={e=>setModal(m=>m?{...m,conditions:e.target.value}:m)}
                  rows={2} placeholder="Conditions globales applicables à tous les visas de ce pays…"
                  style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',resize:'none',
                    background:'rgba(255,255,255,0.07)',border:`1px solid ${borderC}`,color:'#e8ecf0',
                    fontSize:'0.875rem',outline:'none',fontFamily:'inherit' }}/>
              </div>

              {/* Options visa */}
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.625rem' }}>
                  <label style={{ fontSize:'0.75rem',color:textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em' }}>Options visa</label>
                  <button onClick={addOpt}
                    style={{ padding:'0.25rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',
                      fontSize:'0.75rem',background:'#1e6fa5',color:'white',border:'none',fontFamily:'inherit' }}>+ Option</button>
                </div>
                {(modal.options||[]).map((opt,oi)=>(
                  <div key={oi} style={{ background:'rgba(255,255,255,0.04)',borderRadius:'0.75rem',
                    padding:'0.875rem',marginBottom:'0.625rem',border:`1px solid ${borderC}` }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.625rem' }}>
                      <span style={{ fontSize:'0.8125rem',fontWeight:600,color:'rgba(255,255,255,0.7)' }}>Option {oi+1}</span>
                      {(modal.options||[]).length>1&&(
                        <button onClick={()=>delOpt(oi)} style={{ background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:'1rem',padding:'0.25rem',fontFamily:'inherit' }}>🗑</button>
                      )}
                    </div>
                    {[
                      {k:'type' as const,label:'Type / Nom',ph:'Ex: E-Visa 30J — 1 sortie'},
                      {k:'price' as const,label:'Prix',ph:'Ex: 12 000 DA'},
                      {k:'delai' as const,label:'Délai',ph:'Ex: 5–7 jours ouvrables'},
                      {k:'validite' as const,label:'Validité',ph:'Ex: 30 jours'},
                    ].map(f=>(
                      <div key={f.k} style={{ marginBottom:'0.5rem' }}>
                        <label style={{ display:'block',fontSize:'0.6875rem',color:textMut,marginBottom:3 }}>{f.label}</label>
                        <input value={(opt[f.k] as string)||''} onChange={e=>setOpt(oi,f.k,e.target.value)}
                          placeholder={f.ph} style={{ width:'100%',padding:'0.4rem 0.625rem',borderRadius:'0.5rem',
                            background:'rgba(255,255,255,0.06)',border:`1px solid ${borderC}`,color:'#e8ecf0',
                            fontSize:'0.8125rem',outline:'none',fontFamily:'inherit' }}/>
                      </div>
                    ))}
                    <div style={{ marginBottom:'0.5rem' }}>
                      <label style={{ display:'block',fontSize:'0.6875rem',color:textMut,marginBottom:3 }}>Couleur du badge</label>
                      <div style={{ display:'flex',gap:6 }}>
                        {COLORS_LIST.map(col=>{
                          const b=BADGE_COLORS[col]
                          return <button key={col} onClick={()=>setOpt(oi,'typeColor',col)}
                            style={{ padding:'3px 10px',borderRadius:20,cursor:'pointer',fontSize:'0.75rem',
                              fontWeight:600,border:`2px solid ${opt.typeColor===col?b.color:'transparent'}`,
                              background:b.bg,color:b.color,fontFamily:'inherit' }}>{b.label}</button>
                        })}
                      </div>
                    </div>
                    <div style={{ marginBottom:'0.5rem' }}>
                      <label style={{ display:'block',fontSize:'0.6875rem',color:textMut,marginBottom:3 }}>Documents client (1 par ligne)</label>
                      <textarea value={Array.isArray(opt.docs_client)?opt.docs_client.join('\n'):(opt.docs_client as unknown as string||'')}
                        onChange={e=>setOpt(oi,'docs_client' as keyof VisaOption,e.target.value)} rows={4}
                        placeholder="Scan passeport&#10;Photo fond blanc&#10;…"
                        style={{ width:'100%',padding:'0.4rem 0.625rem',borderRadius:'0.5rem',resize:'vertical',
                          background:'rgba(255,255,255,0.06)',border:`1px solid ${borderC}`,color:'#e8ecf0',
                          fontSize:'0.8125rem',outline:'none',fontFamily:'inherit' }}/>
                    </div>
                    <div style={{ marginBottom:'0.5rem' }}>
                      <label style={{ display:'block',fontSize:'0.6875rem',color:textMut,marginBottom:3 }}>Conditions / Note</label>
                      <textarea value={opt.conditions||''} onChange={e=>setOpt(oi,'conditions',e.target.value)} rows={2}
                        placeholder="Aucun remboursement en cas de refus…"
                        style={{ width:'100%',padding:'0.4rem 0.625rem',borderRadius:'0.5rem',resize:'vertical',
                          background:'rgba(255,255,255,0.06)',border:`1px solid ${borderC}`,color:'#e8ecf0',
                          fontSize:'0.8125rem',outline:'none',fontFamily:'inherit' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:'1rem 1.25rem',borderTop:`1px solid ${borderC}`,display:'flex',gap:'0.75rem' }}>
              <button onClick={()=>setModal(null)} style={{ flex:1,padding:'0.75rem',borderRadius:'0.75rem',cursor:'pointer',
                background:'rgba(255,255,255,0.06)',border:`1px solid ${borderC}`,color:'rgba(255,255,255,0.6)',fontFamily:'inherit',fontSize:'0.875rem' }}>
                Annuler
              </button>
              <button onClick={save} disabled={saving} style={{ flex:2,padding:'0.75rem',borderRadius:'0.75rem',cursor:saving?'wait':'pointer',
                background:saving?'#1e6fa5':'#C96A2E',color:'white',border:'none',fontWeight:700,fontFamily:'inherit',fontSize:'0.9375rem',opacity:saving?0.7:1 }}>
                {saving?'⏳ Sauvegarde…':'💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
