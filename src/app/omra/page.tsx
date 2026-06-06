'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Departure { id:string; num:number; depart:string; retour:string; nights:number; available:boolean; sort_order:number }
interface Hotel { name:string; stars:string; prices:Record<string,string> }
interface Include { icon:string; label:string }
interface Config { id:number; title:string; subtitle:string; tagline:string; airline:string; hotels:Hotel[]; includes:Include[] }

const EMPTY_DEP: Omit<Departure,'id'> = { num:0,depart:'',retour:'',nights:14,available:true,sort_order:99 }
const ROOM_TYPES = ['خماسية (5)','رباعية (4)','ثلاثية (3)','ثنائية (2)']

export default function OmraPage() {
  const [deps,     setDeps]     = useState<Departure[]>([])
  const [config,   setConfig]   = useState<Config|null>(null)
  const [loading,  setLoading]  = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [depModal, setDepModal] = useState<Partial<Departure>|null>(null)
  const [cfgEdit,  setCfgEdit]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('omra_departures').select('*').order('sort_order'),
      supabase.from('omra_config').select('*').eq('id',1).single(),
    ])
    setDeps(d || []); setConfig(c || null); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function saveDep() {
    if (!depModal) return
    if (!depModal.depart?.trim()||!depModal.retour?.trim()) { alert('Dates requises'); return }
    setSaving(true)
    const p = { num:depModal.num||0,depart:depModal.depart,retour:depModal.retour,
      nights:depModal.nights||14,available:depModal.available??true,
      sort_order:depModal.sort_order??99,updated_at:new Date().toISOString() }
    if (depModal.id) await supabase.from('omra_departures').update(p).eq('id',depModal.id)
    else await supabase.from('omra_departures').insert(p)
    setSaving(false); setDepModal(null); await load()
  }

  async function deleteDep(id:string) {
    if (!confirm('Supprimer ce départ ?')) return
    await supabase.from('omra_departures').delete().eq('id',id)
    setDeps(d => d.filter(x => x.id!==id))
  }

  async function toggleDep(dep:Departure) {
    await supabase.from('omra_departures').update({ available:!dep.available }).eq('id',dep.id)
    setDeps(d => d.map(x => x.id===dep.id ? {...x,available:!x.available} : x))
  }

  async function saveConfig() {
    if (!config) return
    setSaving(true)
    await supabase.from('omra_config').update({ ...config, updated_at:new Date().toISOString() }).eq('id',1)
    setSaving(false); setCfgEdit(false); await load()
  }

  function setHotelPrice(hi:number, room:string, val:string) {
    setConfig(c => { if(!c) return c; const h=[...c.hotels]; h[hi]={...h[hi],prices:{...h[hi].prices,[room]:val}}; return {...c,hotels:h} })
  }
  function setHotelField(hi:number, k:'name'|'stars', v:string) {
    setConfig(c => { if(!c) return c; const h=[...c.hotels]; h[hi]={...h[hi],[k]:v}; return {...c,hotels:h} })
  }
  function addHotel() { setConfig(c=>c?{...c,hotels:[...c.hotels,{name:'',stars:'★★★',prices:{}}]}:c) }
  function delHotel(i:number) { setConfig(c=>c?{...c,hotels:c.hotels.filter((_,j)=>j!==i)}:c) }
  function setInclude(i:number, k:'icon'|'label', v:string) {
    setConfig(c=>{ if(!c) return c; const inc=[...c.includes]; inc[i]={...inc[i],[k]:v}; return {...c,includes:inc} })
  }
  function addInclude() { setConfig(c=>c?{...c,includes:[...c.includes,{icon:'✅',label:''}]}:c) }
  function delInclude(i:number) { setConfig(c=>c?{...c,includes:c.includes.filter((_,j)=>j!==i)}:c) }

  const bg='#F7F5F0'; const navy='#1A2440'; const gold='#C8952A'; const cream='#FDF8F0'
  const cardSh='0 2px 16px rgba(0,0,0,0.08)'; const brd='1px solid #E8E4DC'

  return (
    <div dir="rtl" style={{ minHeight:'calc(100vh - 44px)', background:bg,
      fontFamily:'Georgia,"Times New Roman",serif', color:navy }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${navy} 0%,#243060 100%)`,
        padding:'2rem 1.25rem 1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-40,left:-40,width:200,height:200,
          borderRadius:'50%',background:'rgba(200,149,42,0.08)' }}/>
        <div style={{ maxWidth:800,margin:'0 auto',position:'relative',zIndex:1 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.75rem',marginBottom:'1rem' }}>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>setEditMode(!editMode)}
                style={{ padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8125rem',
                  fontWeight:600,fontFamily:'inherit',border:'none',
                  background:editMode?gold:'rgba(255,255,255,0.1)',
                  color:editMode?navy:'rgba(255,255,255,0.7)' }}>
                {editMode?'✅ Fin édition':'✏️ Éditer'}
              </button>
              {editMode&&<>
                <button onClick={()=>setDepModal({...EMPTY_DEP,num:deps.length+1})}
                  style={{ padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8125rem',
                    fontWeight:700,background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',fontFamily:'inherit' }}>+ Départ</button>
                <button onClick={()=>setCfgEdit(true)}
                  style={{ padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8125rem',
                    fontWeight:700,background:'rgba(200,149,42,0.3)',color:'#fde68a',border:'none',fontFamily:'inherit' }}>⚙️ Config</button>
              </>}
            </div>
          </div>
          {config&&<>
            <div style={{ textAlign:'center',marginBottom:'0.5rem' }}>
              <div style={{ fontSize:'clamp(2rem,6vw,3rem)',fontWeight:400,color:'#fff',lineHeight:1.2 }}>{config.title}</div>
              <div style={{ fontSize:'clamp(1rem,3vw,1.5rem)',color:gold,marginTop:'0.25rem',fontWeight:300 }}>{config.subtitle}</div>
              <div style={{ fontSize:'0.9375rem',color:'rgba(255,255,255,0.6)',marginTop:'0.5rem',fontStyle:'italic' }}>{config.tagline}</div>
            </div>
            <div style={{ display:'flex',justifyContent:'center',marginTop:'1rem' }}>
              <div style={{ background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:'2rem',padding:'0.5rem 1.5rem',display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:'1.25rem' }}>✈️</span>
                <span style={{ color:'rgba(255,255,255,0.85)',fontSize:'0.9375rem' }}>{config.airline}</span>
              </div>
            </div>
          </>}
        </div>
      </div>

      <div style={{ maxWidth:800,margin:'0 auto',padding:'1.25rem' }}>

        {/* Services inclus */}
        {config?.includes?.length ? (
          <div style={{ display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'0.75rem',
            marginBottom:'1.5rem',padding:'1rem',background:cream,borderRadius:'1rem',border:brd,boxShadow:cardSh }}>
            {config.includes.map((inc,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',gap:6,
                padding:'0.375rem 0.875rem',background:'rgba(26,36,64,0.06)',borderRadius:'2rem' }}>
                <span style={{ fontSize:'1.125rem' }}>{inc.icon}</span>
                <span style={{ fontSize:'0.875rem',fontWeight:600 }}>{inc.label}</span>
              </div>
            ))}
          </div>
        ):null}

        {/* Hôtels / prix */}
        {loading ? <div style={{ height:200,background:'#eee',borderRadius:'1rem',marginBottom:'1.5rem' }}/> :
          config?.hotels?.length ? (
          <div style={{ marginBottom:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem' }}>
            {config.hotels.map((h,hi)=>(
              <div key={hi} style={{ background:cream,borderRadius:'1rem',border:brd,boxShadow:cardSh,overflow:'hidden' }}>
                <div style={{ background:`linear-gradient(90deg,${navy},#243060)`,padding:'0.75rem 1.25rem',
                  display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div>
                    <div style={{ color:'#fff',fontWeight:700,fontSize:'1rem' }}>{h.name}</div>
                    <div style={{ color:gold,fontSize:'0.875rem',marginTop:2 }}>{h.stars}</div>
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',minWidth:300 }}>
                    <thead><tr style={{ background:'rgba(26,36,64,0.06)' }}>
                      <th style={{ padding:'0.625rem 1rem',textAlign:'right',fontSize:'0.75rem',
                        fontWeight:700,color:'rgba(26,36,64,0.5)',letterSpacing:'0.05em' }}>الغرفة</th>
                      <th style={{ padding:'0.625rem 1rem',textAlign:'center',fontSize:'0.75rem',
                        fontWeight:700,color:'rgba(26,36,64,0.5)',letterSpacing:'0.05em' }}>السعر / شخص (DA)</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(h.prices).map(([room,price],ri)=>(
                        <tr key={ri} style={{ borderTop:'1px solid rgba(26,36,64,0.06)',
                          background:ri%2===1?'rgba(200,149,42,0.04)':'transparent' }}>
                          <td style={{ padding:'0.625rem 1rem',fontWeight:600,fontSize:'0.9375rem' }}>{room}</td>
                          <td style={{ padding:'0.625rem 1rem',textAlign:'center',fontWeight:700,
                            fontSize:'0.9375rem',color:gold,fontVariantNumeric:'tabular-nums' }}>{price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ):null}

        {/* Départs */}
        <div style={{ marginBottom:'0.75rem',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <h2 style={{ fontSize:'1.125rem',fontWeight:700 }}>مواعيد الرحلات</h2>
          {editMode&&<button onClick={()=>setDepModal({...EMPTY_DEP,num:deps.length+1})}
            style={{ padding:'0.375rem 0.875rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.8125rem',
              fontWeight:700,background:navy,color:gold,border:'none',fontFamily:'inherit' }}>+ Départ</button>}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.875rem',marginBottom:'2rem' }}>
          {loading ? [...Array(4)].map((_,i)=><div key={i} style={{ height:120,background:'#eee',borderRadius:'0.875rem' }}/>) :
          deps.filter(d=>editMode||d.available).map(d=>(
            <div key={d.id} style={{ background:cream,borderRadius:'0.875rem',border:brd,
              boxShadow:cardSh,overflow:'hidden',opacity:!d.available&&editMode?0.5:1 }}>
              <div style={{ background:gold,padding:'0.625rem 1rem',display:'flex',alignItems:'center',
                justifyContent:'space-between' }}>
                <span style={{ color:navy,fontWeight:800,fontSize:'0.9375rem' }}>رحلة {d.num}</span>
                {editMode&&<div style={{ display:'flex',gap:4 }}>
                  <button onClick={()=>toggleDep(d)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',
                    color:navy,fontFamily:'inherit' }}>{d.available?'👁':'🚫'}</button>
                  <button onClick={()=>setDepModal({...d})} style={{ background:'none',border:'none',cursor:'pointer',
                    fontSize:'0.75rem',color:navy,fontFamily:'inherit' }}>✏️</button>
                  <button onClick={()=>deleteDep(d.id)} style={{ background:'none',border:'none',cursor:'pointer',
                    fontSize:'0.75rem',color:'#991b1b',fontFamily:'inherit' }}>🗑</button>
                </div>}
              </div>
              <div style={{ padding:'0.875rem 1rem' }}>
                <div style={{ display:'flex',gap:6,alignItems:'center',marginBottom:4 }}>
                  <span style={{ fontSize:'0.75rem',color:'rgba(26,36,64,0.5)' }}>✈️ ذهاب:</span>
                  <span style={{ fontWeight:700,fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums' }}>{d.depart}</span>
                </div>
                <div style={{ display:'flex',gap:6,alignItems:'center',marginBottom:6 }}>
                  <span style={{ fontSize:'0.75rem',color:'rgba(26,36,64,0.5)' }}>✈️ عودة:</span>
                  <span style={{ fontWeight:700,fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums' }}>{d.retour}</span>
                </div>
                <div style={{ background:'rgba(26,36,64,0.06)',borderRadius:'0.5rem',padding:'0.375rem 0.625rem',
                  textAlign:'center',fontSize:'0.875rem',fontWeight:600,color:navy }}>
                  🌙 {d.nights} ليلة
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal départ */}
      {depModal&&(
        <div style={{ position:'fixed',inset:0,zIndex:800,display:'flex',alignItems:'center',
          justifyContent:'center',padding:'1rem',background:'rgba(0,0,0,0.7)' }}>
          <div style={{ width:'100%',maxWidth:420,background:'#fff',borderRadius:'1rem',
            border:brd,boxShadow:'0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'1rem 1.25rem',borderBottom:brd,display:'flex',
              alignItems:'center',justifyContent:'space-between' }}>
              <h3 style={{ fontWeight:700,color:navy }}>
                {depModal.id?`✏️ Modifier départ ${depModal.num}`:'➕ Nouveau départ'}
              </h3>
              <button onClick={()=>setDepModal(null)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.25rem',color:'#9ca3af',fontFamily:'inherit' }}>✕</button>
            </div>
            <div style={{ padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.875rem' }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem' }}>
                <div>
                  <label style={{ display:'block',fontSize:'0.75rem',color:navy,fontWeight:600,marginBottom:4 }}>N° départ</label>
                  <input type="number" value={depModal.num||''} onChange={e=>setDepModal(m=>m?{...m,num:parseInt(e.target.value)||0}:m)}
                    style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy }}/>
                </div>
                <div>
                  <label style={{ display:'block',fontSize:'0.75rem',color:navy,fontWeight:600,marginBottom:4 }}>Nuits</label>
                  <input type="number" value={depModal.nights||14} onChange={e=>setDepModal(m=>m?{...m,nights:parseInt(e.target.value)||14}:m)}
                    style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy }}/>
                </div>
              </div>
              <div>
                <label style={{ display:'block',fontSize:'0.75rem',color:navy,fontWeight:600,marginBottom:4 }}>Date aller (ex: 15/06/2026)</label>
                <input value={depModal.depart||''} onChange={e=>setDepModal(m=>m?{...m,depart:e.target.value}:m)}
                  placeholder="JJ/MM/AAAA" style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy }}/>
              </div>
              <div>
                <label style={{ display:'block',fontSize:'0.75rem',color:navy,fontWeight:600,marginBottom:4 }}>Date retour (ex: 29/06/2026)</label>
                <input value={depModal.retour||''} onChange={e=>setDepModal(m=>m?{...m,retour:e.target.value}:m)}
                  placeholder="JJ/MM/AAAA" style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy }}/>
              </div>
            </div>
            <div style={{ padding:'1rem 1.25rem',borderTop:brd,display:'flex',gap:'0.75rem' }}>
              <button onClick={()=>setDepModal(null)} style={{ flex:1,padding:'0.75rem',borderRadius:'0.75rem',cursor:'pointer',
                background:'#f3f4f6',border:'none',color:'#374151',fontFamily:'inherit',fontSize:'0.875rem' }}>Annuler</button>
              <button onClick={saveDep} disabled={saving} style={{ flex:2,padding:'0.75rem',borderRadius:'0.75rem',cursor:saving?'wait':'pointer',
                background:saving?'#9ca3af':gold,color:navy,border:'none',fontWeight:700,fontFamily:'inherit',fontSize:'0.9375rem' }}>
                {saving?'⏳ Sauvegarde…':'💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal config hôtels/includes */}
      {cfgEdit&&config&&(
        <div style={{ position:'fixed',inset:0,zIndex:800,display:'flex',alignItems:'flex-start',
          justifyContent:'center',padding:'1rem',overflow:'auto',background:'rgba(0,0,0,0.75)' }}>
          <div style={{ width:'100%',maxWidth:600,background:'#fff',borderRadius:'1rem',
            border:brd,boxShadow:'0 16px 48px rgba(0,0,0,0.2)',marginBottom:'1rem' }}>
            <div style={{ padding:'1rem 1.25rem',borderBottom:brd,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h3 style={{ fontWeight:700,color:navy }}>⚙️ Configuration Omra</h3>
              <button onClick={()=>setCfgEdit(false)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.25rem',color:'#9ca3af',fontFamily:'inherit' }}>✕</button>
            </div>
            <div style={{ padding:'1.25rem',display:'flex',flexDirection:'column',gap:'1.25rem',maxHeight:'70vh',overflowY:'auto' }}>
              {/* Titre/sous-titre */}
              {[{k:'title' as const,l:'Titre principal (arabe)'},{k:'subtitle' as const,l:'Sous-titre'},{k:'tagline' as const,l:'Accroche'},{k:'airline' as const,l:'Compagnie aérienne'}].map(f=>(
                <div key={f.k}>
                  <label style={{ display:'block',fontSize:'0.75rem',color:navy,fontWeight:600,marginBottom:4 }}>{f.l}</label>
                  <input value={config[f.k]||''} onChange={e=>setConfig(c=>c?{...c,[f.k]:e.target.value}:c)}
                    dir={f.k==='title'||f.k==='tagline'?'rtl':'ltr'}
                    style={{ width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy }}/>
                </div>
              ))}
              {/* Hôtels */}
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.625rem' }}>
                  <label style={{ fontSize:'0.8125rem',color:navy,fontWeight:700 }}>Hôtels</label>
                  <button onClick={addHotel} style={{ padding:'0.25rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',
                    fontSize:'0.75rem',background:navy,color:gold,border:'none',fontFamily:'inherit' }}>+ Hôtel</button>
                </div>
                {config.hotels.map((h,hi)=>(
                  <div key={hi} style={{ background:'#f9fafb',borderRadius:'0.75rem',padding:'0.875rem',marginBottom:'0.625rem',border:brd }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.625rem' }}>
                      <span style={{ fontSize:'0.875rem',fontWeight:600,color:navy }}>Hôtel {hi+1}</span>
                      <button onClick={()=>delHotel(hi)} style={{ background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontFamily:'inherit' }}>🗑</button>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0.5rem',marginBottom:'0.5rem' }}>
                      <input value={h.name} onChange={e=>setHotelField(hi,'name',e.target.value)} placeholder="Nom de l hôtel"
                        style={{ padding:'0.4rem 0.625rem',borderRadius:'0.5rem',border:brd,fontSize:'0.8125rem',outline:'none',fontFamily:'inherit',color:navy }}/>
                      <input value={h.stars} onChange={e=>setHotelField(hi,'stars',e.target.value)} placeholder="★★★"
                        style={{ padding:'0.4rem 0.625rem',borderRadius:'0.5rem',border:brd,fontSize:'0.8125rem',outline:'none',fontFamily:'inherit',color:gold,textAlign:'center' }}/>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem' }}>
                      {ROOM_TYPES.map(rt=>(
                        <div key={rt} style={{ display:'flex',alignItems:'center',gap:4 }}>
                          <span style={{ fontSize:'0.6875rem',color:'rgba(26,36,64,0.5)',flexShrink:0,minWidth:70,textAlign:'right' }}>{rt}</span>
                          <input value={h.prices[rt]||''} onChange={e=>setHotelPrice(hi,rt,e.target.value)}
                            placeholder="0" style={{ flex:1,padding:'0.25rem 0.375rem',borderRadius:'0.375rem',border:brd,
                              fontSize:'0.75rem',outline:'none',fontFamily:'inherit',color:navy,fontVariantNumeric:'tabular-nums' }}/>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Includes */}
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.625rem' }}>
                  <label style={{ fontSize:'0.8125rem',color:navy,fontWeight:700 }}>Services inclus</label>
                  <button onClick={addInclude} style={{ padding:'0.25rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',
                    fontSize:'0.75rem',background:navy,color:gold,border:'none',fontFamily:'inherit' }}>+ Service</button>
                </div>
                {config.includes.map((inc,i)=>(
                  <div key={i} style={{ display:'grid',gridTemplateColumns:'60px 1fr auto',gap:'0.5rem',marginBottom:'0.375rem',alignItems:'center' }}>
                    <input value={inc.icon} onChange={e=>setInclude(i,'icon',e.target.value)}
                      style={{ padding:'0.375rem',borderRadius:'0.375rem',border:brd,fontSize:'1.125rem',outline:'none',textAlign:'center',fontFamily:'inherit' }}/>
                    <input value={inc.label} onChange={e=>setInclude(i,'label',e.target.value)} placeholder="Label en arabe"
                      dir="rtl" style={{ padding:'0.375rem 0.5rem',borderRadius:'0.375rem',border:brd,fontSize:'0.8125rem',outline:'none',fontFamily:'inherit',color:navy }}/>
                    <button onClick={()=>delInclude(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontFamily:'inherit',padding:'0.25rem' }}>🗑</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:'1rem 1.25rem',borderTop:brd,display:'flex',gap:'0.75rem' }}>
              <button onClick={()=>setCfgEdit(false)} style={{ flex:1,padding:'0.75rem',borderRadius:'0.75rem',cursor:'pointer',
                background:'#f3f4f6',border:'none',color:'#374151',fontFamily:'inherit',fontSize:'0.875rem' }}>Annuler</button>
              <button onClick={saveConfig} disabled={saving} style={{ flex:2,padding:'0.75rem',borderRadius:'0.75rem',cursor:saving?'wait':'pointer',
                background:saving?'#9ca3af':gold,color:navy,border:'none',fontWeight:700,fontFamily:'inherit',fontSize:'0.9375rem' }}>
                {saving?'⏳ Sauvegarde…':'💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
