'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Hotel { id:string;departure_id:string;name:string;stars:string;distance:string|null;prices:Record<string,number>;price_child_u2:number;price_child_u12_no_bed:number;price_child_u12_with_bed:number;remarks:string|null;sort_order:number }
interface Departure { id:string;num:number;depart:string;retour:string;nights:number;airline:string;supplier:string;flight_out:string|null;flight_ret:string|null;available:boolean;sort_order:number;hotels?:Hotel[] }
interface Config { id:number;title:string;subtitle:string;tagline:string }
const ROOMS=['خماسية (5)','رباعية (4)','ثلاثية (3)','ثنائية (2)']
const navy='#1A2440';const gold='#C8952A';const brd='1px solid #E8E4DC'
const fDA=(n:number)=>n?n.toLocaleString('fr-DZ')+' DA':'—'
const EDEP={num:0,depart:'',retour:'',nights:14,airline:'Saudia',supplier:'Maham',flight_out:'',flight_ret:'',available:true,sort_order:99}
const EHTL={name:'',stars:'★★★',distance:'',prices:{} as Record<string,number>,price_child_u2:0,price_child_u12_no_bed:0,price_child_u12_with_bed:0,remarks:''}
const inp=(extra?:React.CSSProperties):React.CSSProperties=>({width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy,direction:'ltr',...extra})
const lbl=(t:string,bold?:boolean)=><label style={{display:'block',fontSize:'0.75rem',color:navy,fontWeight:bold?700:600,marginBottom:4}}>{t}</label>

