'use client'
import { useState, useEffect } from 'react'
import { QuoteItem } from '@/types/database'
import { buildDescription } from '@/lib/description-builder'
import HotelForm    from './services/HotelForm'
import FlightForm   from './services/FlightForm'
import TransferForm from './services/TransferForm'
import OtherForm    from './services/OtherForm'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<QuoteItem>) => void
  editItem: Partial<QuoteItem> | null
}

type ServiceType = 'hotel' | 'flight' | 'transfer' | 'other'
type PriceMode   = 'cost' | 'price'

const SERVICES = [
  { id:'hotel'    as ServiceType, icon:'🏨', label:'Hôtel',    desc:'Réservation, nuitées, pension', color:'#92400e', bg:'#fef3c7' },
  { id:'flight'   as ServiceType, icon:'✈️', label:'Vol',       desc:'Billets aller-retour / simple', color:'#1e40af', bg:'#dbeafe' },
  { id:'transfer' as ServiceType, icon:'🚐', label:'Transfert', desc:'Aéroport ↔ Hôtel',             color:'#065f46', bg:'#d1fae5' },
  { id:'other'    as ServiceType, icon:'📋', label:'Autre',     desc:'Excursion, visa, assurance…',   color:'#374151', bg:'#f3f4f6' },
]

const LIGHT: React.CSSProperties = {
  '--color-border'           : '#e5e7eb',
  '--color-surface'          : '#ffffff',
  '--color-surface-offset'   : '#f9fafb',
  '--color-text'             : '#111827',
  '--color-text-muted'       : '#6b7280',
  '--color-text-faint'       : '#d1d5db',
  '--color-primary'          : '#3b82f6',
  '--color-primary-highlight': '#eff6ff',
  '--color-error'            : '#ef4444',
  '--color-success'          : '#10b981',
} as React.CSSProperties

const inp: React.CSSProperties = {
  width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem',
  outline:'none', fontFamily:'inherit', border:'1px solid #e5e7eb', background:'#ffffff', color:'#111827',
}
const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', fontWeight:500, color:'#6b7280', marginBottom:'0.25rem' }

