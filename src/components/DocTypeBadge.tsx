'use client'
import { DocumentType } from '@/types/database'

interface Config { icon: string; label: string; color: string; bg: string; border: string }

export const DOC_TYPE_CONFIG: Record<DocumentType, Config> = {
  devis:         { icon:'📄', label:'Devis',            color:'#1d4ed8', bg:'#dbeafe', border:'#93c5fd' },
  proforma:      { icon:'📋', label:'Facture Proforma', color:'#92400e', bg:'#fef3c7', border:'#fcd34d' },
  facture:       { icon:'🧾', label:'Facture',          color:'#065f46', bg:'#d1fae5', border:'#6ee7b7' },
  bon_versement: { icon:'💳', label:'Bon de Versement', color:'#7c2d12', bg:'#fee2e2', border:'#fca5a5' },
}

interface Props {
  type?: DocumentType | string | null
  size?: 'sm' | 'md'
}

export default function DocTypeBadge({ type, size = 'sm' }: Props) {
  const cfg  = DOC_TYPE_CONFIG[(type as DocumentType)] ?? DOC_TYPE_CONFIG.devis
  const pad  = size === 'sm' ? '2px 8px'   : '4px 12px'
  const font = size === 'sm' ? '0.6875rem' : '0.8125rem'
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      padding:pad, borderRadius:20,
      background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`,
      fontSize:font, fontWeight:600, whiteSpace:'nowrap' }}>
      <span>{cfg.icon}</span>{cfg.label}
    </span>
  )
}
