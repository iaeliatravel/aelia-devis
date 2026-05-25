'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase'
import { Quote, QuoteItem, AgencyConfig } from '@/types/database'
import { calcItemTotals, calcQuoteTotals } from '@/lib/quotes'
import { buildDescription } from '@/lib/description-builder'
import QuoteItemRow from './QuoteItemRow'
import ServiceModal from './ServiceModal'
import AgencyPopup  from './AgencyPopup'

const STATUS = [
  { value:'draft',    label:'📝 Brouillon' },
  { value:'sent',     label:'📨 Envoyé' },
  { value:'accepted', label:'✅ Accepté' },
  { value:'rejected', label:'❌ Refusé' },
  { value:'expired',  label:'⏰ Expiré' },
]
const S = { border:'1px solid var(--color-border)', background:'var(--color-surface)' }
const inp = { ...S, padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem', outline:'none', width:'100%' } as React.CSSProperties

interface Props {
  mode: 'new'|'edit'; quote?: Quote
  onCreate?: (clientId:string|null, clientName:string, clientPhone:string) => void
}

export default function QuoteEditor({ mode, quote, onCreate }: Props) {
  const [agency, setAgency]           = useState<AgencyConfig|null>(null)
  const [items, setItems]             = useState<QuoteItem[]>(quote?.items||[])
  const [clientName, setClientName]   = useState(quote?.client?.name||'')
  const [clientPhone, setClientPhone] = useState(quote?.client?.phone||'')
  const [remarks, setRemarks]         = useState(quote?.remarks||'')
  const [status, setStatus]           = useState(quote?.status||'draft')
  const [validityDays, setValidityDays] = useState(quote?.validity_days||7)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editItem, setEditItem]       = useState<Partial<QuoteItem>|null>(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    supabase.from('agency_config').select('*').single()
      .then(({ data }) => { if (data) setAgency(data) })
  }, [])

  const totals = calcQuoteTotals(items)
  const fmt = (n:number) => n.toLocaleString('fr-DZ',{minimumFractionDigits:0})

  const syncTotals = useCallback(async (newItems: QuoteItem[]) => {
    if (!quote?.id) return
    const t = calcQuoteTotals(newItems)
    await supabase.from('quotes').update({
      total_cost:t.total_cost, total_client:t.total_client, profit:t.profit,
      updated_at:new Date().toISOString(),
    }).eq('id', quote.id)
  }, [quote?.id])

  async function handleAddItem(data: Partial<QuoteItem>) {
    if (!quote?.id) return
    const computed = { ...calcItemTotals(data), description:buildDescription(data) }
    const { data:saved } = await supabase.from('quote_items')
      .insert({ ...computed, quote_id:quote.id, sort_order:items.length }).select().single()
    if (saved) {
      const newItems = [...items, saved as QuoteItem]
      setItems(newItems); await syncTotals(newItems)
    }
  }

  async function handleEditItem(data: Partial<QuoteItem>) {
    if (!editItem?.id) return
    const computed = { ...calcItemTotals(data), description:buildDescription(data) }
    await supabase.from('quote_items').update(computed).eq('id', editItem.id)
    const newItems = items.map(i => i.id===editItem.id ? {...i,...computed} as QuoteItem : i)
    setItems(newItems); await syncTotals(newItems); setEditItem(null)
  }

  async function handleDuplicate(item: QuoteItem) {
    if (!quote?.id) return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...rest } = item
    const { data } = await supabase.from('quote_items')
      .insert({ ...rest, quote_id:quote.id, sort_order:items.length }).select().single()
    if (data) {
      const newItems = [...items, data as QuoteItem]
      setItems(newItems); await syncTotals(newItems)
    }
  }

  async function handleDelete(itemId: string) {
    await supabase.from('quote_items').delete().eq('id', itemId)
    const newItems = items.filter(i=>i.id!==itemId)
    setItems(newItems); await syncTotals(newItems)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id===over.id) return
    const oldIdx = items.findIndex(i=>i.id===active.id)
    const newIdx = items.findIndex(i=>i.id===over.id)
    const newItems = arrayMove(items,oldIdx,newIdx).map((item,idx)=>({...item,sort_order:idx}))
    setItems(newItems)
    await Promise.all(newItems.map(i=>
      supabase.from('quote_items').update({sort_order:i.sort_order}).eq('id',i.id)
    ))
  }

  async function handleSave() {
    setSaving(true)
    if (quote?.id) {
      await supabase.from('quotes').update({
        remarks, status, validity_days:validityDays, updated_at:new Date().toISOString()
      }).eq('id', quote.id)
      if (quote.client_id)
        await supabase.from('clients').update({name:clientName,phone:clientPhone}).eq('id',quote.client_id)
    }
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  /* ── NEW MODE ─────────────────────────────────────────────── */
  if (mode==='new') {
    return (
      <div style={{ padding:'2rem', maxWidth:480, margin:'0 auto' }}>
        <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.875rem',
          color:'var(--color-text-muted)', textDecoration:'none', marginBottom:'1.5rem' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem' }}>Nouveau devis</h1>
        <div style={{ padding:'1.5rem', borderRadius:'1rem', ...S }}>
          {[
            { label:'Nom du client *', value:clientName, set:setClientName, type:'text',   placeholder:'Ahmed Benali' },
            { label:'Téléphone',       value:clientPhone,set:setClientPhone,type:'tel',    placeholder:'0555 123 456' },
          ].map(f=>(
            <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e=>f.set(e.target.value)}
                placeholder={f.placeholder} style={inp} autoFocus={f.label.includes('Nom')} />
            </div>
          ))}
          <button onClick={()=>onCreate?.(null,clientName,clientPhone)}
            disabled={!clientName.trim()} style={{
              width:'100%', padding:'0.75rem', borderRadius:'0.75rem', background:'var(--color-primary)',
              color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.9375rem',
              opacity: clientName.trim()?1:0.5, transition:'opacity 0.15s' }}>
            Créer le devis →
          </button>
        </div>
      </div>
    )
  }

  /* ── EDIT MODE ────────────────────────────────────────────── */
  return (
    <div style={{ padding:'1.5rem', maxWidth:1200, margin:'0 auto' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/" style={{ padding:'0.5rem', borderRadius:'0.5rem', fontSize:'1.125rem',
            textDecoration:'none', color:'var(--color-text-muted)' }}>←</Link>
          <div>
            <h1 style={{ fontSize:'1.25rem', fontWeight:700 }}>Devis {quote?.quote_number}</h1>
            <p style={{ fontSize:'0.75rem', color:'var(--color-text-muted)' }}>
              {clientName} · {new Date(quote?.issue_date||'').toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
          {agency && <AgencyPopup agency={agency} onUpdate={setAgency} />}
          <select value={status} onChange={e=>setStatus(e.target.value as typeof status)}
            style={{ padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem',
              outline:'none', cursor:'pointer', ...S }}>
            {STATUS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={()=>window.print()}
            style={{ padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.875rem',
              cursor:'pointer', ...S }}>🖨️ Imprimer</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding:'0.375rem 0.875rem', borderRadius:'0.5rem', color:'white', fontWeight:600,
            fontSize:'0.875rem', border:'none', cursor:'pointer', transition:'background 0.2s',
            background: saved?'var(--color-success)':'var(--color-primary)',
            opacity: saving?0.6:1 }}>
            {saved?'✅ Sauvegardé !': saving?'⏳...':'💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem', alignItems:'start' }}>
        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Client */}
          <div style={{ padding:'1.25rem', borderRadius:'1rem', ...S }}>
            <h2 style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.875rem' }}>👤 Client</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {[{label:'Nom',v:clientName,set:setClientName,type:'text'},{label:'Téléphone',v:clientPhone,set:setClientPhone,type:'tel'}].map(f=>(
                <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-muted)' }}>{f.label}</label>
                  <input type={f.type} value={f.v} onChange={e=>f.set(e.target.value)} style={inp} />
                </div>
              ))}
            </div>
          </div>

          {/* Prestations */}
          <div style={{ padding:'1.25rem', borderRadius:'1rem', ...S }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.875rem' }}>
              <h2 style={{ fontSize:'0.875rem', fontWeight:600 }}>🛎 Prestations ({items.length})</h2>
              <button onClick={()=>{ setEditItem(null); setModalOpen(true) }} style={{
                padding:'0.375rem 0.875rem', borderRadius:'0.625rem', background:'var(--color-primary)',
                color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.8125rem' }}>
                ＋ Ajouter
              </button>
            </div>
            {items.length===0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'3rem 1rem', gap:'0.75rem',
                color:'var(--color-text-muted)' }}>
                <span style={{ fontSize:'3rem' }}>🛎</span>
                <p style={{ fontWeight:500 }}>Aucune prestation</p>
                <p style={{ fontSize:'0.8125rem', textAlign:'center', maxWidth:280 }}>
                  Cliquez sur « + Ajouter » pour ajouter un hôtel, un vol ou un transfert
                </p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    {items.map((item,idx)=>(
                      <QuoteItemRow key={item.id} item={item} index={idx}
                        onEdit={i=>{ setEditItem(i); setModalOpen(true) }}
                        onDuplicate={handleDuplicate} onDelete={handleDelete} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Remarques */}
          <div style={{ padding:'1.25rem', borderRadius:'1rem', ...S }}>
            <h2 style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.75rem' }}>📝 Remarques</h2>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}
              placeholder="Conditions particulières, notes pour le client..."
              style={{ ...inp, resize:'vertical' }} />
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', position:'sticky', top:80 }}>
          {/* Bilan */}
          <div style={{ padding:'1.25rem', borderRadius:'1rem', ...S }}>
            <h2 style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'1rem' }}>💰 Bilan financier</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {[
                { label:'Coût total (brut)', value:`${fmt(totals.total_cost)} DA`,   color:'var(--color-text)' },
                { label:'Total client',      value:`${fmt(totals.total_client)} DA`, color:'var(--color-text)', bold:true },
              ].map(r=>(
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--color-text-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight:r.bold?700:500, fontVariantNumeric:'tabular-nums', color:r.color }}>{r.value}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid var(--color-border)', paddingTop:'0.625rem',
                display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}>
                <span style={{ color:'var(--color-text-muted)' }}>Bénéfice net</span>
                <span style={{ fontWeight:700, fontVariantNumeric:'tabular-nums', color:'var(--color-success)' }}>
                  +{fmt(totals.profit)} DA
                </span>
              </div>
              {totals.total_cost>0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem',
                  color:'var(--color-text-muted)' }}>
                  <span>Marge globale</span>
                  <span>{((totals.profit/totals.total_cost)*100).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid var(--color-border)' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:500,
                color:'var(--color-text-muted)', marginBottom:4 }}>Validité (jours)</label>
              <input type="number" min={1} max={90} value={validityDays}
                onChange={e=>setValidityDays(parseInt(e.target.value)||7)} style={inp} />
            </div>
          </div>

          {/* Agence */}
          {agency && (
            <div style={{ padding:'1.25rem', borderRadius:'1rem', ...S, fontSize:'0.8125rem' }}>
              <p style={{ fontWeight:600, marginBottom:4 }}>🏢 {agency.name}</p>
              {agency.address && <p style={{ color:'var(--color-text-muted)' }}>{agency.address}</p>}
              {agency.city    && <p style={{ color:'var(--color-text-muted)' }}>{agency.city}</p>}
              {agency.phone   && <p style={{ color:'var(--color-text-muted)', marginTop:4 }}>{agency.phone}</p>}
            </div>
          )}
        </div>
      </div>

      <ServiceModal open={modalOpen}
        onClose={()=>{ setModalOpen(false); setEditItem(null) }}
        onSave={editItem ? handleEditItem : handleAddItem}
        editItem={editItem} />
    </div>
  )
}