export default function ServiceModal({ open, onClose, onSave, editItem }: Props) {
  const [step,      setStep]      = useState<'choose'|'form'>('choose')
  const [type,      setType]      = useState<ServiceType>('hotel')
  const [formData,  setFormData]  = useState<Partial<QuoteItem>>({})
  const [priceMode, setPriceMode] = useState<PriceMode>('cost')
  const [descManual, setDescManual] = useState(false)  // true = texte édité manuellement

  useEffect(() => {
    if (open) {
      if (editItem?.service_type) {
        setType(editItem.service_type as ServiceType)
        setStep('form')
        setFormData({ ...editItem })
        setDescManual(false)
      } else {
        setStep('choose')
        setFormData({})
        setPriceMode('cost')
        setDescManual(false)
      }
    }
  }, [open, editItem])

  if (!open) return null

  /* ── Gestion de la description ── */
  function handleFormChange(data: Partial<QuoteItem>) {
    setFormData(prev => {
      if (descManual) {
        // On garde la description manuelle, on ne la régénère pas
        return { ...data, description: prev.description }
      }
      return data
    })
  }

  function regenerateDesc() {
    const d = buildDescription({ ...formData, service_type: type })
    setFormData(f => ({ ...f, description: d }))
    setDescManual(false)
  }

  /* ── Calculs prix ── */
  const qty = Math.max(1, Number(formData.quantity || 1))
  let unitCost: number, unitPrice: number, totalCost: number, totalPrice: number, profit: number

  if (priceMode === 'cost') {
    unitCost   = Number(formData.unit_cost  || 0)
    unitPrice  = unitCost * (1 + Number(formData.margin_pct || 0) / 100)
    totalCost  = unitCost  * qty
    totalPrice = unitPrice * qty
    profit     = totalPrice - totalCost
  } else {
    unitPrice  = Number(formData.unit_price || 0)
    const marg = Number(formData.margin_pct || 0)
    unitCost   = marg >= 100 ? 0 : unitPrice / (1 + marg / 100)
    totalCost  = unitCost  * qty
    totalPrice = unitPrice * qty
    profit     = totalPrice - totalCost
  }

  const fmtDA = (n: number) => new Intl.NumberFormat('fr-DZ').format(Math.round(n))

  function handleSave() {
    const desc = formData.description || buildDescription({ ...formData, service_type: type })
    const finalData: Partial<QuoteItem> = {
      ...formData, service_type: type, quantity: qty,
      unit_cost:   Math.round(unitCost   * 100) / 100,
      unit_price:  Math.round(unitPrice  * 100) / 100,
      margin_pct:  Number(formData.margin_pct || 0),
      total_cost:  Math.round(totalCost  * 100) / 100,
      total_price: Math.round(totalPrice * 100) / 100,
      profit:      Math.round(profit     * 100) / 100,
      description: desc,
    }
    onSave(finalData); onClose()
  }

  function switchMode(mode: PriceMode) {
    setPriceMode(mode)
    if (mode === 'price') setFormData(f => ({ ...f, unit_price: Math.round(unitPrice * 100) / 100 }))
    else                  setFormData(f => ({ ...f, unit_cost:  Math.round(unitCost  * 100) / 100 }))
  }

  const overlayStyle: React.CSSProperties = { position:'fixed', inset:0, zIndex:300,
    display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }
  const panelStyle: React.CSSProperties = { ...LIGHT, position:'relative', width:'100%',
    maxWidth: step==='choose' ? 480 : 720, maxHeight:'92vh', overflowY:'auto',
    borderRadius:'1.25rem', background:'#ffffff', border:'1px solid #e5e7eb',
    boxShadow:'0 24px 80px rgba(0,0,0,0.22)', color:'#111827',
    fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }

  return (
    <div style={overlayStyle}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} onClick={onClose}/>
      <div style={panelStyle}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, zIndex:2, padding:'1.25rem 1.5rem',
          borderBottom:'1px solid #e5e7eb', background:'#ffffff',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            {step==='form' && !editItem?.service_type && (
              <button onClick={()=>setStep('choose')}
                style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
                  border:'1px solid #e5e7eb', background:'#f3f4f6',
                  cursor:'pointer', fontSize:'0.8125rem', color:'#374151' }}>← Retour</button>
            )}
            <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#111827' }}>
              {step==='choose' ? '🛎 Ajouter une prestation'
                : editItem?.service_type ? `✏️ Modifier — ${SERVICES.find(s=>s.id===type)?.label}`
                : `➕ ${SERVICES.find(s=>s.id===type)?.label}`}
            </h2>
          </div>
          <button onClick={onClose} style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
            border:'1px solid #e5e7eb', background:'#f3f4f6', cursor:'pointer', fontSize:'1rem', color:'#374151' }}>✕</button>
        </div>

        {/* Choix du type */}
        {step==='choose' && (
          <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem' }}>
            {SERVICES.map(s => (
              <button key={s.id} onClick={()=>{ setType(s.id); setStep('form') }}
                style={{ padding:'1.25rem', borderRadius:'0.875rem', border:'2px solid #e5e7eb',
                  background:'#f9fafb', cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                  display:'flex', flexDirection:'column', gap:'0.5rem' }}
                onMouseEnter={e=>{ const el=e.currentTarget; el.style.borderColor=s.color; el.style.background=s.bg }}
                onMouseLeave={e=>{ const el=e.currentTarget; el.style.borderColor='#e5e7eb'; el.style.background='#f9fafb' }}>
                <span style={{ fontSize:'2rem' }}>{s.icon}</span>
                <span style={{ fontWeight:700, fontSize:'0.9375rem', color:'#111827' }}>{s.label}</span>
                <span style={{ fontSize:'0.75rem', color:'#6b7280', lineHeight:1.4 }}>{s.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Formulaire */}
        {step==='form' && (
          <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', color:'#111827' }}>

            {/* Formulaire service */}
            {type==='hotel'    && <HotelForm    data={formData} onChange={handleFormChange}/>}
            {type==='flight'   && <FlightForm   data={formData} onChange={handleFormChange}/>}
            {type==='transfer' && <TransferForm data={formData} onChange={handleFormChange}/>}
            {type==='other'    && <OtherForm    data={formData} onChange={handleFormChange}/>}

            {/* ── Description finale modifiable ── */}
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'0.875rem', padding:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.06em', color:'#92400e' }}>
                  📝 Description finale (modifiable)
                </span>
                <button onClick={regenerateDesc}
                  style={{ padding:'0.25rem 0.625rem', borderRadius:'0.375rem', cursor:'pointer',
                    fontSize:'0.75rem', fontWeight:600, background:'#fef3c7', border:'1px solid #fcd34d',
                    color:'#92400e', fontFamily:'inherit' }}>
                  🔄 Régénérer
                </button>
              </div>
              <textarea
                value={formData.description || buildDescription({ ...formData, service_type: type })}
                onChange={e => { setFormData(f => ({ ...f, description: e.target.value })); setDescManual(true) }}
                rows={3}
                style={{ ...inp, resize:'vertical', lineHeight:1.5, fontSize:'0.8125rem' }}
                placeholder="Description qui apparaîtra dans le document client…"
              />
              {descManual && (
                <p style={{ fontSize:'0.6875rem', color:'#92400e', marginTop:4 }}>
                  ✎ Modifié manuellement · Cliquer "🔄 Régénérer" pour restaurer l'auto-génération
                </p>
              )}
            </div>

            {/* ── Tarification ── */}
            <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:'0.875rem', padding:'1.125rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem' }}>
                <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#0369a1' }}>💰 Tarification</p>
                <div style={{ display:'flex', gap:4, background:'#e0f2fe', borderRadius:'0.5rem', padding:'3px' }}>
                  {([{id:'cost' as PriceMode,label:'🧮 Coût brut'},{id:'price' as PriceMode,label:'💵 Prix client'}] as const).map(m=>(
                    <button key={m.id} onClick={()=>switchMode(m.id)}
                      style={{ padding:'0.3rem 0.75rem', borderRadius:'0.375rem', fontSize:'0.75rem', fontWeight:600,
                        cursor:'pointer', border:'none', transition:'all 0.15s', whiteSpace:'nowrap',
                        background:priceMode===m.id?'#fff':'transparent',
                        color:priceMode===m.id?'#0369a1':'#64748b',
                        boxShadow:priceMode===m.id?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>{m.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={lbl}>Quantité</label>
                  <input type="number" min={1} value={formData.quantity||1} style={inp}
                    onChange={e=>setFormData(f=>({...f,quantity:Math.max(1,parseInt(e.target.value)||1)}))}/>
                </div>
                {priceMode==='cost' ? (
                  <div>
                    <label style={lbl}>Coût brut / unité (DA)</label>
                    <input type="number" min={0} step={100} value={formData.unit_cost??''} placeholder="Ex: 50 000" style={inp}
                      onChange={e=>setFormData(f=>({...f,unit_cost:parseFloat(e.target.value)||0}))}/>
                  </div>
                ) : (
                  <div>
                    <label style={lbl}>Prix client / unité (DA)</label>
                    <input type="number" min={0} step={100} value={formData.unit_price??''} placeholder="Ex: 60 000" style={inp}
                      onChange={e=>setFormData(f=>({...f,unit_price:parseFloat(e.target.value)||0}))}/>
                  </div>
                )}
                <div>
                  <label style={lbl}>Marge (%)</label>
                  <input type="number" min={0} max={200} step={0.5} value={formData.margin_pct??''} placeholder="Ex: 15" style={inp}
                    onChange={e=>setFormData(f=>({...f,margin_pct:parseFloat(e.target.value)||0}))}/>
                </div>
              </div>

              {(priceMode==='cost' ? unitCost : unitPrice) > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem' }}>
                  {[
                    {label:priceMode==='cost'?'Prix / unité':'Coût / unité', value:`${fmtDA(priceMode==='cost'?unitPrice:unitCost)} DA`, color:'#0369a1', dim:true},
                    {label:'Total client',   value:`${fmtDA(totalPrice)} DA`, color:'#0369a1', dim:false},
                    {label:'Total brut',     value:`${fmtDA(totalCost)} DA`,  color:'#374151', dim:true},
                    {label:'Bénéfice',       value:`+${fmtDA(profit)} DA`,    color:'#059669', dim:false},
                  ].map(r=>(
                    <div key={r.label} style={{ background:'#fff', borderRadius:'0.5rem', padding:'0.5rem 0.625rem',
                      border:'1px solid #bae6fd', textAlign:'center', opacity:r.dim?0.8:1 }}>
                      <div style={{ fontSize:'0.625rem', color:'#6b7280', marginBottom:2 }}>{r.label}</div>
                      <div style={{ fontSize:'0.8125rem', fontWeight:700, color:r.color, fontVariantNumeric:'tabular-nums' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', paddingTop:'0.25rem' }}>
              <button onClick={onClose} style={{ padding:'0.625rem 1.25rem', borderRadius:'0.625rem',
                border:'1px solid #e5e7eb', background:'#f3f4f6', cursor:'pointer', fontSize:'0.875rem', color:'#374151' }}>
                Annuler
              </button>
              <button onClick={handleSave} style={{ padding:'0.625rem 1.5rem', borderRadius:'0.625rem',
                background:'#0f2c5c', color:'#ffffff', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:700 }}>
                {editItem?.service_type ? '✅ Modifier' : '➕ Ajouter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
