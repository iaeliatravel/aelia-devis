'use client'
import { QuoteItem } from '@/types/database'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const BADGES: Record<string,{icon:string;bg:string;color:string;label:string}> = {
  hotel:    { icon:'🏨', label:'Hôtel',     bg:'#fef3c7', color:'#92400e' },
  flight:   { icon:'✈️', label:'Vol',        bg:'#dbeafe', color:'#1e40af' },
  transfer: { icon:'🚐', label:'Transfert',  bg:'#d1fae5', color:'#065f46' },
  other:    { icon:'📋', label:'Autre',      bg:'#f3f4f6', color:'#374151' },
}

interface Props {
  item: QuoteItem; index: number
  onEdit: (item: QuoteItem) => void
  onDuplicate: (item: QuoteItem) => void
  onDelete: (id: string) => void
}

export default function QuoteItemRow({ item, index, onEdit, onDuplicate, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const badge = BADGES[item.service_type]
  const fmt = (n:number) => n.toLocaleString('fr-DZ',{minimumFractionDigits:0})

  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      opacity: isDragging ? 0.4 : 1,
      display:'flex', alignItems:'flex-start', gap:'0.75rem',
      padding:'0.875rem 1rem', borderRadius:'0.75rem',
      border:'1px solid var(--color-border)', background:'var(--color-surface)',
      transition:'border-color 0.15s',
    }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--color-primary)')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--color-border)')}>
      {/* Drag handle */}
      <button {...attributes} {...listeners} style={{
        marginTop:2, padding:4, borderRadius:4, cursor:'grab',
        color:'var(--color-text-faint)', background:'none', border:'none',
        flexShrink:0, fontSize:'1rem', touchAction:'none',
      }}>⠿</button>
      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:4 }}>
          <span style={{ fontSize:'0.6875rem', color:'var(--color-text-faint)' }}>#{index+1}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
            borderRadius:9999, fontSize:'0.6875rem', fontWeight:600,
            background:badge.bg, color:badge.color }}>
            {badge.icon} {badge.label}
          </span>
        </div>
        <p style={{ fontSize:'0.8125rem', lineHeight:1.55, wordBreak:'break-word' }}>{item.description}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', marginTop:'0.375rem' }}>
          {[`Qté : ${item.quantity}`,`Coût brut : ${fmt(item.unit_cost)} DA`,`Marge : ${item.margin_pct}%`].map(t=>(
            <span key={t} style={{ fontSize:'0.6875rem', color:'var(--color-text-muted)' }}>{t}</span>
          ))}
        </div>
      </div>
      {/* Price */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2, minWidth:120, flexShrink:0 }}>
        <span style={{ fontSize:'0.6875rem', color:'var(--color-text-muted)' }}>Prix client</span>
        <span style={{ fontSize:'1rem', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
          {fmt(item.total_price)} DA
        </span>
        <span style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--color-success)' }}>
          +{fmt(item.profit)} DA
        </span>
      </div>
      {/* Actions */}
      <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
        {[
          { icon:'✏️', title:'Modifier',   fn:()=>onEdit(item) },
          { icon:'📋', title:'Dupliquer',  fn:()=>onDuplicate(item) },
          { icon:'🗑️', title:'Supprimer',  fn:()=>{ if(confirm('Supprimer ?')) onDelete(item.id) } },
        ].map(a=>(
          <button key={a.title} onClick={a.fn} title={a.title}
            style={{ width:28, height:28, borderRadius:6, border:'none', background:'transparent',
              cursor:'pointer', fontSize:'0.875rem', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background 0.1s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--color-surface-offset)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            {a.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
