'use client'
import { useState, useEffect } from 'react'
import { QuoteItem, ServiceType } from '@/types/database'
import { calcItemTotals } from '@/lib/quotes'
import { buildDescription } from '@/lib/description-builder'
import { saveItemSuggestions } from '@/lib/suggestions'
import HotelForm    from './services/HotelForm'
import FlightForm   from './services/FlightForm'
import TransferForm from './services/TransferForm'
import OtherForm    from './services/OtherForm'

const TYPES: { type: ServiceType; icon: string; label: string }[] = [
  { type:'hotel',    icon:'🏨', label:'Réservation Hôtel' },
  { type:'flight',   icon:'✈️', label:'Billet d\'avion' },
  { type:'transfer', icon:'🚐', label:'Transfert' },
  { type:'other',    icon:'📋', label:'Autre prestation' },
]

function defaultItem(type: ServiceType): Partial<QuoteItem> {
  return { service_type:type, quantity:1, unit_cost:0, margin_pct:0,
    includes_baggage:true, adults:2, children:0, passengers:1,
    luggage_count:0, transfer_type:'Aéroport-Hôtel-Aéroport', description:'' }
}

interface Props {
  open: boolean; onClose: () => void
  onSave: (item: Partial<QuoteItem>) => Promise<void>
  editItem?: Partial<QuoteItem> | null
}

export default function ServiceModal({ open, onClose, onSave, editItem }: Props) {
  const [step, setStep]   = useState<'select'|'form'>(editItem?'form':'select')
  const [data, setData]   = useState<Partial<QuoteItem>>(editItem||defaultItem('hotel'))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editItem) { setData(editItem); setStep('form') }
    else { setData(defaultItem('hotel')); setStep('select') }
  }, [open, editItem])

  const handleSave = async () => {
    setSaving(true)
    const withDesc = { ...data, description: buildDescription(data) }
    const computed = calcItemTotals(withDesc)
    await saveItemSuggestions(computed as Record<string,unknown>)
    await onSave(computed)
    setSaving(false)
    onClose()
  }

  const unitCost  = Number(data.unit_cost) || 0
  const qty       = Number(data.quantity)  || 1
  const marginPct = Number(data.margin_pct)|| 0
  const prixClient = unitCost * (1 + marginPct/100) * qty
  const fmt = (n:number) => n.toLocaleString('fr-DZ',{minimumFractionDigits:0})
  const currentType = TYPES.find(t=>t.type===data.service_type)
  const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }

  if (!open) return null

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end',
      justifyContent:'center' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:680, borderRadius:'1rem 1rem 0 0',
        background:'var(--color-surface-2)', border:'1px solid var(--color-border)',
        boxShadow:'var(--shadow-lg)', maxHeight:'92dvh', display:'flex', flexDirection:'column',
        overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'1rem 1.5rem', borderBottom:'1px solid var(--color-border)', flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:'1rem', fontWeight:600 }}>
              {editItem ? `Modifier — ${currentType?.icon} ${currentType?.label}`
                : step==='select' ? 'Ajouter une prestation'
                : `${currentType?.icon} ${currentType?.label}`}
            </h2>
            {step==='form' && !editItem && (
              <button onClick={()=>setStep('select')} style={{ fontSize:'0.75rem', marginTop:2,
                color:'var(--color-primary)', background:'none', border:'none', cursor:'pointer' }}>
                ← Changer de type
              </button>
            )}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'0.5rem',
            border:'1px solid var(--color-border)', background:'var(--color-surface)',
            cursor:'pointer', fontSize:'1rem' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:'1.5rem' }}>
          {/* Type selector */}
          {step==='select' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {TYPES.map(t => (
                <button key={t.type} onClick={()=>{ setData(defaultItem(t.type)); setStep('form') }}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem',
                    padding:'1.5rem', borderRadius:'1rem', border:'2px solid var(--color-border)',
                    background:'var(--color-surface)', cursor:'pointer', transition:'all 0.15s',
                    fontSize:'0.9375rem', fontWeight:600 }}
                  onMouseEnter={e=>{ const b=e.currentTarget; b.style.borderColor='var(--color-primary)'; b.style.background='var(--color-primary-highlight)' }}
                  onMouseLeave={e=>{ const b=e.currentTarget; b.style.borderColor='var(--color-border)'; b.style.background='var(--color-surface)' }}>
                  <span style={{ fontSize:'2.5rem' }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          {step==='form' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {data.service_type==='hotel'    && <HotelForm    data={data} onChange={setData} />}
              {data.service_type==='flight'   && <FlightForm   data={data} onChange={setData} />}
              {data.service_type==='transfer' && <TransferForm data={data} onChange={setData} />}
              {data.service_type==='other'    && <OtherForm    data={data} onChange={setData} />}

              {/* Description preview */}
              {data.description && (
                <div style={{ padding:'0.75rem 1rem', borderRadius:'0.75rem',
                  background:'var(--color-primary-highlight)', border:'1px solid var(--color-primary)',
                  borderOpacity:'0.3' }}>
                  <p style={{ fontSize:'0.6875rem', fontWeight:700, textTransform:'uppercase',
                    letterSpacing:'0.05em', color:'var(--color-primary)', marginBottom:4 }}>
                    Aperçu de la description
                  </p>
                  <p style={{ fontSize:'0.8125rem', lineHeight:1.6 }}>{data.description}</p>
                </div>
              )}

              {/* Pricing */}
              <div style={{ borderTop:'1px solid var(--color-border)', paddingTop:'1rem' }}>
                <p style={{ fontSize:'0.6875rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.05em', color:'var(--color-text-muted)', marginBottom:'0.75rem' }}>
                  💰 Tarification
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem' }}>
                  {[
                    { label:'Quantité',           field:'quantity'   as keyof QuoteItem, min:1,   step:1   },
                    { label:'Coût unitaire (DA)',  field:'unit_cost'  as keyof QuoteItem, min:0,   step:100 },
                    { label:'Marge (%)',           field:'margin_pct' as keyof QuoteItem, min:0,   step:0.5 },
                  ].map(({ label, field, min, step: s }) => (
                    <div key={field} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <label style={{ fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' }}>{label}</label>
                      <input type="number" min={min} step={s} value={(data[field] as number)??0}
                        onChange={e => setData(d => ({ ...d, [field]: parseFloat(e.target.value)||0 }))}
                        style={{ padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem', outline:'none', ...S }} />
                    </div>
                  ))}
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <label style={{ fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' }}>Prix client (DA)</label>
                    <div style={{ padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontWeight:700,
                      fontVariantNumeric:'tabular-nums', border:'1px solid var(--color-border)',
                      background:'var(--color-surface-offset)', color:'var(--color-primary)', fontSize:'0.875rem' }}>
                      {fmt(prixClient)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step==='form' && (
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem',
            padding:'1rem 1.5rem', borderTop:'1px solid var(--color-border)',
            background:'var(--color-surface)', flexShrink:0 }}>
            <button onClick={onClose} style={{ padding:'0.5rem 1rem', borderRadius:'0.625rem',
              border:'1px solid var(--color-border)', cursor:'pointer', background:'transparent', fontSize:'0.875rem' }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              padding:'0.5rem 1.5rem', borderRadius:'0.625rem', background:'var(--color-primary)',
              color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.875rem',
              opacity: saving ? 0.6 : 1, transition:'all 0.15s' }}>
              {saving ? '⏳...' : editItem ? '✅ Mettre à jour' : '✅ Ajouter'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
