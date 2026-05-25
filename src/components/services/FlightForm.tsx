'use client'
import { QuoteItem } from '@/types/database'
import { buildFlightDescription } from '@/lib/description-builder'
import AutocompleteInput from '@/components/AutocompleteInput'

const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }
const L = { fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' } as React.CSSProperties
const inp = { width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem', outline:'none', ...S } as React.CSSProperties
const AIRPORTS = ['ALG','ORN','CZL','AAE','CDG','LYS','NCE','MRS','MAD','BCN','FCO','LHR','AMS','CAI','SSH','HRG','TUN','MIR','SFX','IST','SAW','CMN','RAK','AGA','DXB','DOH','AMM']

function AptInput({ label, value, onChange, required }: { label:string; value:string; onChange:(v:string)=>void; required?:boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={L}>{label}{required&&<span style={{color:'var(--color-error)',marginLeft:2}}>*</span>}</label>
      <input type="text" list="apt-list" value={value} onChange={e=>onChange(e.target.value.toUpperCase())}
        placeholder="ALG" required={required} maxLength={4}
        style={{ ...inp, fontFamily:'monospace', textTransform:'uppercase' }} />
      <datalist id="apt-list">{AIRPORTS.map(a=><option key={a} value={a}/>)}</datalist>
    </div>
  )
}

interface Props { data: Partial<QuoteItem>; onChange: (d: Partial<QuoteItem>) => void }

export default function FlightForm({ data, onChange }: Props) {
  const set = (field: keyof QuoteItem, value: unknown) => {
    const updated = { ...data, [field]: value }
    updated.description = buildFlightDescription(updated)
    onChange(updated)
  }

  const org = data.origin||'?', dst = data.destination||'?'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'1rem' }}>
        <AutocompleteInput label="Compagnie aérienne *" category="airline" value={data.airline||''}
          onChange={v=>set('airline',v)} placeholder="Ex: EgyptAir" required />
        <AptInput label="Départ *"      value={data.origin||''}      onChange={v=>set('origin',v)} required />
        <AptInput label="Destination *" value={data.destination||''} onChange={v=>set('destination',v)} required />
        <AptInput label="Via (escale)"  value={data.via||''}         onChange={v=>set('via',v)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={L}>Date de départ *</label>
          <input type="date" value={data.departure_date||''} required onChange={e=>set('departure_date',e.target.value)} style={inp} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={L}>Date de retour *</label>
          <input type="date" value={data.return_date||''} min={data.departure_date||undefined} required onChange={e=>set('return_date',e.target.value)} style={inp} />
        </div>
      </div>
      {/* Aller */}
      <div style={{ padding:'1rem', borderRadius:'0.75rem', background:'var(--color-surface-offset)' }}>
        <p style={{ fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em',
          color:'var(--color-primary)', marginBottom:'0.75rem' }}>✈ Vol aller — {org} → {dst}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={L}>Heure de départ</label>
            <input type="time" value={data.dep_time||''} onChange={e=>set('dep_time',e.target.value)} style={inp} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={L}>Heure d&apos;arrivée</label>
            <input type="time" value={data.arr_time||''} onChange={e=>set('arr_time',e.target.value)} style={inp} />
          </div>
        </div>
      </div>
      {/* Retour */}
      <div style={{ padding:'1rem', borderRadius:'0.75rem', background:'var(--color-surface-offset)' }}>
        <p style={{ fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em',
          color:'var(--color-primary)', marginBottom:'0.75rem' }}>✈ Vol retour — {dst} → {org}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={L}>Heure de départ (retour)</label>
            <input type="time" value={data.ret_dep_time||''} onChange={e=>set('ret_dep_time',e.target.value)} style={inp} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={L}>Heure d&apos;arrivée (retour)</label>
            <input type="time" value={data.ret_arr_time||''} onChange={e=>set('ret_arr_time',e.target.value)} style={inp} />
          </div>
        </div>
      </div>
      {/* Toggle bagages */}
      <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }}>
        <div style={{ position:'relative', width:44, height:24, borderRadius:12,
          background: data.includes_baggage!==false ? 'var(--color-primary)' : 'var(--color-border)',
          transition:'background 0.2s' }}>
          <div style={{ position:'absolute', top:4, width:16, height:16, borderRadius:'50%', background:'white',
            boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
            transform: data.includes_baggage!==false ? 'translateX(24px)' : 'translateX(4px)',
            transition:'transform 0.2s' }} />
        </div>
        <input type="checkbox" style={{ display:'none' }} checked={data.includes_baggage!==false}
          onChange={e=>set('includes_baggage',e.target.checked)} />
        <span style={{ fontSize:'0.875rem', fontWeight:500 }}>Inclure les bagages en soute</span>
      </label>
    </div>
  )
}
