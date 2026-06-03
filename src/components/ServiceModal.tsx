'use client'
import { useState, useEffect } from 'react'
import { QuoteItem } from '@/types/database'
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
type PriceMode   = 'cost' | 'price'   // 'cost' = saisir coût brut | 'price' = saisir prix client

const SERVICES: { id: ServiceType; icon: string; label: string; desc: string; color: string; bg: string }[] = [
  { id:'hotel',    icon:'🏨', label:'Hôtel',    desc:'Réservation, nuitées, type de pension', color:'#92400e', bg:'#fef3c7' },
  { id:'flight',   icon:'✈️', label:'Vol',       desc:'Billets avion aller-retour / simple',   color:'#1e40af', bg:'#dbeafe' },
  { id:'transfer', icon:'🚐', label:'Transfert', desc:'Aéroport ↔ Hôtel, véhicule, bagages',  color:'#065f46', bg:'#d1fae5' },
  { id:'other',    icon:'📋', label:'Autre',     desc:'Excursion, visa, assurance, etc.',      color:'#374151', bg:'#f3f4f6' },
]

/* CSS vars overrides → force light mode dans le panel */
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
  width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem',
  fontSize:'0.875rem', outline:'none', fontFamily:'inherit',
  border:'1px solid #e5e7eb', background:'#ffffff', color:'#111827',
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.75rem', fontWeight:500,
  color:'#6b7280', marginBottom:'0.25rem',
}

