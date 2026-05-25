'use client'
import { useState } from 'react'
import { AgencyConfig } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface Props { agency: AgencyConfig; onUpdate: (a: AgencyConfig) => void }

export default function AgencyPopup({ agency, onUpdate }: Props) {
  const [open, setOpen]     = useState(false)
  const [form, setForm]     = useState<AgencyConfig>(agency)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('agency_config').update({ ...form, updated_at: new Date().toISOString() }).eq('id', agency.id)
    onUpdate(form); setSaving(false); setOpen(false)
  }

  const BS = { border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' } as React.CSSProperties
  const inp: React.CSSProperties = { ...BS, width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }
  const fields = [
    { label: 'Nom de l\'agence', key: 'name' }, { label: 'Adresse', key: 'address' },
    { label: 'Ville', key: 'city' }, { label: 'Téléphone', key: 'phone' },
    { label: 'Email', key: 'email' }, { label: 'RIB', key: 'rib' },
    { label: 'Note de bas de page', key: 'footer_note' },
  ]

  return (
    <>
      <button onClick={() => { setForm(agency); setOpen(true) }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        ⚙️ Agence
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: '1rem',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontWeight: 700 }}>⚙️ Configuration de l&apos;agence</h2>
              <button onClick={() => setOpen(false)} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {fields.map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>{f.label}</label>
                  <input type="text" value={(form[f.key as keyof AgencyConfig] as string) || ''}
                    onChange={e => setForm(d => ({ ...d, [f.key]: e.target.value }))}
                    style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem' }}>Annuler</button>
              <button onClick={save} disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.625rem', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: saving ? 0.6 : 1 }}>
                {saving ? '⏳...' : '✅ Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
