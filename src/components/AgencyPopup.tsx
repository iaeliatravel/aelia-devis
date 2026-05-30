'use client'
import { useState } from 'react'
import { AgencyConfig } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface Props {
  agency: AgencyConfig
  onUpdate: (a: AgencyConfig) => void
}

export default function AgencyPopup({ agency, onUpdate }: Props) {
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState<AgencyConfig>(agency)
  const [saving, setSaving] = useState(false)

  function setField(k: keyof AgencyConfig, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('agency_config')
      .update({
        name: form.name, address: form.address, city: form.city,
        phone: form.phone, email: form.email,
        logo_url: form.logo_url, stamp_url: form.stamp_url,
        rib: form.rib, footer_note: form.footer_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agency.id)
      .select().single()
    setSaving(false)
    if (!error && data) { onUpdate(data); setOpen(false) }
    else if (error) alert('Erreur: ' + error.message)
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1.5px solid #d1d5db',
    background: '#ffffff',
    fontSize: '0.875rem',
    color: '#111827',
    outline: 'none',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }
  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => { setForm(agency); setOpen(true) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0.4rem 0.875rem', borderRadius: '0.625rem',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-muted)',
          fontSize: '0.8125rem', cursor: 'pointer',
          transition: 'all 0.15s',
        }}>
        ⚙️ Agence
      </button>

      {/* Overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.50)',
            }}
          />

          {/* Panel — fond BLANC opaque, jamais flou ni transparent */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 540,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '1.125rem',
            background: '#ffffff',          // ← blanc pur, opaque
            border: '1px solid #e5e7eb',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            color: '#111827',               // ← texte foncé garanti
          }}>
            {/* Header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 1,
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                  ⚙️ Configuration de l'agence
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                  Ces informations apparaissent dans tous les devis
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{
                padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                border: '1px solid #e5e7eb', background: '#f3f4f6',
                cursor: 'pointer', fontSize: '1rem', color: '#374151',
              }}>✕</button>
            </div>

            {/* Form */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Logo URL — section mise en avant */}
              <div style={{
                background: '#eff6ff', border: '1.5px solid #bfdbfe',
                borderRadius: '0.75rem', padding: '1rem',
              }}>
                <label style={{ ...labelStyle, color: '#1d4ed8' }}>🖼️ URL du logo</label>
                <input
                  type="url"
                  value={form.logo_url || ''}
                  onChange={e => setField('logo_url', e.target.value)}
                  placeholder="https://... (Supabase Storage, drive direct, imgur...)"
                  style={{ ...inputBase, border: '1.5px solid #93c5fd' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  <strong>Comment ajouter le logo :</strong><br/>
                  1. Supabase → Storage → créer bucket <code>assets</code> (public)<br/>
                  2. Upload votre logo (PNG ou SVG recommandé)<br/>
                  3. Clic droit → Copier URL → coller ici<br/>
                  L'URL ressemble à : <em>https://xxxx.supabase.co/storage/v1/object/public/assets/logo.png</em>
                </p>
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Nom de l'agence *</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  style={inputBase} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Adresse</label>
                  <input type="text" value={form.address || ''} onChange={e => setField('address', e.target.value)} style={inputBase} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Ville</label>
                  <input type="text" value={form.city || ''} onChange={e => setField('city', e.target.value)} style={inputBase} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={form.phone || ''} onChange={e => setField('phone', e.target.value)} style={inputBase} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setField('email', e.target.value)} style={inputBase} />
                </div>
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>RIB / Infos paiement</label>
                <input type="text" value={form.rib || ''} onChange={e => setField('rib', e.target.value)} style={inputBase} />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Note de pied de page (devis)</label>
                <textarea value={form.footer_note || ''} onChange={e => setField('footer_note', e.target.value)}
                  rows={2} style={{ ...inputBase, resize: 'vertical' }} />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>URL du cachet / tampon</label>
                <input type="url" value={form.stamp_url || ''} onChange={e => setField('stamp_url', e.target.value)}
                  placeholder="Optionnel — même méthode que le logo"
                  style={inputBase} />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              position: 'sticky', bottom: 0,
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              background: '#ffffff',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
            }}>
              <button onClick={() => setOpen(false)} style={{
                padding: '0.625rem 1.25rem', borderRadius: '0.625rem',
                border: '1px solid #e5e7eb', background: '#f3f4f6',
                cursor: 'pointer', fontSize: '0.875rem', color: '#374151',
              }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '0.625rem 1.5rem', borderRadius: '0.625rem',
                background: '#0f2c5c', color: '#ffffff',
                border: 'none', cursor: saving ? 'wait' : 'pointer',
                fontSize: '0.875rem', fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
