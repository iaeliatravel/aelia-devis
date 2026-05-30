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
  { id: 'hotel',    icon: '🏨', label: 'Hôtel',       desc: 'Réservation, nuitées, type de pension', color: '#92400e', bg: '#fef3c7' },
  { id: 'flight',   icon: '✈️', label: 'Vol',          desc: 'Billets avion aller-retour / simple',    color: '#1e40af', bg: '#dbeafe' },
  { id: 'transfer', icon: '🚐', label: 'Transfert',    desc: 'Aéroport ↔ Hôtel, véhicule, bagages',   color: '#065f46', bg: '#d1fae5' },
  { id: 'other',    icon: '📋', label: 'Autre',        desc: 'Excursion, visa, assurance, etc.',       color: '#374151', bg: '#f3f4f6' },
]

export default function ServiceModal({ open, onClose, onSave, editItem }: Props) {
  const [step, setStep] = useState<'choose' | 'form'>('choose')
  const [type, setType] = useState<ServiceType>('hotel')

  useEffect(() => {
    if (open) {
      if (editItem?.service_type) {
        setType(editItem.service_type as ServiceType)
        setStep('form')
      } else {
        setStep('choose')
      }
    }
  }, [open, editItem])

  if (!open) return null

  function handleSave(data: Partial<QuoteItem>) {
    onSave({ ...data, service_type: type })
    onClose()
  }

  // Styles constants — tout en variables inline pour 100% blanc opaque
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
    position: 'relative',
    width: '100%',
    maxWidth: step === 'choose' ? 480 : 680,
    maxHeight: '92vh',
    overflowY: 'auto',
    borderRadius: '1.25rem',
    background: '#ffffff',       // ← blanc pur absolu
    border: '1px solid #e5e7eb',
    boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
    color: '#111827',            // ← texte foncé absolu
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  }
  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2,
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} onClick={onClose} />

      <div style={panelStyle}>
        {/* Header */}
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
          <button onClick={onClose} style={{
            padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
            border: '1px solid #e5e7eb', background: '#f3f4f6',
            cursor: 'pointer', fontSize: '1rem', color: '#374151',
          }}>✕</button>
        </div>

        {/* STEP 1 — choisir le type */}
        {step === 'choose' && (
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { setType(s.id); setStep('form') }}
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.875rem',
                  border: '2px solid #e5e7eb',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                }}
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

        {/* STEP 2 — formulaire */}
        {step === 'form' && (
          <div style={{ padding: '1.5rem', color: '#111827' }}>
            {type === 'hotel'    && <HotelForm    editItem={editItem} onSave={handleSave} onCancel={onClose} />}
            {type === 'flight'   && <FlightForm   editItem={editItem} onSave={handleSave} onCancel={onClose} />}
            {type === 'transfer' && <TransferForm editItem={editItem} onSave={handleSave} onCancel={onClose} />}
            {type === 'other'    && <OtherForm    editItem={editItem} onSave={handleSave} onCancel={onClose} />}
          </div>
        )}
      </div>
    </div>
  )
}
