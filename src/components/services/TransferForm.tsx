'use client'
import { QuoteItem } from '@/types/database'
import { buildTransferDescription } from '@/lib/description-builder'
import AutocompleteInput from '@/components/AutocompleteInput'
import NumberStepper from '@/components/NumberStepper'
import SelectField from '@/components/SelectField'

const TRANSFER_TYPES = [
  { value: 'Aéroport-Hôtel-Aéroport', label: '✈🏨✈ Aéroport ↔ Hôtel (aller-retour)' },
  { value: 'Aéroport-Hôtel',          label: '✈🏨 Aéroport → Hôtel (aller)' },
  { value: 'Hôtel-Aéroport',          label: '🏨✈ Hôtel → Aéroport (retour)' },
  { value: 'Transfert privé',          label: '🚗 Transfert privé' },
  { value: 'Excursion',                label: '🗺️ Excursion' },
]

const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }
const L = { fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' } as React.CSSProperties
const inp = { width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem', outline:'none', ...S } as React.CSSProperties

interface Props { data: Partial<QuoteItem>; onChange: (d: Partial<QuoteItem>) => void }

export default function TransferForm({ data, onChange }: Props) {
  const set = (field: keyof QuoteItem, value: unknown) => {
    const updated = { ...data, [field]: value }
    updated.description = buildTransferDescription(updated)
    onChange(updated)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <SelectField label="Type de transfert *" value={data.transfer_type||'Aéroport-Hôtel-Aéroport'}
          onChange={v=>set('transfer_type',v)} options={TRANSFER_TYPES} required />
        <AutocompleteInput label="Type de véhicule" category="vehicle_type" value={data.vehicle_type||''}
          onChange={v=>set('vehicle_type',v)} placeholder="Ex: Minibus 8 places" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <NumberStepper label="Nombre de personnes" value={data.passengers??1} onChange={v=>set('passengers',v)} min={1} />
        <NumberStepper label="Nombre de bagages"   value={data.luggage_count??0} onChange={v=>set('luggage_count',v)} />
      </div>
      <div style={{ padding:'1rem', borderRadius:'0.75rem', background:'var(--color-surface-offset)' }}>
        <p style={{ fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em',
          color:'var(--color-text-muted)', marginBottom:'0.75rem' }}>Informations facultatives</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={L}>Date et heure d&apos;arrivée</label>
            <input type="datetime-local" value={data.arrival_datetime?.slice(0,16)||''} onChange={e=>set('arrival_datetime',e.target.value)} style={inp} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={L}>Date et heure de départ</label>
            <input type="datetime-local" value={data.departure_datetime?.slice(0,16)||''} onChange={e=>set('departure_datetime',e.target.value)} style={inp} />
          </div>
        </div>
      </div>
    </div>
  )
}
