'use client'
import { useState, useEffect } from 'react'
import { Client } from '@/types/database'
import { supabase } from '@/lib/supabase'

const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }
const inp = { ...S, padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem', outline:'none' } as React.CSSProperties

export default function ClientsPage() {
  const [clients,setClients] = useState<Client[]>([])
  const [loading,setLoading] = useState(true)
  const [name,setName]       = useState('')
  const [phone,setPhone]     = useState('')

  useEffect(()=>{
    supabase.from('clients').select('*').order('created_at',{ascending:false})
      .then(({data})=>{ setClients(data??[]); setLoading(false) })
  },[])

  async function addClient() {
    if (!name.trim()) return
    const { data } = await supabase.from('clients')
      .insert({ name:name.trim(), phone:phone.trim()||null }).select().single()
    if (data) { setClients(c=>[data,...c]); setName(''); setPhone('') }
  }

  async function deleteClient(id:string) {
    if (!confirm('Supprimer ce client ?')) return
    await supabase.from('clients').delete().eq('id',id)
    setClients(c=>c.filter(x=>x.id!==id))
  }

  return (
    <div style={{ padding:'2rem', maxWidth:900, margin:'0 auto' }} className="animate-fadeIn">
      <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem' }}>👥 Clients</h1>
      <div style={{ padding:'1.25rem', borderRadius:'1rem', marginBottom:'1.25rem', ...S }}>
        <h2 style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.875rem' }}>Ajouter un client</h2>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <input type="text" placeholder="Nom *" value={name} onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addClient()} style={{ ...inp, flex:1, minWidth:200 }} autoFocus />
          <input type="tel" placeholder="Téléphone" value={phone} onChange={e=>setPhone(e.target.value)}
            style={{ ...inp, width:180 }} />
          <button onClick={addClient} disabled={!name.trim()} style={{
            padding:'0.5rem 1.25rem', borderRadius:'0.625rem', background:'var(--color-primary)',
            color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.875rem',
            opacity:name.trim()?1:0.5 }}>
            ＋ Ajouter
          </button>
        </div>
      </div>
      <div style={{ borderRadius:'1rem', overflow:'hidden', ...S }}>
        {loading ? (
          <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{ height:44 }} />)}
          </div>
        ) : clients.length===0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'var(--color-text-muted)' }}>
            Aucun client enregistré
          </div>
        ) : (
          <table>
            <thead>
              <tr style={{ background:'var(--color-surface-offset)', borderBottom:'1px solid var(--color-border)' }}>
                {['Nom','Téléphone','Ajouté le',''].map(h=>(
                  <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.6875rem',
                    fontWeight:700, textTransform:'uppercase', color:'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c=>(
                <tr key={c.id} style={{ borderBottom:'1px solid var(--color-border)', transition:'background 0.1s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--color-surface-offset)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', fontWeight:500 }}>{c.name}</td>
                  <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', color:'var(--color-text-muted)' }}>
                    {c.phone||'—'}
                  </td>
                  <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', color:'var(--color-text-muted)',
                    fontVariantNumeric:'tabular-nums' }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    <button onClick={()=>deleteClient(c.id)} style={{
                      padding:'0.25rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem',
                      border:'1px solid var(--color-border)', cursor:'pointer', background:'transparent',
                      color:'var(--color-text-muted)' }}>Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
