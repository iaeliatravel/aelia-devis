'use client'
import { useState, useEffect } from 'react'
import { QuoteItem } from '@/types/database'
import HotelForm     from './services/HotelForm'
import FlightForm    from './services/FlightForm'
import TransferForm  from './services/TransferForm'
import OtherForm     from './services/OtherForm'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<QuoteItem>) => void
  editItem: Partial<QuoteItem> | null
}

type ServiceType = 'hotel' | 'flight' | 'transfer' | 'other'

const SERVICES: { id: ServiceType; icon: string; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'hotel',    icon: '🏨', label: 'Hôtel',    desc: 'Réservation, nuitées, type de pension', color: '#92400e', bg: '#fef3c7' },
  { id: 'flight',   icon: '✈️', label: 'Vol',       desc: 'Billets avion aller-retour / simple',   color: '#1e40af', bg: '#dbeafe' },
  { id: 'transfer', icon: '🚐', label: 'Transfert', desc: 'Aéroport ↔ Hôtel, véhicule, bagages',  color: '#065f46', bg: '#d1fae5' },
  { id: 'other',    icon: '📋', label: 'Autre',     desc: 'Excursion, visa, assurance, etc.',      color: '#374151', bg: '#f3f4f6' },
]

/* ─── Styles light-mode garantis (overrides CSS vars) ─── */
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
  width: '100%', padding: '0.5rem 0.75rem',
  borderRadius: '0.5rem', fontSize: '0.875rem',
  outline: 'none', fontFamily: 'inherit',
  border: '1px solid #e5e7eb',
  background: '#ffffff', color: '#111827',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 500,
  color: '#6b7280', marginBottom: '0.25rem',
}

export default function ServiceModal({ open, onClose, onSave, editItem }: Props) {
  const [step,     setStep]     = useState<'choose' | 'form'>('choose')
  const [type,     setType]     = useState<ServiceType>('hotel')
  const [formData, setFormData] = useState<Partial<QuoteItem>>({})

  /* Initialise le formulaire */
  useEffect(() => {
    if (open) {
      if (editItem?.service_type) {
        setType(editItem.service_type as ServiceType)
        setStep('form')
        setFormData({ ...editItem })
      } else {
        setStep('choose')
        setFormData({})
      }
    }
  }, [open, editItem])

  if (!open) return null

  function handleFormChange(data: Partial<QuoteItem>) {
    setFormData(data)
  }

  function handleSave() {
    onSave({ ...formData, service_type: type })
    onClose()
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  }
  const backdropStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.55)',
  }
  const panelStyle: React.CSSProperties = {
    ...LIGHT,
    position: 'relative',
    width: '100%',
    maxWidth: step === 'choose' ? 480 : 700,
    maxHeight: '92vh',
    overflowY: 'auto',
    borderRadius: '1.25rem',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
    color: '#111827',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  }
  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2,
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }

  /* Prix calculé en temps réel */
  const qty   = Number(formData.quantity  || 1)
  const cost  = Number(formData.unit_cost || 0)
  const marge = Number(formData.margin_pct || 0)
  const unitPrice  = cost * (1 + marge / 100)
  const totalPrice = unitPrice * qty
  const totalCost  = cost * qty
  const profit     = totalPrice - totalCost
  const fmtDA = (n: number) =>
    new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0 }).format(Math.round(n))

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} onClick={onClose} />

      <div style={panelStyle}>
        {/* ── Header ── */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {step === 'form' && !editItem?.service_type && (
              <button
                onClick={() => setStep('choose')}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb', background: '#f3f4f6',
                  cursor: 'pointer', fontSize: '0.8125rem', color: '#374151' }}>
                ← Retour
              </button>
            )}
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                {step === 'choose'
                  ? '🛎 Ajouter une prestation'
                  : editItem?.service_type
                    ? `✏️ Modifier — ${SERVICES.find(s => s.id === type)?.label}`
                    : `➕ ${SERVICES.find(s => s.id === type)?.label}`}
              </h2>
              {step === 'choose' && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                  Choisissez le type de prestation à ajouter
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
            border: '1px solid #e5e7eb', background: '#f3f4f6',
            cursor: 'pointer', fontSize: '1rem', color: '#374151' }}>✕</button>
        </div>

        {/* ── STEP 1 : choisir le type ── */}
        {step === 'choose' && (
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {SERVICES.map(s => (
              <button key={s.id}
                onClick={() => { setType(s.id); setStep('form') }}
                style={{ padding: '1.25rem', borderRadius: '0.875rem',
                  border: '2px solid #e5e7eb', background: '#f9fafb',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = s.bg === '#f3f4f6' ? '#6b7280' : s.color
                  el.style.background  = s.bg
                  el.style.boxShadow   = '0 4px 16px rgba(0,0,0,0.07)'
                  el.style.transform   = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#e5e7eb'
                  el.style.background  = '#f9fafb'
                  el.style.boxShadow   = 'none'
                  el.style.transform   = 'none'
                }}>
                <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>{s.label}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4 }}>{s.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2 : formulaire ── */}
        {step === 'form' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#111827' }}>

            {/* Formulaire spécifique au service */}
            {type === 'hotel'    && <HotelForm    data={formData} onChange={handleFormChange} />}
            {type === 'flight'   && <FlightForm   data={formData} onChange={handleFormChange} />}
            {type === 'transfer' && <TransferForm data={formData} onChange={handleFormChange} />}
            {type === 'other'    && <OtherForm    data={formData} onChange={handleFormChange} />}

            {/* ── Section Prix ── */}
            <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd',
              borderRadius: '0.875rem', padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: '#0369a1', marginBottom: 2 }}>
                💰 Tarification
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {/* Quantité */}
                <div>
                  <label style={lbl}>Quantité</label>
                  <input type="number" min={1} value={formData.quantity || 1} style={inp}
                    onChange={e => setFormData(f => ({ ...f, quantity: Math.max(1, parseInt(e.target.value) || 1) }))} />
                </div>
                {/* Coût brut */}
                <div>
                  <label style={lbl}>Coût brut / unité (DA)</label>
                  <input type="number" min={0} step={100} value={formData.unit_cost || ''} style={inp}
                    placeholder="Ex: 50000"
                    onChange={e => setFormData(f => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))} />
                </div>
                {/* Marge */}
                <div>
                  <label style={lbl}>Marge (%)</label>
                  <input type="number" min={0} max={200} step={0.5} value={formData.margin_pct || ''} style={inp}
                    placeholder="Ex: 15"
                    onChange={e => setFormData(f => ({ ...f, margin_pct: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>

              {/* Récap live */}
              {cost > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: 2 }}>
                  {[
                    { label: 'Prix unitaire client', value: `${fmtDA(unitPrice)} DA`, color: '#0369a1' },
                    { label: 'Total client',          value: `${fmtDA(totalPrice)} DA`, color: '#0369a1' },
                    { label: 'Bénéfice',              value: `+${fmtDA(profit)} DA`,   color: '#059669' },
                  ].map(r => (
                    <div key={r.label} style={{ background: '#fff', borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem', border: '1px solid #bae6fd', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: r.color,
                        fontVariantNumeric: 'tabular-nums' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Boutons ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button onClick={onClose} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem',
                border: '1px solid #e5e7eb', background: '#f3f4f6',
                cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
                Annuler
              </button>
              <button onClick={handleSave} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.625rem',
                background: '#0f2c5c', color: '#ffffff', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}>
                {editItem?.service_type ? '✅ Modifier' : '➕ Ajouter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
