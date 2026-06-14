'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AgencyConfig } from '@/types/database'
import { supabase } from '@/lib/supabase'
const I: React.CSSProperties={width:'100%',padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#fff',fontSize:'0.875rem',color:'#111827',outline:'none',fontFamily:'inherit'}
const L: React.CSSProperties={display:'block',fontSize:'0.75rem',fontWeight:500,color:'#6b7280',marginBottom:'0.25rem'}
const S: React.CSSProperties={padding:'1.25rem 1.5rem',borderRadius:'0.875rem',border:'1px solid #e5e7eb',background:'#fff',display:'flex',flexDirection:'column',gap:'1rem'}
export default function SettingsPage(){
  const[form,setForm]=useState<Partial<AgencyConfig>>({})
  const[loading,setLoading]=useState(true)
  const[saving,setSaving]=useState(false)
  const[saved,setSaved]=useState(false)
  const[err,setErr]=useState('')
  useEffect(()=>{
    (async()=>{try{const{data}=await supabase.from('agency_config').select('*').single();if(data)setForm(data)}catch(e){console.error(e)}finally{setLoading(false)}})()
  },[])
  const s=(k:keyof AgencyConfig)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setForm(f=>({...f,[k]:e.target.value}))
  async function save(){
    if(!form.name?.trim()){setErr('Le nom est requis.');return}
    setSaving(true);setErr('')
    const{error:e}=await supabase.from('agency_config').update({
      name:form.name,address:form.address||null,city:form.city||null,
      phone:form.phone||null,email:form.email||null,logo_url:form.logo_url||null,
      stamp_url:form.stamp_url||null,rib:form.rib||null,rc:form.rc||null,
      nif:form.nif||null,nis:form.nis||null,ai:form.ai||null,
      footer_note:form.footer_note||null,updated_at:new Date().toISOString()
    }).eq('id',form.id!)
    setSaving(false)
    if(e)setErr(e.message)
    else{setSaved(true);setTimeout(()=>setSaved(false),2500)}
  }
  if(loading)return<div style={{padding:'3rem',textAlign:'center',color:'#6b7280',fontFamily:'sans-serif'}}>Chargement…</div>
  const g=(cols:number):React.CSSProperties=>({display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:'0.75rem'})
  return(
    <div style={{padding:'2rem',maxWidth:680,margin:'0 auto',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'2rem'}}>
        <Link href="/" style={{padding:'0.375rem 0.75rem',borderRadius:'0.5rem',border:'1px solid #e5e7eb',background:'#f3f4f6',textDecoration:'none',fontSize:'0.875rem',color:'#374151'}}>← Retour</Link>
        <div><h1 style={{fontSize:'1.25rem',fontWeight:700,color:'#111827'}}>⚙️ Paramètres agence</h1><p style={{fontSize:'0.8125rem',color:'#6b7280',marginTop:2}}>Informations affichées dans vos documents</p></div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
        <div style={S}>
          <h2 style={{fontSize:'0.875rem',fontWeight:700}}>🏢 Informations générales</h2>
          <div><label style={L}>Nom de l&apos;agence *</label><input value={form.name||''} onChange={s('name')} style={I} placeholder="AELIA TRAVEL AGENCY"/></div>
          <div style={g(2)}>
            <div><label style={L}>Adresse</label><input value={form.address||''} onChange={s('address')} style={I} placeholder="Cité La Radieuse"/></div>
            <div><label style={L}>Ville</label><input value={form.city||''} onChange={s('city')} style={I} placeholder="Alger"/></div>
          </div>
          <div style={g(2)}>
            <div><label style={L}>Téléphone</label><input value={form.phone||''} onChange={s('phone')} style={I} placeholder="023 XX XX XX"/></div>
            <div><label style={L}>E-mail</label><input type="email" value={form.email||''} onChange={s('email')} style={I} placeholder="contact@agence.dz"/></div>
          </div>
          <div><label style={L}>Note de bas de page</label><textarea value={form.footer_note||''} onChange={e=>setForm(f=>({...f,footer_note:e.target.value}))} rows={2} style={{...I,resize:'none'}} placeholder="Sous réserve de disponibilité"/></div>
        </div>
        <div style={S}>
          <div><h2 style={{fontSize:'0.875rem',fontWeight:700}}>🧾 Informations fiscales</h2><p style={{fontSize:'0.75rem',color:'#6b7280',marginTop:3}}>Apparaissent dans les <strong>Factures</strong></p></div>
          <div style={g(2)}>
            <div><label style={L}>RC (Registre du Commerce)</label><input value={form.rc||''} onChange={s('rc')} style={I} placeholder="16/00-XXXXXXXX B 00"/></div>
            <div><label style={L}>NIF (Identification Fiscale)</label><input value={form.nif||''} onChange={s('nif')} style={I} placeholder="XXXXXXXXXXXXXXXX"/></div>
          </div>
          <div style={g(2)}>
            <div><label style={L}>NIS (Identification Statistique)</label><input value={form.nis||''} onChange={s('nis')} style={I} placeholder="XXXXXXXXXXXXXXXX"/></div>
            <div><label style={L}>AI (Article d&apos;Impôt)</label><input value={form.ai||''} onChange={s('ai')} style={I} placeholder="XXXXXXXXXX"/></div>
          </div>
          <div><label style={L}>RIB</label><input value={form.rib||''} onChange={s('rib')} style={I} placeholder="CPA — 007 00016 4000XXXXXX 61"/></div>
        </div>
        <div style={S}>
          <h2 style={{fontSize:'0.875rem',fontWeight:700}}>🖼️ Images</h2>
          <div><label style={L}>URL du Logo (login + entête documents)</label><input value={form.logo_url||''} onChange={s('logo_url')} style={I} placeholder="https://xxx.supabase.co/.../logo.png"/>
            {form.logo_url&&<div style={{marginTop:'0.5rem',display:'flex',alignItems:'center',gap:8}}><img src={form.logo_url} alt="Logo" style={{width:48,height:48,objectFit:'contain',borderRadius:6,border:'1px solid #e5e7eb'}}/><span style={{fontSize:'0.75rem',color:'#059669'}}>✅ Logo chargé</span></div>}
          </div>
          <div><label style={L}>URL du Cachet / Tampon</label><input value={form.stamp_url||''} onChange={s('stamp_url')} style={I} placeholder="https://xxx.supabase.co/.../cachet.png"/>
            {form.stamp_url&&<div style={{marginTop:'0.5rem',display:'flex',alignItems:'center',gap:8}}><img src={form.stamp_url} alt="Cachet" style={{width:48,height:48,objectFit:'contain',borderRadius:6,border:'1px solid #e5e7eb'}}/><span style={{fontSize:'0.75rem',color:'#059669'}}>✅ Cachet chargé</span></div>}
            <p style={{fontSize:'0.7rem',color:'#6b7280',marginTop:6}}>📌 Supabase → Storage → Bucket <strong>assets</strong> (mode public) → URL publique</p>
          </div>
        </div>
        {err&&<div style={{padding:'0.75rem 1rem',borderRadius:'0.625rem',background:'#fee2e2',color:'#991b1b',fontSize:'0.875rem'}}>⚠️ {err}</div>}
        <button onClick={save} disabled={saving} style={{padding:'0.875rem',borderRadius:'0.75rem',background:saved?'#059669':'#0f2c5c',color:'#fff',border:'none',cursor:saving?'wait':'pointer',fontWeight:700,fontSize:'0.9375rem',opacity:saving?0.6:1,fontFamily:'inherit'}}>
          {saved?'✅ Sauvegardé !':saving?'⏳ Sauvegarde…':'💾 Sauvegarder les paramètres'}
        </button>
      </div>
    </div>
  )
}