export default function OmraPage(){
  const[deps,setDeps]=useState<Departure[]>([])
  const[cfg,setCfg]=useState<Config|null>(null)
  const[loading,setLoading]=useState(true)
  const[editMode,setEditMode]=useState(false)
  const[openD,setOpenD]=useState<Record<string,boolean>>({})
  const[openH,setOpenH]=useState<Record<string,boolean>>({})
  const[depM,setDepM]=useState<Partial<Departure>|null>(null)
  const[htlM,setHtlM]=useState<{h:Partial<Hotel>;depId:string}|null>(null)
  const[saving,setSaving]=useState(false)

  const load=useCallback(async()=>{
    const[{data:d},{data:c},{data:h}]=await Promise.all([
      supabase.from('omra_departures').select('*').order('sort_order'),
      supabase.from('omra_config').select('id,title,subtitle,tagline').eq('id',1).single(),
      supabase.from('omra_hotels').select('*').order('sort_order'),
    ])
    const hotels=(h||[]) as Hotel[]
    setDeps((d||[]).map((dep:Departure)=>({...dep,hotels:hotels.filter(ht=>ht.departure_id===dep.id)})))
    setCfg(c);setLoading(false)
  },[])
  useEffect(()=>{load()},[load])

  async function saveDep(){
    if(!depM)return;setSaving(true)
    const p={num:depM.num||0,depart:depM.depart||'',retour:depM.retour||'',nights:depM.nights||14,airline:depM.airline||'Saudia',supplier:depM.supplier||'Maham',flight_out:depM.flight_out||null,flight_ret:depM.flight_ret||null,available:depM.available??true,sort_order:depM.sort_order??99,updated_at:new Date().toISOString()}
    if(depM.id)await supabase.from('omra_departures').update(p).eq('id',depM.id)
    else await supabase.from('omra_departures').insert(p)
    setSaving(false);setDepM(null);await load()
  }
  async function delDep(id:string){if(!confirm('Supprimer ce départ et ses hôtels ?'))return;await supabase.from('omra_departures').delete().eq('id',id);await load()}
  async function toggleDep(dep:Departure){await supabase.from('omra_departures').update({available:!dep.available}).eq('id',dep.id);await load()}

  async function saveHtl(){
    if(!htlM)return;setSaving(true)
    const{h,depId}=htlM
    const p={departure_id:depId,name:h.name||'N/A',stars:h.stars||'★★★',distance:h.distance||null,prices:h.prices||{},price_child_u2:h.price_child_u2||0,price_child_u12_no_bed:h.price_child_u12_no_bed||0,price_child_u12_with_bed:h.price_child_u12_with_bed||0,remarks:h.remarks||null,sort_order:h.sort_order||0,updated_at:new Date().toISOString()}
    if(h.id)await supabase.from('omra_hotels').update(p).eq('id',h.id)
    else await supabase.from('omra_hotels').insert(p)
    setSaving(false);setHtlM(null);await load()
  }
  async function delHtl(id:string){if(!confirm('Supprimer cet hôtel ?'))return;await supabase.from('omra_hotels').delete().eq('id',id);await load()}
  const setHP=(room:string,v:string)=>setHtlM(m=>m?{...m,h:{...m.h,prices:{...(m.h.prices||{}),[room]:parseInt(v)||0}}}:m)

  return(
    <div dir="rtl" style={{minHeight:'calc(100vh - 44px)',background:'#F7F5F0',fontFamily:'Georgia,serif',color:navy}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${navy},#243060)`,padding:'1.5rem 1.25rem'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:'1rem'}}>
            <button onClick={()=>setEditMode(!editMode)} style={{padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8125rem',fontWeight:600,fontFamily:'inherit',border:'none',background:editMode?gold:'rgba(255,255,255,0.1)',color:editMode?navy:'rgba(255,255,255,0.7)'}}>
              {editMode?'✅ Fin édition':'✏️ Éditer'}</button>
            {editMode&&<button onClick={()=>setDepM({...EDEP,num:deps.length+1})} style={{padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8125rem',fontWeight:700,background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',fontFamily:'inherit'}}>+ Départ</button>}
          </div>
          {cfg&&<div style={{textAlign:'center'}}>
            <div style={{fontSize:'clamp(1.75rem,5vw,2.75rem)',color:'#fff'}}>{cfg.title}</div>
            <div style={{fontSize:'clamp(0.9rem,2.5vw,1.25rem)',color:gold,marginTop:'0.25rem',fontWeight:300}}>{cfg.subtitle}</div>
            <div style={{fontSize:'0.9rem',color:'rgba(255,255,255,0.6)',marginTop:'0.5rem',fontStyle:'italic'}}>{cfg.tagline}</div>
          </div>}
        </div>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'1.25rem'}}>
        {loading?[...Array(3)].map((_,i)=><div key={i} style={{height:80,background:'#e8e4dc',borderRadius:'0.875rem',marginBottom:'0.75rem'}}/>):
        deps.filter(d=>editMode||d.available).map(dep=>(
          <div key={dep.id} style={{background:'#FDF8F0',borderRadius:'1rem',border:brd,boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'0.875rem',overflow:'hidden',opacity:!dep.available&&editMode?0.6:1}}>
            {/* Header départ */}
            <div onClick={()=>setOpenD(p=>({...p,[dep.id]:!p[dep.id]}))} style={{display:'flex',alignItems:'center',gap:12,padding:'0.875rem 1rem',cursor:'pointer',background:`linear-gradient(90deg,${navy},#243060)`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4}}>
                  <span style={{background:gold,color:navy,fontWeight:800,fontSize:'0.875rem',padding:'2px 10px',borderRadius:20}}>رحلة {dep.num}</span>
                  <span style={{color:'rgba(255,255,255,0.65)',fontSize:'0.8125rem'}}>{dep.airline} · {dep.supplier}</span>
                </div>
                <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                  <span style={{color:'#fff',fontWeight:700,fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums'}}>✈️ {dep.depart} ← {dep.retour}</span>
                  <span style={{color:gold,fontSize:'0.875rem'}}>🌙 {dep.nights} ليلة</span>
                </div>
                {dep.flight_out&&<div style={{color:'rgba(255,255,255,0.5)',fontSize:'0.75rem',marginTop:3,direction:'ltr',textAlign:'right'}}>↗ {dep.flight_out}</div>}
                {dep.flight_ret&&<div style={{color:'rgba(255,255,255,0.5)',fontSize:'0.75rem',direction:'ltr',textAlign:'right'}}>↙ {dep.flight_ret}</div>}
              </div>
              {editMode&&<div style={{display:'flex',gap:5}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>toggleDep(dep)} style={{padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.75rem',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:dep.available?'#10b981':'#9ca3af',fontFamily:'inherit'}}>{dep.available?'👁':'🚫'}</button>
                <button onClick={()=>setDepM({...dep})} style={{padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.875rem',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#93c5fd',fontFamily:'inherit'}}>✏️</button>
                <button onClick={()=>delDep(dep.id)} style={{padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.875rem',border:'1px solid rgba(255,0,0,0.3)',background:'transparent',color:'#fca5a5',fontFamily:'inherit'}}>🗑</button>
                <button onClick={()=>{setHtlM({h:{...EHTL},depId:dep.id});setOpenD(p=>({...p,[dep.id]:true}))}} style={{padding:'0.25rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.75rem',background:gold,color:navy,border:'none',fontFamily:'inherit',fontWeight:700}}>+ هوتيل</button>
              </div>}
              <span style={{color:'rgba(255,255,255,0.5)',fontSize:'1rem',flexShrink:0,transition:'transform 0.2s',transform:openD[dep.id]?'rotate(180deg)':'rotate(0)'}}>▼</span>
            </div>

            {openD[dep.id]&&<div style={{padding:'0.75rem'}}>
              {(!dep.hotels||dep.hotels.length===0)?
                <div style={{textAlign:'center',padding:'1.5rem',color:'rgba(26,36,64,0.4)',fontSize:'0.875rem',fontStyle:'italic'}}>
                  {editMode?'Cliquer "+ هوتيل" pour ajouter un hôtel':'Aucun hôtel disponible'}
                </div>:
              dep.hotels.map(htl=>(
                <div key={htl.id} style={{background:'#fff',borderRadius:'0.75rem',border:brd,marginBottom:'0.625rem',overflow:'hidden'}}>
                  <div onClick={()=>setOpenH(p=>({...p,[htl.id]:!p[htl.id]}))} style={{display:'flex',alignItems:'center',gap:10,padding:'0.75rem 1rem',cursor:'pointer',background:'rgba(26,36,64,0.04)',borderBottom:openH[htl.id]?brd:'none'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:'0.9375rem',color:navy}}>{htl.name||'N/A'}</div>
                      <div style={{display:'flex',gap:10,marginTop:3,flexWrap:'wrap'}}>
                        <span style={{color:gold,fontSize:'0.875rem'}}>{htl.stars}</span>
                        {htl.distance&&<span style={{color:'rgba(26,36,64,0.5)',fontSize:'0.8125rem'}}>📍 {htl.distance}</span>}
                      </div>
                    </div>
                    {editMode&&<div style={{display:'flex',gap:5}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setHtlM({h:{...htl},depId:dep.id})} style={{padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.875rem',border:`1px solid #E8E4DC`,background:'transparent',color:'#3b82f6',fontFamily:'inherit'}}>✏️</button>
                      <button onClick={()=>delHtl(htl.id)} style={{padding:'0.25rem 0.5rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.875rem',border:'1px solid #fca5a5',background:'transparent',color:'#ef4444',fontFamily:'inherit'}}>🗑</button>
                    </div>}
                    <span style={{color:'rgba(26,36,64,0.35)',fontSize:'1rem',flexShrink:0,transition:'transform 0.2s',transform:openH[htl.id]?'rotate(180deg)':'rotate(0)'}}>▼</span>
                  </div>
                  {openH[htl.id]&&<div>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',minWidth:420}}>
                        <thead><tr style={{background:'rgba(26,36,64,0.06)'}}>
                          {['الغرفة','بالغ / شخص','طفل -2 سنة','طفل -12 (بدون سرير)','طفل -12 (بسرير)'].map((h,i)=>(
                            <th key={i} style={{padding:'0.5rem 0.75rem',textAlign:i===0?'right':'center',fontSize:'0.6875rem',fontWeight:700,color:'rgba(26,36,64,0.5)',whiteSpace:'nowrap',borderBottom:brd}}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>{ROOMS.map((room,ri)=>(
                          <tr key={room} style={{background:ri%2===1?'rgba(200,149,42,0.04)':'transparent',borderBottom:ri<ROOMS.length-1?brd:'none'}}>
                            <td style={{padding:'0.625rem 0.75rem',fontWeight:700,fontSize:'0.9375rem',color:navy}}>{room}</td>
                            <td style={{padding:'0.625rem 0.75rem',textAlign:'center',fontWeight:700,color:gold,fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums'}}>{fDA(htl.prices[room]||0)}</td>
                            <td style={{padding:'0.625rem 0.75rem',textAlign:'center',fontSize:'0.875rem',color:'rgba(26,36,64,0.6)',fontVariantNumeric:'tabular-nums'}}>{ri===0?fDA(htl.price_child_u2):''}</td>
                            <td style={{padding:'0.625rem 0.75rem',textAlign:'center',fontSize:'0.875rem',color:'rgba(26,36,64,0.6)',fontVariantNumeric:'tabular-nums'}}>{ri===0?fDA(htl.price_child_u12_no_bed):''}</td>
                            <td style={{padding:'0.625rem 0.75rem',textAlign:'center',fontSize:'0.875rem',color:'rgba(26,36,64,0.6)',fontVariantNumeric:'tabular-nums'}}>{ri===0?fDA(htl.price_child_u12_with_bed):''}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    {htl.remarks&&<div style={{padding:'0.75rem 1rem',background:'#fffbeb',borderTop:'1px solid #fde68a',fontSize:'0.875rem',color:'#92400e',lineHeight:1.5}}>📌 {htl.remarks}</div>}
                  </div>}
                </div>
              ))}
            </div>}
          </div>
        ))}
      </div>

      {/* Modal Départ */}
      {depM&&<div style={{position:'fixed',inset:0,zIndex:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',background:'rgba(0,0,0,0.7)'}}>
        <div style={{width:'100%',maxWidth:480,background:'#fff',borderRadius:'1rem',border:brd,boxShadow:'0 16px 48px rgba(0,0,0,0.2)',overflow:'hidden'}}>
          <div style={{background:`linear-gradient(90deg,${navy},#243060)`,padding:'1rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{fontWeight:700,color:'#fff',fontSize:'1rem'}}>{depM.id?`✏️ Départ ${depM.num}`:'➕ Nouveau départ'}</h3>
            <button onClick={()=>setDepM(null)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:'1.25rem',fontFamily:'inherit'}}>✕</button>
          </div>
          <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.75rem',maxHeight:'70vh',overflowY:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              {([{k:'num',l:'N° départ',t:'number'},{k:'nights',l:'Nuits',t:'number'}] as const).map(f=>(
                <div key={f.k}>{lbl(f.l)}<input type={f.t} value={(depM[f.k] as number)||''} style={inp()} onChange={e=>setDepM(m=>m?{...m,[f.k]:parseInt(e.target.value)||0}:m)}/></div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              {([{k:'depart',l:'Date aller (JJ/MM/AAAA)'},{k:'retour',l:'Date retour'}] as const).map(f=>(
                <div key={f.k}>{lbl(f.l)}<input value={depM[f.k]||''} placeholder="15/06/2026" style={inp()} onChange={e=>setDepM(m=>m?{...m,[f.k]:e.target.value}:m)}/></div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              {([{k:'airline',l:'Compagnie'},{k:'supplier',l:'Fournisseur'}] as const).map(f=>(
                <div key={f.k}>{lbl(f.l)}<input value={depM[f.k]||''} style={inp()} onChange={e=>setDepM(m=>m?{...m,[f.k]:e.target.value}:m)}/></div>
              ))}
            </div>
            <div>{lbl('Vol aller (optionnel)')}<input value={depM.flight_out||''} placeholder="SV729 ALG→JED 08h30→12h45" style={inp()} onChange={e=>setDepM(m=>m?{...m,flight_out:e.target.value}:m)}/></div>
            <div>{lbl('Vol retour (optionnel)')}<input value={depM.flight_ret||''} placeholder="SV730 JED→ALG 15h00→18h15" style={inp()} onChange={e=>setDepM(m=>m?{...m,flight_ret:e.target.value}:m)}/></div>
          </div>
          <div style={{padding:'1rem 1.25rem',borderTop:brd,display:'flex',gap:'0.75rem'}}>
            <button onClick={()=>setDepM(null)} style={{flex:1,padding:'0.75rem',borderRadius:'0.75rem',cursor:'pointer',background:'#f3f4f6',border:'none',color:'#374151',fontFamily:'inherit',fontSize:'0.875rem'}}>Annuler</button>
            <button onClick={saveDep} disabled={saving} style={{flex:2,padding:'0.75rem',borderRadius:'0.75rem',cursor:saving?'wait':'pointer',background:saving?'#9ca3af':gold,color:navy,border:'none',fontWeight:700,fontFamily:'inherit',fontSize:'0.9375rem'}}>
              {saving?'⏳ Sauvegarde…':'💾 Sauvegarder'}</button>
          </div>
        </div>
      </div>}

      {/* Modal Hôtel */}
      {htlM&&<div style={{position:'fixed',inset:0,zIndex:800,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'1rem',overflow:'auto',background:'rgba(0,0,0,0.75)'}}>
        <div style={{width:'100%',maxWidth:520,background:'#fff',borderRadius:'1rem',border:brd,marginBottom:'1rem',overflow:'hidden'}}>
          <div style={{background:`linear-gradient(90deg,${navy},#243060)`,padding:'1rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{fontWeight:700,color:'#fff',fontSize:'1rem'}}>{htlM.h.id?`✏️ ${htlM.h.name||'Hôtel'}`:'➕ Nouvel hôtel'}</h3>
            <button onClick={()=>setHtlM(null)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:'1.25rem',fontFamily:'inherit'}}>✕</button>
          </div>
          <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.875rem',maxHeight:'72vh',overflowY:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0.75rem'}}>
              <div>{lbl("Nom de l'hôtel")}<input value={htlM.h.name||''} placeholder="N/A" style={inp()} onChange={e=>setHtlM(m=>m?{...m,h:{...m.h,name:e.target.value}}:m)}/></div>
              <div>{lbl('Étoiles')}<input value={htlM.h.stars||'★★★'} style={inp({color:gold})} onChange={e=>setHtlM(m=>m?{...m,h:{...m.h,stars:e.target.value}}:m)}/></div>
            </div>
            <div>{lbl('Distance du Haram (optionnel)')}<input value={htlM.h.distance||''} placeholder="300m du Haram" style={inp()} onChange={e=>setHtlM(m=>m?{...m,h:{...m.h,distance:e.target.value}}:m)}/></div>
            <div>
              {lbl('Tarifs adulte (DA / personne)',true)}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:4}}>
                {ROOMS.map(room=>(
                  <div key={room} style={{display:'flex',alignItems:'center',gap:6,background:'#f9fafb',borderRadius:'0.5rem',padding:'0.5rem 0.75rem',border:brd}}>
                    <span style={{fontSize:'0.8125rem',fontWeight:600,color:navy,minWidth:80,textAlign:'right'}}>{room}</span>
                    <input type="number" value={(htlM.h.prices||{})[room]||''} placeholder="0" style={{flex:1,padding:'0.25rem 0.5rem',borderRadius:'0.375rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy,fontVariantNumeric:'tabular-nums'}} onChange={e=>setHP(room,e.target.value)}/>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {lbl('Tarifs enfants (DA)',true)}
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:4}}>
                {([{k:'price_child_u2',l:'Enfant -2 ans'},{k:'price_child_u12_no_bed',l:'Enfant -12 ans sans lit'},{k:'price_child_u12_with_bed',l:'Enfant -12 ans avec lit'}] as const).map(f=>(
                  <div key={f.k} style={{display:'flex',alignItems:'center',gap:8,background:'#fffbeb',borderRadius:'0.5rem',padding:'0.5rem 0.75rem',border:'1px solid #fde68a'}}>
                    <span style={{fontSize:'0.8125rem',fontWeight:600,color:'#92400e',flex:1,textAlign:'right'}}>{f.l}</span>
                    <input type="number" value={htlM.h[f.k]||''} placeholder="0" style={{width:120,padding:'0.25rem 0.5rem',borderRadius:'0.375rem',border:'1px solid #fcd34d',fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy,fontVariantNumeric:'tabular-nums'}} onChange={e=>setHtlM(m=>m?{...m,h:{...m.h,[f.k]:parseInt(e.target.value)||0}}:m)}/>
                  </div>
                ))}
              </div>
            </div>
            <div>{lbl('Remarques (optionnel)')}<textarea value={htlM.h.remarks||''} rows={3} placeholder="Informations additionnelles…" style={{width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:brd,fontSize:'0.875rem',outline:'none',fontFamily:'inherit',color:navy,resize:'vertical',direction:'rtl'}} onChange={e=>setHtlM(m=>m?{...m,h:{...m.h,remarks:e.target.value}}:m)}/></div>
          </div>
          <div style={{padding:'1rem 1.25rem',borderTop:brd,display:'flex',gap:'0.75rem'}}>
            <button onClick={()=>setHtlM(null)} style={{flex:1,padding:'0.75rem',borderRadius:'0.75rem',cursor:'pointer',background:'#f3f4f6',border:'none',color:'#374151',fontFamily:'inherit',fontSize:'0.875rem'}}>Annuler</button>
            <button onClick={saveHtl} disabled={saving} style={{flex:2,padding:'0.75rem',borderRadius:'0.75rem',cursor:saving?'wait':'pointer',background:saving?'#9ca3af':gold,color:navy,border:'none',fontWeight:700,fontFamily:'inherit',fontSize:'0.9375rem'}}>
              {saving?'⏳ Sauvegarde…':'💾 Sauvegarder'}</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
