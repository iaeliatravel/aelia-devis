'use client'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  step?: number
}

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  step = 1,
}: Props) {
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
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={{
            padding: '0.25rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
          }}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          min={min}
          max={max}
          style={{
            flex: 1,
            padding: '0.25rem 0.375rem',
            textAlign: 'center',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            outline: 'none',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          style={{
            padding: '0.25rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
