'use client'
import { useState, useEffect, useRef } from 'react'
import { getSuggestions } from '@/lib/suggestions'

interface Props {
  value: string
  onChange: (value: string) => void
  category: string
  placeholder?: string
  label?: string
  required?: boolean
}

export default function AutocompleteInput({
  value,
  onChange,
  category,
  placeholder = '',
  label,
  required,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length > 0) {
        setLoading(true)
        getSuggestions(category, value).then(s => {
          setSuggestions(s)
          setLoading(false)
          setIsOpen(true)
        })
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value, category])

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            display: 'block',
            marginBottom: '0.25rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => value && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            paddingRight: '2rem',
          }}
        />
        {loading && (
          <span
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            ⟳
          </span>
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            maxHeight: '12rem',
            overflowY: 'auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => {
                onChange(s)
                setIsOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-offset)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
