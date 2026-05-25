'use client'

interface Props {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}

export default function SelectField({ label, value, onChange, options, required }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {label && (
        <label
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          outline: 'none',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          cursor: 'pointer',
        }}
      >
        <option value="">— Sélectionner —</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
