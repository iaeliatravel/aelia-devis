'use client'
import { QuoteItem } from '@/types/database'
interface Props { data: Partial<QuoteItem>; onChange: (d: Partial<QuoteItem>) => void }
export default function OtherForm({ data, onChange }: Props) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' }}>
        Description de la prestation *
      </label>
      <textarea rows={5} value={data.other_description||''}
        onChange={e => onChange({ ...data, other_description:e.target.value, description:e.target.value })}
        placeholder="Décrivez la prestation : visa, assurance voyage, excursion, guide, entrée musée..."
        required style={{ width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', resize:'vertical',
          border:'1px solid var(--color-border)', background:'var(--color-surface)',
          fontSize:'0.875rem', outline:'none' }} />
    </div>
  )
}