export default function ServiceModal({ open, onClose, onSave, editItem }: Props) {
  const [step,      setStep]      = useState<'choose'|'form'>('choose')
  const [type,      setType]      = useState<ServiceType>('hotel')
  const [formData,  setFormData]  = useState<Partial<QuoteItem>>({})
  const [priceMode, setPriceMode] = useState<PriceMode>('cost')

  useEffect(() => {
    if (open) {
      if (editItem?.service_type) {
        setType(editItem.service_type as ServiceType)
        setStep('form')
        setFormData({ ...editItem })
      } else {
        setStep('choose')
        setFormData({})
        setPriceMode('cost')
      }
    }
  }, [open, editItem])

  if (!open) return null

  /* ── Calculs en temps réel selon le mode ── */
  const qty = Math.max(1, Number(formData.quantity || 1))

  let unitCost: number, unitPrice: number, totalCost: number, totalPrice: number, profit: number

  if (priceMode === 'cost') {
    /* Mode normal : coût brut → prix client */
    unitCost   = Number(formData.unit_cost  || 0)
    const marg = Number(formData.margin_pct || 0)
    unitPrice  = unitCost * (1 + marg / 100)
    totalCost  = unitCost  * qty
    totalPrice = unitPrice * qty
    profit     = totalPrice - totalCost
  } else {
    /* Mode inversé : prix client → coût brut */
    unitPrice  = Number(formData.unit_price || 0)
    const marg = Number(formData.margin_pct || 0)
    unitCost   = marg >= 100 ? 0 : unitPrice / (1 + marg / 100)
    totalCost  = unitCost  * qty
    totalPrice = unitPrice * qty
    profit     = totalPrice - totalCost
  }

  const fmtDA = (n: number) =>
    new Intl.NumberFormat('fr-DZ', { minimumFractionDigits:0 }).format(Math.round(n))

  function handleSave() {
    const finalData: Partial<QuoteItem> = {
      ...formData,
      service_type: type,
      quantity:     qty,
      unit_cost:    Math.round(unitCost  * 100) / 100,
      unit_price:   Math.round(unitPrice * 100) / 100,
      margin_pct:   Number(formData.margin_pct || 0),
      total_cost:   Math.round(totalCost  * 100) / 100,
      total_price:  Math.round(totalPrice * 100) / 100,
      profit:       Math.round(profit     * 100) / 100,
    }
    onSave(finalData)
    onClose()
  }

  /* ── Quand on change le mode, recalculer les champs liés ── */
  function switchMode(mode: PriceMode) {
    setPriceMode(mode)
    if (mode === 'price') {
      // Passer en mode prix client → pré-remplir unit_price avec le prix calculé
      setFormData(f => ({ ...f, unit_price: Math.round(unitPrice * 100) / 100 }))
    } else {
      // Passer en mode coût brut → pré-remplir unit_cost avec le coût calculé
      setFormData(f => ({ ...f, unit_cost: Math.round(unitCost * 100) / 100 }))
    }
  }

  const overlayStyle: React.CSSProperties = {
    position:'fixed', inset:0, zIndex:300,
    display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
  }
  const panelStyle: React.CSSProperties = {
    ...LIGHT,
    position:'relative', width:'100%',
    maxWidth: step === 'choose' ? 480 : 720,
    maxHeight:'92vh', overflowY:'auto',
    borderRadius:'1.25rem', background:'#ffffff',
    border:'1px solid #e5e7eb', boxShadow:'0 24px 80px rgba(0,0,0,0.22)',
    color:'#111827', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  }

  return (
    <div style={overlayStyle}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} onClick={onClose}/>
      <div style={panelStyle}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, zIndex:2, padding:'1.25rem 1.5rem',
          borderBottom:'1px solid #e5e7eb', background:'#ffffff',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            {step === 'form' && !editItem?.service_type && (
              <button onClick={() => setStep('choose')}
                style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
                  border:'1px solid #e5e7eb', background:'#f3f4f6',
                  cursor:'pointer', fontSize:'0.8125rem', color:'#374151' }}>
                ← Retour
              </button>
            )}
            <div>
              <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#111827' }}>
                {step === 'choose' ? '🛎 Ajouter une prestation'
                  : editItem?.service_type
                    ? `✏️ Modifier — ${SERVICES.find(s=>s.id===type)?.label}`
                    : `➕ ${SERVICES.find(s=>s.id===type)?.label}`}
              </h2>
              {step === 'choose' && (
                <p style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:2 }}>
                  Choisissez le type de prestation
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
            border:'1px solid #e5e7eb', background:'#f3f4f6',
            cursor:'pointer', fontSize:'1rem', color:'#374151' }}>✕</button>
        </div>

        {/* Step 1 — Choix du type */}
        {step === 'choose' && (
          <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem' }}>
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { setType(s.id); setStep('form') }}
                style={{ padding:'1.25rem', borderRadius:'0.875rem',
                  border:'2px solid #e5e7eb', background:'#f9fafb',
                  cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                  display:'flex', flexDirection:'column', gap:'0.5rem' }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = s.color; el.style.background = s.bg
                  el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#e5e7eb'; el.style.background = '#f9fafb'
                  el.style.boxShadow = 'none'; el.style.transform = 'none'
                }}>
                <span style={{ fontSize:'2rem' }}>{s.icon}</span>
                <span style={{ fontWeight:700, fontSize:'0.9375rem', color:'#111827' }}>{s.label}</span>
                <span style={{ fontSize:'0.75rem', color:'#6b7280', lineHeight:1.4 }}>{s.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Formulaire */}
        {step === 'form' && (
          <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', color:'#111827' }}>

            {/* Formulaire spécifique */}
            {type === 'hotel'    && <HotelForm    data={formData} onChange={setFormData} />}
            {type === 'flight'   && <FlightForm   data={formData} onChange={setFormData} />}
            {type === 'transfer' && <TransferForm data={formData} onChange={setFormData} />}
            {type === 'other'    && <OtherForm    data={formData} onChange={setFormData} />}

            {/* ── Section Tarification ── */}
            <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd',
              borderRadius:'0.875rem', padding:'1.125rem',
              display:'flex', flexDirection:'column', gap:'0.875rem' }}>

              {/* Toggle mode de saisie */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem' }}>
                <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.06em', color:'#0369a1' }}>
                  💰 Tarification
                </p>
                <div style={{ display:'flex', gap:4, background:'#e0f2fe', borderRadius:'0.5rem', padding:'3px' }}>
                  {([
                    { id:'cost'  as PriceMode, label:'Coût brut + marge',    icon:'🧮' },
                    { id:'price' as PriceMode, label:'Prix client + marge',   icon:'💵' },
                  ] as const).map(m => (
                    <button key={m.id} onClick={() => switchMode(m.id)}
                      style={{ padding:'0.3rem 0.75rem', borderRadius:'0.375rem',
                        fontSize:'0.75rem', fontWeight:600, cursor:'pointer', border:'none',
                        background: priceMode === m.id ? '#fff' : 'transparent',
                        color:      priceMode === m.id ? '#0369a1' : '#64748b',
                        boxShadow:  priceMode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        transition:'all 0.15s', whiteSpace:'nowrap' }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>

                {/* Quantité */}
                <div>
                  <label style={lbl}>Quantité</label>
                  <input type="number" min={1} value={formData.quantity || 1} style={inp}
                    onChange={e => setFormData(f => ({ ...f, quantity: Math.max(1, parseInt(e.target.value)||1) }))} />
                </div>

                {/* Champ principal selon le mode */}
                {priceMode === 'cost' ? (
                  <div>
                    <label style={lbl}>Coût brut / unité (DA)</label>
                    <input type="number" min={0} step={100}
                      value={formData.unit_cost ?? ''} placeholder="Ex: 50 000" style={inp}
                      onChange={e => setFormData(f => ({ ...f, unit_cost: parseFloat(e.target.value)||0 }))} />
                  </div>
                ) : (
                  <div>
                    <label style={lbl}>Prix client / unité (DA)</label>
                    <input type="number" min={0} step={100}
                      value={formData.unit_price ?? ''} placeholder="Ex: 60 000" style={inp}
                      onChange={e => setFormData(f => ({ ...f, unit_price: parseFloat(e.target.value)||0 }))} />
                  </div>
                )}

                {/* Marge */}
                <div>
                  <label style={lbl}>Marge (%)</label>
                  <input type="number" min={0} max={200} step={0.5}
                    value={formData.margin_pct ?? ''} placeholder="Ex: 15" style={inp}
                    onChange={e => setFormData(f => ({ ...f, margin_pct: parseFloat(e.target.value)||0 }))} />
                </div>
              </div>

              {/* Résumé calculé */}
              {(priceMode === 'cost' ? unitCost : unitPrice) > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem' }}>
                  {[
                    { label: priceMode==='cost' ? 'Prix / unité' : 'Coût brut / unité',
                      value: `${fmtDA(priceMode==='cost'?unitPrice:unitCost)} DA`,
                      color:'#0369a1', dim: true },
                    { label:'Total client', value:`${fmtDA(totalPrice)} DA`, color:'#0369a1', dim:false },
                    { label:'Total brut',   value:`${fmtDA(totalCost)} DA`,  color:'#374151', dim:true  },
                    { label:'Bénéfice',     value:`+${fmtDA(profit)} DA`,    color:'#059669', dim:false },
                  ].map(r => (
                    <div key={r.label} style={{ background:'#fff', borderRadius:'0.5rem',
                      padding:'0.5rem 0.75rem', border:'1px solid #bae6fd', textAlign:'center',
                      opacity: r.dim ? 0.8 : 1 }}>
                      <div style={{ fontSize:'0.625rem', color:'#6b7280', marginBottom:2 }}>{r.label}</div>
                      <div style={{ fontSize:'0.8125rem', fontWeight:700, color:r.color,
                        fontVariantNumeric:'tabular-nums' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', paddingTop:'0.25rem' }}>
              <button onClick={onClose} style={{ padding:'0.625rem 1.25rem', borderRadius:'0.625rem',
                border:'1px solid #e5e7eb', background:'#f3f4f6',
                cursor:'pointer', fontSize:'0.875rem', color:'#374151' }}>
                Annuler
              </button>
              <button onClick={handleSave}
                style={{ padding:'0.625rem 1.5rem', borderRadius:'0.625rem',
                  background:'#0f2c5c', color:'#ffffff', border:'none',
                  cursor:'pointer', fontSize:'0.875rem', fontWeight:700 }}>
                {editItem?.service_type ? '✅ Modifier' : '➕ Ajouter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
