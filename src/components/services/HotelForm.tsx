'use client'
import { useEffect } from 'react'
import { QuoteItem } from '@/types/database'

// src/components/services/HotelForm.tsx
import { buildHotelDescription } from '@/lib/description-builder'

// src/components/services/FlightForm.tsx
import { buildFlightDescription } from '@/lib/description-builder'

import AutocompleteInput from '@/components/AutocompleteInput'
import NumberStepper from '@/components/NumberStepper'
import SelectField from '@/components/SelectField'

const BOARD_OPTIONS = [
  { value: 'room_only',     label: 'Chambre seulement' },
  { value: 'breakfast',     label: 'Petit déjeuner' },
  { value: 'half_board',    label: 'Demi pension' },
  { value: 'full_board',    label: 'Pension complète' },
  { value: 'all_inclusive', label: 'Tout inclus' },
]
const ROOM_OPTIONS = [
  { value: 'Chambre simple', label: 'Chambre simple' },
  { value: 'Chambre double', label: 'Chambre double' },
  { value: 'Chambre triple', label: 'Chambre triple' },
  { value: 'Chambre twin',   label: 'Chambre twin' },
  { value: 'Suite',          label: 'Suite' },
  { value: 'Appartement',    label: 'Appartement' },
  { value: 'Junior Suite',   label: 'Junior Suite' },
]

const S = { border: '1px solid var(--color-border)', background: 'var(--color-surface)' }
const L = { fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' } as React.CSSProperties

function grid(cols: number) {
  return { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem' } as React.CSSProperties
}

interface Props { data: Partial<QuoteItem>; onChange: (d: Partial<QuoteItem>) => void }

export default function HotelForm({ data, onChange }: Props) {
  const set = (field: keyof QuoteItem, value: unknown) => {
    const updated = { ...data, [field]: value }
    updated.description = buildHotelDescription(updated)
    onChange(updated)
  }

  useEffect(() => {
    if (!data.description) onChange({ ...data, description: buildHotelDescription(data) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let nights = 0
  if (data.checkin_date && data.checkout_date) {
    const d1 = new Date(data.checkin_date), d2 = new Date(data.checkout_date)
    nights = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000))
  }

  const inp = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', ...S } as React.CSSProperties

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={grid(3)}>
        <AutocompleteInput label="Nom de l'hôtel *" category="hotel" value={data.hotel_name||''} onChange={v=>set('hotel_name',v)} placeholder="Ex: Abou Sofiane Hotel" required />
        <AutocompleteInput label="Ville *" category="city" value={data.hotel_city||''} onChange={v=>set('hotel_city',v)} placeholder="Ex: Sousse" required />
        <AutocompleteInput label="Pays *" category="country" value={data.hotel_country||''} onChange={v=>set('hotel_country',v)} placeholder="Ex: Tunisie" required />
      </div>
      <div style={grid(4)}>
        <NumberStepper label="Adultes" value={data.adults??1} onChange={v=>set('adults',v)} min={1} />
        <NumberStepper label="Enfants" value={data.children??0} onChange={v=>set('children',v)} />
        <SelectField label="Type de chambre *" value={data.room_type||''} onChange={v=>set('room_type',v)} options={ROOM_OPTIONS} placeholder="Choisir..." required />
        <SelectField label="Hébergement *" value={data.board_type||''} onChange={v=>set('board_type',v)} options={BOARD_OPTIONS} placeholder="Choisir..." required />
      </div>
      <div style={grid(3)}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={L}>Date d&apos;arrivée *</label>
          <input type="date" value={data.checkin_date||''} onChange={e=>set('checkin_date',e.target.value)} required style={inp} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={L}>Date de départ *</label>
          <input type="date" value={data.checkout_date||''} min={data.checkin_date||undefined} onChange={e=>set('checkout_date',e.target.value)} required style={inp} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={L}>Nuitées (auto)</label>
          <div style={{ padding:'0.5rem 0.75rem', borderRadius:'0.5rem', border:'1px solid var(--color-border)',
            background:'var(--color-surface-offset)', fontWeight:600, color:'var(--color-primary)', fontSize:'0.875rem' }}>
            🌙 {nights>0?`${nights} nuit${nights>1?'ées':'ée'}`:'—'}
          </div>
        </div>
      </div>
    </div>
  )
}
