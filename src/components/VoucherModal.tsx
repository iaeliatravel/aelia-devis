'use client'
import { useState, useEffect, useRef } from 'react'
import { Quote, AgencyConfig } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface Guest { name: string; type: 'Adult' | 'Child' }
interface Props { quote: Quote; agency: AgencyConfig; onClose: () => void }

const BOARD_LABELS: Record<string, string> = {
  room_only:'Room Only', breakfast:'Bed & Breakfast',
  half_board:'Half Board', half_board_plus:'Half Board Plus',
  full_board:'Full Board', all_inclusive:'All Inclusive',
}

export default function VoucherModal({ quote, agency, onClose }: Props) {
  const hotelItem = (quote.items || []).find(i => i.service_type === 'hotel')
  const saved = quote.voucher_data || null

  const [hotelName, setHotelName] = useState(
    saved?.hotelName ?? hotelItem?.hotel_name ?? ''
  )
  const [hotelAddr, setHotelAddr] = useState(
    saved?.hotelAddress ?? [hotelItem?.hotel_city, hotelItem?.hotel_country].filter(Boolean).join(', ')
  )
  const [voucherNum, setVoucherNum] = useState(
    saved?.voucherNumber ?? (quote.quote_number.replace(/\D/g, '').padStart(6, '4') || '400000')
  )
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (saved?.guests && saved.guests.length > 0) return saved.guests
    const adults   = hotelItem?.adults   || 1
    const children = hotelItem?.children || 0
    const list: Guest[] = []
    for (let i = 0; i < adults;   i++) list.push({ name: '', type: 'Adult' })
    for (let i = 0; i < children; i++) list.push({ name: '', type: 'Child' })
    return list
  })
  const [generating, setGenerating] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  /* ── Persistance auto (debounce 700ms) ── */
  useEffect(() => {
    if (!quote.id) return
    setSaveStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('quotes').update({
        voucher_data: { voucherNumber: voucherNum, hotelName, hotelAddress: hotelAddr, guests },
        updated_at: new Date().toISOString(),
      }).eq('id', quote.id)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    }, 700)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelName, hotelAddr, voucherNum, JSON.stringify(guests)])

  const today  = new Date()
  const pad    = (n: number) => String(n).padStart(2, '0')
  const MS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const fmtShort = (d: Date) => `${pad(d.getDate())} ${MS[d.getMonth()]} ${d.getFullYear()}`
  const fmtFull  = (d: Date) => {
    let h = d.getHours(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
    return `${fmtShort(d)} ${h}:${pad(d.getMinutes())} ${ampm}`
  }
  const fmtISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  const checkin  = hotelItem?.checkin_date  ? new Date(hotelItem.checkin_date)  : null
  const checkout = hotelItem?.checkout_date ? new Date(hotelItem.checkout_date) : null
  const nights   = hotelItem?.nights ||
    (checkin && checkout ? Math.round((checkout.getTime()-checkin.getTime())/86400000) : 0)
  const stayStr  = checkin && checkout
    ? `${fmtShort(checkin)} to ${fmtShort(checkout)} (${nights} night${nights!==1?'s':''})`
    : '—'

  /* ── Politique d'annulation (basée sur la date d'arrivée, format identique au modèle) ── */
  const dayBefore = checkin ? new Date(checkin.getTime() - 86400000) : null
  const cancelLines = checkin ? [
    `From ${fmtISO(dayBefore!)} 14:05:00 : 1 night(s)`,
    `From ${fmtISO(checkin)} 00:06:00 : 1 night(s)`,
    `From ${fmtISO(checkin)} 00:06:00 : 100% of the invoice amount`,
  ] : []

  const roomType   = hotelItem?.room_type  || '—'
  const boardLabel = BOARD_LABELS[hotelItem?.board_type||''] || hotelItem?.board_type || '—'
  const refNum     = `HTBD${voucherNum}`
  const clientName = quote.client?.name  || ''
  const clientPhone= quote.client?.phone || ''
  const agName     = agency.name || 'Aelia Travel Agency'
  const agAddr     = [agency.address, agency.city].filter(Boolean).join(' ')
  const agEmail    = agency.email || ''

  const esc = (s?: string|null) =>
    String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  function updateGuest(i:number, field:keyof Guest, val:string){
    setGuests(g=>g.map((x,j)=>j===i?{...x,[field]:val}:x))
  }
  function addGuest(type:'Adult'|'Child'){setGuests(g=>[...g,{name:'',type}])}
  function removeGuest(i:number){setGuests(g=>g.filter((_,j)=>j!==i))}

  function buildHTML(): string {
    const guestRows = guests.map((g,i)=>`
      <tr>
        ${i===0?`<td rowspan="${guests.length}" style="padding:14px 16px;vertical-align:top;width:38%;border-right:1px solid #e2e8f0">
          <div style="font-weight:700;font-size:14px;color:#1a2b3c">${esc(roomType)}</div>
          <div style="font-size:13px;color:#64748b;margin-top:2px">${esc(boardLabel)}</div>
        </td>`:''}
        <td style="padding:9px 16px;font-size:13px;color:#1e293b">${esc(g.name)||'&nbsp;'}</td>
        <td style="padding:9px 16px;font-size:13px;color:#64748b;text-align:right">${g.type}</td>
      </tr>`).join('')

    const cancelItems = cancelLines.map(l=>{
      const parts = l.split(' : ')
      return `<li style="margin-bottom:3px">${esc(parts[0])} : <span style="color:#ef4444;font-weight:600">${esc(parts[1])}</span></li>`
    }).join('')

    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><title>Voucher ${esc(voucherNum)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:16mm 18mm}
@media print{html,body{background:#fff!important;width:100%!important}}
body{font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;color:#1e293b;font-size:13px;line-height:1.45;width:100%}
.card{background:#f4f7fa;border-radius:10px}
.label{font-size:11px;color:#94a3b8;margin-bottom:2px}
.bold{font-weight:700;color:#0f172a}
</style></head><body>

<!-- ═══ TOP ROW: Voucher # + Reference block ═══ -->
<table style="width:100%;margin-bottom:18px">
  <tr>
    <td style="vertical-align:top">
      <div style="font-size:26px;font-weight:800;color:#0f172a">Voucher ${esc(voucherNum)}</div>
    </td>
    <td style="text-align:right;vertical-align:top;min-width:220px">
      <div class="label">Reference</div>
      <div class="bold" style="font-size:14px;margin-bottom:10px">${esc(refNum)}</div>
      <div class="label">Issued on</div>
      <div style="font-size:13px;color:#334155;margin-bottom:10px">${fmtFull(today)}</div>
      <div class="label">Stay</div>
      <div style="font-size:13px;color:#334155;margin-bottom:12px">${esc(stayStr)}</div>
      <div style="font-size:24px;font-weight:800;color:#ea580c;letter-spacing:0.5px">PENDING</div>
    </td>
  </tr>
</table>

<!-- ═══ ISSUED BY ═══ -->
<div class="label" style="margin-bottom:8px">Issued by:</div>
<div class="card" style="padding:14px 16px;margin-bottom:20px">
  <table>
    <tr>
      <td style="width:54px;vertical-align:middle;padding-right:14px">
        <div style="width:46px;height:46px;background:#f97316;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;text-align:center;line-height:1.25">TRAVEL<br>AGENCY</div>
      </td>
      <td style="vertical-align:middle">
        <div class="bold" style="font-size:15px">${esc(agName)}</div>
        ${agAddr  ? `<div style="font-size:12px;color:#64748b;margin-top:2px">Address: ${esc(agAddr)}</div>` : ''}
        ${agEmail ? `<div style="font-size:12px;color:#64748b">Email: ${esc(agEmail)}</div>` : ''}
      </td>
    </tr>
  </table>
</div>

<!-- ═══ HOTEL + HOLDER ═══ -->
<table style="width:100%;margin-bottom:20px">
  <tr style="vertical-align:top">
    <td style="width:50%;padding-right:24px">
      <div class="bold" style="font-size:15px;margin-bottom:4px">${esc(hotelName)||'—'}</div>
      ${hotelAddr ? `<div style="font-size:12.5px;color:#64748b">Address: ${esc(hotelAddr)}</div>` : ''}
    </td>
    <td style="width:50%;padding-left:24px;border-left:1px solid #e2e8f0">
      <div class="label" style="margin-bottom:4px">Holder :</div>
      <div class="bold" style="font-size:14px">${esc(clientName)||'—'}</div>
      ${clientPhone ? `<div style="font-size:12.5px;color:#64748b;margin-top:2px">Phone: ${esc(clientPhone)}</div>` : ''}
    </td>
  </tr>
</table>

<!-- ═══ CHAMBRE + VOYAGEURS ═══ -->
<div class="card" style="margin-bottom:20px;overflow:hidden">
  <table style="width:100%;border-collapse:collapse">${guestRows}</table>
</div>

<!-- ═══ CANCELLATION POLICY ═══ -->
<div class="card" style="padding:14px 16px;margin-bottom:30px">
  <div class="bold" style="font-size:13px;margin-bottom:8px">Cancellation Policy</div>
  <ul style="padding-left:18px;font-size:12.5px;color:#334155">${cancelItems}</ul>
  <div style="font-size:11px;color:#94a3b8;font-style:italic;margin-top:8px">
    The date and time conform to the local time zone
  </div>
</div>

<div style="height:60px"></div>

<!-- ═══ FOOTER — Flynbeds.com ═══ -->
<div style="border-top:1px solid #e2e8f0;padding-top:16px">
  <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">Flynbeds.com</div>
  <div style="font-size:11.5px;color:#64748b;line-height:1.6">
    Address : 09 Boulevard Zighou<br/>
    D Yousef Constantine Algeria 25000<br/>
    Email : Info@Flynbeds.dz<br/>
    Helpdesk : Https://Support.flynbeds.net/<br/>
    Phone : +213 (0) 671 31 09 27<br/>
    Phone : +213 (0) 671 32 09 27<br/>
    Phone : +213 (0) 560 00 15 47
  </div>
</div>

<div style="text-align:center;margin-top:36px">
  <div style="font-size:22px;font-weight:800">
    <span style="color:#0f172a">flynbeds</span><span style="color:#ec4899">.com</span>
  </div>
  <div style="font-size:10.5px;color:#94a3b8;font-style:italic;margin-top:2px">One click and the world is yours</div>
</div>

</body></html>`
  }

  async function generate() {
    setGenerating(true)
    const win = window.open('','_blank','width=900,height=800')
    if(!win){alert('Autorisez les popups.');setGenerating(false);return}
    win.document.write(buildHTML())
    win.document.close()
    await new Promise(r=>setTimeout(r,1200))
    win.print()
    setGenerating(false)
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'0.4rem 0.625rem', borderRadius:'0.5rem',
    border:'1px solid #e5e7eb', fontSize:'0.8125rem', outline:'none',
    fontFamily:'inherit', color:'#111827', background:'#fff',
  }
  const lbl: React.CSSProperties = {
    display:'block', fontSize:'0.75rem', fontWeight:500,
    color:'#6b7280', marginBottom:'0.25rem',
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.75rem'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.55)'}} onClick={onClose}/>
      <div style={{position:'relative',width:'100%',maxWidth:500,maxHeight:'92vh',overflowY:'auto',borderRadius:'1.25rem',background:'#fff',border:'1px solid #e5e7eb',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',color:'#111827',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>

        <div style={{position:'sticky',top:0,zIndex:2,padding:'1rem 1.25rem',borderBottom:'1px solid #e5e7eb',background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{fontWeight:700,fontSize:'0.9375rem'}}>🏨 Voucher Provisoire</h2>
            <p style={{fontSize:'0.75rem',color:'#6b7280',marginTop:2}}>{quote.quote_number} · {clientName||clientPhone}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {saveStatus!=='idle'&&(
              <span style={{fontSize:'0.6875rem',color:saveStatus==='saved'?'#059669':'#9ca3af'}}>
                {saveStatus==='saving'?'⏳ Sauvegarde...':'✅ Sauvegardé'}
              </span>
            )}
            <button onClick={onClose} style={{padding:'0.25rem 0.5rem',borderRadius:'0.375rem',border:'1px solid #e5e7eb',background:'#f3f4f6',cursor:'pointer',fontSize:'1rem',color:'#374151'}}>✕</button>
          </div>
        </div>

        <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'1rem'}}>

          <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'0.625rem',padding:'0.625rem 0.875rem',fontSize:'0.75rem',color:'#92400e'}}>
            📌 Modèle identique au voucher Flynbeds — seules les infos hôtel et clients changent. Sauvegarde automatique.
          </div>

          <div>
            <label style={lbl}>N° de voucher</label>
            <input value={voucherNum} onChange={e=>setVoucherNum(e.target.value.replace(/\D/g,''))} style={inp} placeholder="426888"/>
          </div>

          <div>
            <label style={lbl}>🏨 Nom de l'hôtel</label>
            <input value={hotelName} onChange={e=>setHotelName(e.target.value)} style={inp} placeholder="Ex: Nesrine"/>
          </div>
          <div>
            <label style={lbl}>📍 Adresse de l'hôtel</label>
            <input value={hotelAddr} onChange={e=>setHotelAddr(e.target.value)} style={inp} placeholder="Ex: Avenue De La Paix, Hammamet, Tunisie"/>
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
              <label style={{...lbl,marginBottom:0}}>👥 Voyageurs ({guests.length})</label>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>addGuest('Adult')} style={{padding:'0.25rem 0.625rem',borderRadius:'0.375rem',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,background:'#dbeafe',color:'#1d4ed8',border:'none',fontFamily:'inherit'}}>+ Adulte</button>
                <button onClick={()=>addGuest('Child')} style={{padding:'0.25rem 0.625rem',borderRadius:'0.375rem',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,background:'#fef3c7',color:'#92400e',border:'none',fontFamily:'inherit'}}>+ Enfant</button>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
              {guests.map((g,i)=>(
                <div key={i} style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                  <span style={{fontSize:'0.75rem',fontWeight:600,minWidth:52,flexShrink:0,color:g.type==='Adult'?'#1d4ed8':'#92400e'}}>
                    {g.type==='Adult'?'👤':'🧒'} {g.type==='Adult'?'ADT':'CHD'}
                  </span>
                  <input value={g.name} onChange={e=>updateGuest(i,'name',e.target.value)} placeholder="Prénom NOM" style={{...inp,flex:1}}/>
                  <select value={g.type} onChange={e=>updateGuest(i,'type',e.target.value as 'Adult'|'Child')} style={{...inp,width:'auto',flexShrink:0,cursor:'pointer'}}>
                    <option value="Adult">Adult</option>
                    <option value="Child">Child</option>
                  </select>
                  {guests.length>1&&<button onClick={()=>removeGuest(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'1rem',padding:'0.25rem',flexShrink:0}}>✕</button>}
                </div>
              ))}
            </div>
          </div>

          <div style={{background:'#f9fafb',borderRadius:'0.75rem',padding:'0.75rem 1rem',border:'1px solid #e5e7eb',fontSize:'0.8125rem',color:'#374151'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Séjour</span><span style={{fontVariantNumeric:'tabular-nums'}}>{stayStr}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Chambre</span><span>{roomType} · {boardLabel}</span></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>Statut</span><span style={{fontWeight:700,color:'#ea580c'}}>PENDING</span></div>
          </div>

          <button onClick={generate} disabled={generating} style={{width:'100%',padding:'0.875rem',borderRadius:'0.75rem',background:generating?'#6b7280':'#0f2c5c',color:'#fff',border:'none',cursor:generating?'wait':'pointer',fontWeight:700,fontSize:'0.9375rem',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {generating?'⏳ Génération...':'🖨️ Générer le Voucher PDF'}
          </button>
          <p style={{fontSize:'0.75rem',color:'#9ca3af',textAlign:'center'}}>Impression → &quot;Enregistrer en PDF&quot;</p>
        </div>
      </div>
    </div>
  )
}
