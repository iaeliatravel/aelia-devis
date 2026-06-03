'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AgencyConfig } from '@/types/database'
import { supabase } from '@/lib/supabase'

const inp: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
  border: '1px solid #d1d5db', background: '#ffffff', fontSize: '0.875rem',
  color: '#111827', outline: 'none', fontFamily: 'inherit',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 500,
  color: '#6b7280', marginBottom: '0.25rem',
}
const section: React.CSSProperties = {
  padding: '1.25rem 1.5rem', borderRadius: '0.875rem',
  border: '1px solid #e5e7eb', background: '#fff',
  display: 'flex', flexDirection: 'column', gap: '1rem',
}

export default function SettingsPage() {
  const [form,    setForm]    = useState<Partial<AgencyConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    supabase.from('agency_config').select('*').single()
      .then(({ data }) => { if (data) setForm(data) })
      .finally(() => setLoading(false))
  }, [])

  const set = (k: keyof AgencyConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.name?.trim()) { setError('Le nom de l\'agence est requis.'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('agency_config').update({
      name:        form.name,
      address:     form.address     || null,
      city:        form.city        || null,
      phone:       form.phone       || null,
      email:       form.email       || null,
      logo_url:    form.logo_url    || null,
      stamp_url:   form.stamp_url   || null,
      rib:         form.rib         || null,
      rc:          form.rc          || null,
      nif:         form.nif         || null,
      nis:         form.nis         || null,
      footer_note: form.footer_note || null,
      updated_at:  new Date().toISOString(),
    }).eq('id', form.id!)
    setSaving(false)
    if (err) setError(err.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
      Chargement…
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: 680, margin: '0 auto', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
          border: '1px solid #e5e7eb', background: '#f3f4f6', textDecoration: 'none',
          fontSize: '0.875rem', color: '#374151' }}>
          ← Retour
        </Link>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>⚙️ Paramètres agence</h1>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: 2 }}>
            Ces informations apparaissent dans tous vos documents
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Informations générales */}
        <div style={section}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>🏢 Informations générales</h2>
          <div>
            <label style={lbl}>Nom de l'agence *</label>
            <input value={form.name || ''} onChange={set('name')} style={inp} placeholder="AELIA TRAVEL AGENCY" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Adresse</label>
              <input value={form.address || ''} onChange={set('address')} style={inp} placeholder="Cité La Radieuse" />
            </div>
            <div>
              <label style={lbl}>Ville</label>
              <input value={form.city || ''} onChange={set('city')} style={inp} placeholder="Alger" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Téléphone</label>
              <input value={form.phone || ''} onChange={set('phone')} style={inp} placeholder="023 XX XX XX" />
            </div>
            <div>
              <label style={lbl}>E-mail</label>
              <input type="email" value={form.email || ''} onChange={set('email')} style={inp} placeholder="contact@agence.dz" />
            </div>
          </div>
          <div>
            <label style={lbl}>Note de bas de page (documents)</label>
            <textarea value={form.footer_note || ''} onChange={e => setForm(f => ({ ...f, footer_note: e.target.value }))}
              rows={2} style={{ ...inp, resize: 'none' }}
              placeholder="Sous réserve de disponibilité — Prix en Dinars Algériens" />
          </div>
        </div>

        {/* Informations fiscales — apparaissent dans les factures uniquement */}
        <div style={section}>
          <div>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>🧾 Informations fiscales</h2>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
              Apparaissent uniquement dans les <strong>Factures</strong>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>RC (Registre du Commerce)</label>
              <input value={form.rc || ''} onChange={set('rc')} style={inp} placeholder="16/00-XXXXXXXX B 00" />
            </div>
            <div>
              <label style={lbl}>NIF (Identification Fiscale)</label>
              <input value={form.nif || ''} onChange={set('nif')} style={inp} placeholder="XXXXXXXXXXXXXXXX" />
            </div>
            <div>
              <label style={lbl}>NIS (Identification Statistique)</label>
              <input value={form.nis || ''} onChange={set('nis')} style={inp} placeholder="XXXXXXXXXXXXXXXX" />
            </div>
          </div>
          <div>
            <label style={lbl}>RIB (Coordonnées bancaires)</label>
            <input value={form.rib || ''} onChange={set('rib')} style={inp} placeholder="CPA — 007 00016 4000XXXXXX 61" />
          </div>
        </div>

        {/* Images */}
        <div style={section}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>🖼️ Images</h2>

          <div>
            <label style={lbl}>URL du Logo (entête des documents)</label>
            <input value={form.logo_url || ''} onChange={set('logo_url')} style={inp}
              placeholder="https://xxx.supabase.co/storage/v1/object/public/assets/logo.png" />
            {form.logo_url && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={form.logo_url} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain',
                  borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb' }} />
                <span style={{ fontSize: '0.75rem', color: '#059669' }}>✅ Logo chargé</span>
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>URL du Cachet / Tampon (optionnel — ajouté à gauche du total si activé)</label>
            <input value={form.stamp_url || ''} onChange={set('stamp_url')} style={inp}
              placeholder="https://xxx.supabase.co/storage/v1/object/public/assets/cachet.png" />
            {form.stamp_url && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={form.stamp_url} alt="Cachet" style={{ width: 48, height: 48, objectFit: 'contain',
                  borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb' }} />
                <span style={{ fontSize: '0.75rem', color: '#059669' }}>✅ Cachet chargé</span>
              </div>
            )}
            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 6 }}>
              📌 Uploader l'image dans Supabase → Storage → Bucket <strong>assets</strong> (mode public) → copier l'URL publique
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem',
            background: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '0.875rem', borderRadius: '0.75rem',
            background: saved ? '#059669' : '#0f2c5c', color: '#fff',
            border: 'none', cursor: saving ? 'wait' : 'pointer', fontWeight: 700,
            fontSize: '0.9375rem', opacity: saving ? 0.6 : 1, transition: 'background 0.2s' }}>
          {saved ? '✅ Paramètres sauvegardés !' : saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder les paramètres'}
        </button>
      </div>
    </div>
  )
}
