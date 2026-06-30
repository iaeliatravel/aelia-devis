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
import { Quote, QuoteItem, AgencyConfig, DocumentType } from '@/types/database'
import { calcItemTotals, calcQuoteTotals } from '@/lib/quotes'
import { buildDescription } from '@/lib/description-builder'
import QuoteItemRow       from './QuoteItemRow'
import ServiceModal       from './ServiceModal'
import ClientShareModal   from './ClientShareModal'
import ManualProfitSection from './ManualProfitSection'
import DocTypeBadge        from './DocTypeBadge'
import VoucherModal from './VoucherModal'

const STATUS = [
  {value:'draft',    label:'📝 Brouillon'},
  {value:'sent',     label:'📨 Envoyé'},
  {value:'accepted', label:'✅ Accepté'},
  {value:'rejected', label:'❌ Refusé'},
  {value:'expired',  label:'⏰ Expiré'},
]
const S   = {border:'1px solid var(--color-border)',background:'var(--color-surface)'}
const inp = {...S,padding:'0.5rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.875rem',outline:'none',width:'100%'} as React.CSSProperties

interface Props {
  mode: 'new' | 'edit'
  quote?: Quote
  onCreate?: (clientId:string|null,clientName:string,clientPhone:string)=>void
}

export default function QuoteEditor({mode,quote,onCreate}:Props) {
  const [agency,       setAgency]      = useState<AgencyConfig|null>(null)
  const [items,        setItems]       = useState<QuoteItem[]>(quote?.items||[])
  const [clientName,   setClientName]  = useState(quote?.client?.name||'')
  const [clientPhone,  setClientPhone] = useState(quote?.client?.phone||'')
  const [remarks,      setRemarks]     = useState(quote?.remarks||'')
  const [status,       setStatus]      = useState(quote?.status||'draft')
  const [validityDays, setValidityDays]= useState(quote?.validity_days||7)
  const [documentType, setDocumentType]= useState<DocumentType>(quote?.document_type||'devis')
  const [quoteNumber,  setQuoteNumber] = useState(quote?.quote_number||'')
  const [modalOpen,    setModalOpen]   = useState(false)
  const [editItem,     setEditItem]    = useState<Partial<QuoteItem>|null>(null)
  const [saving,       setSaving]      = useState(false)
  const [saved,        setSaved]       = useState(false)
  const [shareOpen,    setShareOpen]   = useState(false)
  const [newError,     setNewError]    = useState('')
  const [voucherOpen, setVoucherOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates})
  )

  useEffect(()=>{
    supabase.from('agency_config').select('*').single()
      .then(({data})=>{ if(data) setAgency(data) })
  },[])

  const totals = calcQuoteTotals(items)
  const fmt    = (n:number)=>n.toLocaleString('fr-DZ',{minimumFractionDigits:0})

  const syncTotals = useCallback(async(newItems:QuoteItem[])=>{
    if(!quote?.id) return
    const t = calcQuoteTotals(newItems)
    await supabase.from('quotes').update({
      total_cost:t.total_cost,total_client:t.total_client,profit:t.profit,
      updated_at:new Date().toISOString(),
    }).eq('id',quote.id)
  },[quote?.id])

  async function handleAddItem(data: Partial<QuoteItem>) {
    if (!quote?.id) return
    const computed = { ...calcItemTotals(data), description: data.description || buildDescription(data) }
    const { data: saved } = await supabase.from('quote_items')
      .insert({ ...computed, quote_id: quote.id, sort_order: items.length }).select().single()
    if (saved) {
      const newItems = [...items, saved as QuoteItem]
      setItems(newItems); await syncTotals(newItems)
    }
  }

  async function handleEditItem(data: Partial<QuoteItem>) {
    if (!editItem?.id) return
    const computed = { ...calcItemTotals(data), description: data.description || buildDescription(data) }
    await supabase.from('quote_items').update(computed).eq('id', editItem.id)
    const newItems = items.map(i => i.id === editItem.id ? { ...i, ...computed } as QuoteItem : i)
    setItems(newItems); await syncTotals(newItems); setEditItem(null)
  }

  async function handleDuplicate(item:QuoteItem){
    if(!quote?.id) return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const{id,created_at,...rest}=item
    const{data}=await supabase.from('quote_items')
      .insert({...rest,quote_id:quote.id,sort_order:items.length}).select().single()
    if(data){const newItems=[...items,data as QuoteItem];setItems(newItems);await syncTotals(newItems)}
  }

  async function handleDelete(itemId:string){
    await supabase.from('quote_items').delete().eq('id',itemId)
    const newItems=items.filter(i=>i.id!==itemId);setItems(newItems);await syncTotals(newItems)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDragEnd(event:any){
    const{active,over}=event
    if(!over||active.id===over.id) return
    const oldIdx=items.findIndex(i=>i.id===active.id)
    const newIdx=items.findIndex(i=>i.id===over.id)
    const newItems=arrayMove(items,oldIdx,newIdx).map((item,idx)=>({...item,sort_order:idx}))
    setItems(newItems)
    await Promise.all(newItems.map(i=>supabase.from('quote_items').update({sort_order:i.sort_order}).eq('id',i.id)))
  }

  async function handleSave(){
    setSaving(true)
    if(quote?.id){
      await supabase.from('quotes').update({
        remarks,status,validity_days:validityDays,
        document_type:documentType,
        updated_at:new Date().toISOString()
      }).eq('id',quote.id)
      if (quote.client_id) {
        const name = clientName.trim() || 'N/A'
        await supabase.from('clients')
          .update({ name, phone: clientPhone.trim() || null })
          .eq('id', quote.client_id)
      } else if (clientName.trim() || clientPhone.trim()) {
        // Créer un client si le devis n'en a pas encore
        const { data: newClient } = await supabase
          .from('clients')
          .insert({ name: clientName.trim() || 'N/A', phone: clientPhone.trim() || null })
          .select().single()
        if (newClient) {
          await supabase.from('quotes').update({ client_id: newClient.id }).eq('id', quote.id)
        }
      }
    }
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500)
  }

  /* ── NEW MODE ── */
  if(mode==='new'){
    const canCreate=clientName.trim()||clientPhone.trim()
    return (
      <div style={{padding:'2rem',maxWidth:480,margin:'0 auto'}}>
        <Link href="/" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:'0.875rem',color:'var(--color-text-muted)',textDecoration:'none',marginBottom:'1.5rem'}}>← Retour</Link>
        <h1 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>Nouveau document</h1>
        <div style={{padding:'1.5rem',borderRadius:'1rem',...S}}>
          <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:'1rem'}}>
            <label style={{fontSize:'0.75rem',fontWeight:500,color:'var(--color-text-muted)'}}>Nom du client</label>
            <input type="text" value={clientName} onChange={e=>{setClientName(e.target.value);setNewError('')}} placeholder="Ahmed Benali" style={inp} autoFocus/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:'0.5rem'}}>
            <label style={{fontSize:'0.75rem',fontWeight:500,color:'var(--color-text-muted)'}}>Téléphone</label>
            <input type="tel" value={clientPhone} onChange={e=>{setClientPhone(e.target.value);setNewError('')}} placeholder="0555 123 456" style={inp}/>
          </div>
          <p style={{fontSize:'0.75rem',color:'var(--color-text-muted)',marginBottom:'1.25rem'}}>* Au moins le nom ou le téléphone est requis</p>
          {newError&&<p style={{fontSize:'0.8125rem',color:'var(--color-error)',marginBottom:'0.75rem'}}>{newError}</p>}
          <button onClick={()=>{
            if(!canCreate){setNewError('Veuillez saisir au moins le nom ou le téléphone.');return}
            onCreate?.(null,clientName,clientPhone)
          }} style={{width:'100%',padding:'0.75rem',borderRadius:'0.75rem',background:'var(--color-primary)',color:'white',border:'none',cursor:canCreate?'pointer':'not-allowed',fontWeight:600,fontSize:'0.9375rem',opacity:canCreate?1:0.5}}>
            Créer le document →
          </button>
        </div>
      </div>
    )
  }

  /* ── EDIT MODE ── */
  return (
    <div style={{padding:'1.5rem',maxWidth:1200,margin:'0 auto'}} className="animate-fadeIn">

      {/* Header */}
      <div className="qe-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <Link href="/" style={{padding:'0.5rem',borderRadius:'0.5rem',fontSize:'1.125rem',textDecoration:'none',color:'var(--color-text-muted)'}}>←</Link>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <h1 style={{fontSize:'1.25rem',fontWeight:700}}>{quoteNumber}</h1>
              <DocTypeBadge type={documentType} size="sm"/>
            </div>
            <p style={{fontSize:'0.75rem',color:'var(--color-text-muted)'}}>
              {clientName||clientPhone} · {new Date(quote?.issue_date||'').toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="qe-header-actions" style={{display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap'}}>
          <select value={documentType} onChange={e=>setDocumentType(e.target.value as DocumentType)}
            style={{padding:'0.375rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.875rem',outline:'none',cursor:'pointer',...S}}>
            <option value="devis">📄 Devis</option>
            <option value="proforma">📋 Facture Proforma</option>
            <option value="facture">🧾 Facture</option>
            <option value="bon_versement">💳 Bon de Versement</option>
          </select>
          <select value={status} onChange={e=>setStatus(e.target.value as typeof status)}
            style={{padding:'0.375rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.875rem',outline:'none',cursor:'pointer',...S}}>
            {STATUS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => setVoucherOpen(true)}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '0.5rem',
              fontSize: '0.875rem', cursor: 'pointer',
              background: '#78350f', color: 'white',
              border: 'none', fontWeight: 600,
            }}>
            🏨 Voucher
          </button>
          <button onClick={()=>setShareOpen(true)}
            style={{padding:'0.375rem 0.875rem',borderRadius:'0.5rem',fontSize:'0.875rem',cursor:'pointer',background:'#0f766e',color:'white',border:'none',fontWeight:600}}>
            📤 Partager
          </button>
          <button onClick={handleSave} disabled={saving} style={{padding:'0.375rem 0.875rem',borderRadius:'0.5rem',color:'white',fontWeight:600,fontSize:'0.875rem',border:'none',cursor:'pointer',background:saved?'var(--color-success)':'var(--color-primary)',opacity:saving?0.6:1}}>
            {saved?'✅ Sauvegardé !':saving?'⏳...':'💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="qe-layout" style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'1.5rem',alignItems:'start'}}>

        {/* Left */}
        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

          {/* Client */}
          <div style={{padding:'1.25rem',borderRadius:'1rem',...S}}>
            <h2 style={{fontSize:'0.875rem',fontWeight:600,marginBottom:'0.875rem'}}>👤 Client</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:'0.75rem',fontWeight:500,color:'var(--color-text-muted)'}}>Nom</label>
                <input type="text" value={clientName} onChange={e=>setClientName(e.target.value)} style={inp} placeholder="Ahmed Benali"/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:'0.75rem',fontWeight:500,color:'var(--color-text-muted)'}}>Téléphone</label>
                <input type="tel" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} style={inp} placeholder="0555 123 456"/>
              </div>
            </div>
          </div>

          {/* Prestations */}
          <div style={{padding:'1.25rem',borderRadius:'1rem',...S}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.875rem'}}>
              <h2 style={{fontSize:'0.875rem',fontWeight:600}}>🛎 Prestations ({items.length})</h2>
              <button onClick={()=>{setEditItem(null);setModalOpen(true)}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'0.375rem 0.875rem',borderRadius:'0.625rem',background:'var(--color-primary)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.8125rem'}}>
                ＋ Ajouter
              </button>
            </div>
            {items.length===0?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'3rem 1rem',gap:'0.75rem',color:'var(--color-text-muted)'}}>
                <span style={{fontSize:'2.5rem'}}>🛎</span>
                <p style={{fontWeight:500}}>Aucune prestation</p>
                <p style={{fontSize:'0.8125rem',textAlign:'center',maxWidth:280}}>Cliquez sur &quot;+ Ajouter&quot; pour commencer</p>
              </div>
            ):(
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                    {items.map((item,idx)=>(
                      <QuoteItemRow key={item.id} item={item} index={idx}
                        onEdit={i=>{setEditItem(i);setModalOpen(true)}}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}/>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Remarques */}
          <div style={{padding:'1.25rem',borderRadius:'1rem',...S}}>
            <h2 style={{fontSize:'0.875rem',fontWeight:600,marginBottom:'0.75rem'}}>📝 Remarques</h2>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}
              placeholder="Conditions particulières, notes pour le client..."
              style={{...inp,resize:'none'}}/>
          </div>
        </div>

        {/* Sidebar */}
        <div className="qe-sidebar" style={{display:'flex',flexDirection:'column',gap:'1.25rem',position:'sticky',top:'1.5rem'}}>

          {/* Bilan */}
          <div style={{padding:'1.25rem',borderRadius:'1rem',...S}}>
            <h2 style={{fontSize:'0.875rem',fontWeight:600,marginBottom:'1rem'}}>💰 Bilan financier</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {[
                {label:'Coût total (brut)',value:`${fmt(totals.total_cost)} DA`,muted:true},
                {label:'Total client',     value:`${fmt(totals.total_client)} DA`,muted:false},
              ].map(r=>(
                <div key={r.label} style={{display:'flex',justifyContent:'space-between',fontSize:'0.875rem'}}>
                  <span style={{color:'var(--color-text-muted)'}}>{r.label}</span>
                  <span style={{fontWeight:r.muted?500:700}}>{r.value}</span>
                </div>
              ))}
              <div style={{borderTop:'1px solid var(--color-border)',paddingTop:'0.75rem',display:'flex',justifyContent:'space-between',fontSize:'0.875rem'}}>
                <span style={{color:'var(--color-text-muted)'}}>Bénéfice net (auto)</span>
                <span style={{fontWeight:700,color:'var(--color-success)'}}>+{fmt(totals.profit)} DA</span>
              </div>
              {totals.total_cost>0&&(
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem'}}>
                  <span style={{color:'var(--color-text-muted)'}}>Marge globale</span>
                  <span style={{fontWeight:600}}>{((totals.profit/totals.total_cost)*100).toFixed(1)}%</span>
                </div>
              )}
            </div>

            <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--color-border)'}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:'0.75rem',fontWeight:500,color:'var(--color-text-muted)'}}>Validité (jours)</label>
                <input type="number" min={1} max={90} value={validityDays}
                  onChange={e=>setValidityDays(parseInt(e.target.value)||7)} style={inp}/>
              </div>
            </div>

            <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--color-border)'}}>
              {quote&&(
                <ManualProfitSection
                  quoteId={quote.id}
                  initialValue={quote.manual_profit??null}
                  enabled={quote.manual_profit_enabled??false}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ServiceModal
        open={modalOpen}
        onClose={()=>{setModalOpen(false);setEditItem(null)}}
        onSave={editItem?handleEditItem:handleAddItem}
        editItem={editItem}
      />

      {shareOpen&&quote&&agency&&(
        <ClientShareModal
          quote={{ ...quote, items, validity_days: validityDays,
            document_type: documentType, quote_number: quoteNumber,
            remarks: remarks,                    // ← AJOUTER CETTE LIGNE
            client: { id: quote.client_id || '', name: clientName, phone: clientPhone, created_at: '' } }}
          agency={agency}
          onClose={()=>setShareOpen(false)}
          onDocTypeChange={(t,num)=>{setDocumentType(t);setQuoteNumber(num)}}
        />
      )}
      {voucherOpen && quote && agency && (
        <VoucherModal
          quote={{
            ...quote,
            items,
            client: { id: quote.client_id||'', name: clientName, phone: clientPhone, created_at:'' },
          }}
          agency={agency}
          onClose={() => setVoucherOpen(false)}
        />
      )}
    </div>
  )
}
