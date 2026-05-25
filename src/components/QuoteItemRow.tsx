'use client'
import { QuoteItem } from '@/types/database'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SERVICE_BADGES: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  hotel:    { icon: '🏨', label: 'Hôtel',    bg: '#fef3c7', color: '#92400e' },
  flight:   { icon: '✈️', label: 'Vol',       bg: '#dbeafe', color: '#1e40af' },
  transfer: { icon: '🚐', label: 'Transfert', bg: '#d1fae5', color: '#065f46' },
  other:    { icon: '📋', label: 'Autre',     bg: '#f3f4f6', color: '#374151' },
}

interface Props {
  item: QuoteItem
  index: number
  onEdit: (item: QuoteItem) => void
  onDuplicate: (item: QuoteItem) => void
  onDelete: (id: string) => void
}

export default function QuoteItemRow({ item, index, onEdit, onDuplicate, onDelete }: Props) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id })

  const badge = SERVICE_BADGES[item.service_type] ?? SERVICE_BADGES.other
  const fmt = (n: number) => n.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })

  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'border-color 0.15s',
    opacity: isDragging ? 0.4 : 1,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    borderRadius: '0.75rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  }

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className="group"
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)' }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        title="Déplacer"
        style={{
          marginTop: '2px',
          padding: '4px',
          borderRadius: '6px',
          cursor: 'grab',
          color: 'var(--color-text-faint)',
          background: 'none',
          border: 'none',
          touchAction: 'none',
          flexShrink: 0,
        }}
      >
        ⠿
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            #{index + 1}
          </span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '9999px',
              fontSize: '0.7rem', fontWeight: 600,
              background: badge.bg, color: badge.color,
            }}
          >
            {badge.icon} {badge.label}
          </span>
        </div>
        <p style={{
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          color: 'var(--color-text)',
        }}>
          {item.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
          {[
            `Qté : ${item.quantity}`,
            `Brut : ${fmt(item.unit_cost)} DA`,
            `Marge : ${item.margin_pct}%`,
          ].map(t => (
            <span key={t} style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Price */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        gap: '4px', minWidth: '110px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Prix client</span>
        <span style={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(item.total_price)} DA
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-success)' }}>
          +{fmt(item.profit)} DA
        </span>
      </div>

      {/* Actions */}
      <div
        className="group-hover-actions"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          flexShrink: 0, opacity: 0, transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
      >
        {[
          { icon: '✏️', title: 'Modifier',   action: () => onEdit(item) },
          { icon: '📋', title: 'Dupliquer',  action: () => onDuplicate(item) },
          {
            icon: '🗑️', title: 'Supprimer',
            action: () => { if (confirm('Supprimer cette prestation ?')) onDelete(item.id) },
          },
        ].map(btn => (
          <button
            key={btn.title}
            title={btn.title}
            onClick={btn.action}
            style={{
              padding: '6px', borderRadius: '8px',
              border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = btn.icon === '🗑️' ? '#fee2e2' : 'var(--color-primary-highlight)'
              el.style.color = btn.icon === '🗑️' ? '#dc2626' : 'var(--color-primary)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'none'
              el.style.color = 'var(--color-text-muted)'
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
