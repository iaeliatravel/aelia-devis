/**
 * ManualProfitSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Composant à intégrer dans QuoteEditor (sidebar, sous le bilan automatique).
 *
 * USAGE dans QuoteEditor.tsx :
 *   import ManualProfitSection from './ManualProfitSection'
 *   ...
 *   <ManualProfitSection
 *     quoteId={quote.id}
 *     initialValue={quote.manual_profit ?? null}
 *     enabled={quote.manual_profit_enabled ?? false}
 *   />
 *
 * MIGRATION SQL à exécuter dans Supabase → SQL Editor :
 *   ALTER TABLE quotes
 *     ADD COLUMN IF NOT EXISTS manual_profit         NUMERIC(12,2),
 *     ADD COLUMN IF NOT EXISTS manual_profit_enabled BOOLEAN DEFAULT false;
 */
'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  quoteId: string
  initialValue: number | null
  enabled: boolean
}

export default function ManualProfitSection({ quoteId, initialValue, enabled: initEnabled }: Props) {
  const [enabled, setEnabled]   = useState(initEnabled)
  const [value, setValue]       = useState<string>(initialValue != null ? String(initialValue) : '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0 }).format(n)

  async function persist(newEnabled: boolean, newValue: string) {
    setSaving(true)
    const numVal = newValue === '' ? null : parseFloat(newValue.replace(/\s/g, '').replace(',', '.')) || null
    await supabase.from('quotes').update({
      manual_profit_enabled: newEnabled,
      manual_profit: numVal,
      updated_at: new Date().toISOString(),
    }).eq('id', quoteId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleEnabled(val: boolean) {
    setEnabled(val)
    persist(val, value)
  }

  function handleValueChange(v: string) {
    setValue(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => persist(enabled, v), 800)
  }

  const numVal = parseFloat(value.replace(/\s/g, '').replace(',', '.'))

  return (
    <div style={{
      border: '1.5px solid',
      borderColor: enabled ? '#bbf7d0' : 'var(--color-border)',
      borderRadius: '0.875rem',
      background: enabled ? '#f0fdf4' : 'var(--color-surface)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Toggle row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: enabled ? '#dcfce7' : 'var(--color-surface-offset)',
        borderBottom: enabled ? '1px solid #bbf7d0' : '1px solid transparent',
      }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text)' }}>
            💰 Bénéfice manuel
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
            Remplace le calcul automatique
          </p>
        </div>
        {/* Toggle switch */}
        <button
          onClick={() => toggleEnabled(!enabled)}
          aria-label="Activer bénéfice manuel"
          style={{
            position: 'relative', width: 44, height: 24,
            borderRadius: 9999, border: 'none', cursor: 'pointer',
            background: enabled ? '#16a34a' : '#d1d5db',
            transition: 'background 0.2s', flexShrink: 0,
          }}>
          <span style={{
            position: 'absolute', top: 3,
            left: enabled ? 23 : 3,
            width: 18, height: 18, borderRadius: 9999,
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Input — visible only when enabled */}
      {enabled && (
        <div style={{ padding: '0.875rem 1rem' }}>
          <label style={{
            display: 'block', fontSize: '0.75rem', fontWeight: 600,
            color: '#166534', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '0.375rem',
          }}>
            Montant bénéfice (DA)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min={0}
              step={100}
              value={value}
              onChange={e => handleValueChange(e.target.value)}
              placeholder="Ex: 15000"
              autoFocus
              style={{
                width: '100%', padding: '0.625rem 3.5rem 0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1.5px solid #86efac',
                background: '#ffffff',
                fontSize: '1rem', fontWeight: 700, color: '#166534',
                outline: 'none', fontVariantNumeric: 'tabular-nums',
              }}
            />
            <span style={{
              position: 'absolute', right: '0.75rem', top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem', fontWeight: 600, color: '#16a34a',
            }}>DA</span>
          </div>
          {!isNaN(numVal) && numVal > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.375rem' }}>
              → {fmt(numVal)} DA enregistré
            </p>
          )}
          {saving && <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 4 }}>⏳ Sauvegarde...</p>}
          {saved  && <p style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: 4 }}>✅ Sauvegardé !</p>}
        </div>
      )}
    </div>
  )
}
