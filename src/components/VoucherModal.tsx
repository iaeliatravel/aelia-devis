'use client'
import { useState, useEffect, useRef } from 'react'
import { Quote, AgencyConfig } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface Guest { name: string; type: 'Adult' | 'Child'; age?: number }
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
    saved?.hotelName ?? (hotelItem?.hotel_name ?? '')
  )
  const [hotelAddr, setHotelAddr] = useState(
    saved?.hotelAddress ?? [hotelItem?.hotel_city, hotelItem?.hotel_country].filter(Boolean).join(', ')
  )
  const [voucherNum, setVoucherNum] = useState(
    saved?.voucherNumber ?? (quote.quote_number.replace(/\D/g, '') || '100000')
  )
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (saved?.guests && saved.guests.length > 0) return saved.guests
    const adults   = hotelItem?.adults   || 1
    const children = hotelItem?.children || 0
    const list: Guest[] = []
    for (let i = 0; i < adults;   i++) list.push({ name: '', type: 'Adult' })
    for (let i = 0; i < children; i++) list.push({ name: '', type: 'Child', age: undefined })
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

  const dayBefore = checkin ? new Date(checkin.getTime() - 86400000) : null
  const cancelLines = checkin ? [
    [`From ${fmtISO(dayBefore!)} 14:05:00 :`, '1 night(s)'],
    [`From ${fmtISO(checkin)} 00:06:00 :`, '1 night(s)'],
    [`From ${fmtISO(checkin)} 00:06:00 :`, '100% of the invoice amount'],
  ] : []

  const roomType   = hotelItem?.room_type  || '—'
  const boardLabel = BOARD_LABELS[hotelItem?.board_type||''] || hotelItem?.board_type || '—'
  const refNum     = `HTBD${voucherNum}`
  const clientName = quote.client?.name    || ''
  const clientPhone= quote.client?.phone   || ''
  const clientAddr = quote.client?.address || ''
  const agName     = agency.name || 'Aelia Travel Agency'
  const agAddr     = [agency.address, agency.city].filter(Boolean).join(' ')
  const agEmail    = agency.email || ''

  const esc = (s?: string|null) =>
    String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  function updateGuest(i:number, field:keyof Guest, val:string){
    setGuests(g=>g.map((x,j)=>{
      if(j!==i) return x
      if(field==='age') return { ...x, age: val ? parseInt(val) : undefined }
      return { ...x, [field]: val }
    }))
  }
  function addGuest(type:'Adult'|'Child'){setGuests(g=>[...g,{name:'',type}])}
  function removeGuest(i:number){setGuests(g=>g.filter((_,j)=>j!==i))}

  function guestTypeLabel(g: Guest): string {
    if (g.type === 'Child' && g.age) return `Child ${g.age} years`
    return g.type
  }

  function buildHTML(): string {
    const guestRows = guests.map((g,i)=>`
      <tr>
        ${i===0?`<td rowspan="${guests.length}" style="padding:14px 18px;vertical-align:top;width:34%">
          <div style="font-weight:700;font-size:14px;color:#111827">${esc(roomType)}</div>
          <div style="font-size:13px;color:#374151;margin-top:1px">${esc(boardLabel)}</div>
        </td>`:''}
        <td style="padding:${i===0?'14px':'4px'} 14px ${i===guests.length-1?'14px':'4px'} 0;font-size:13px;color:#1f2937">${esc(g.name)||'&nbsp;'}</td>
        <td style="padding:${i===0?'14px':'4px'} 18px ${i===guests.length-1?'14px':'4px'} 0;font-size:13px;color:#374151;text-align:right;white-space:nowrap">${esc(guestTypeLabel(g))}</td>
      </tr>`).join('')

    const cancelItems = cancelLines.map(([l,v])=>
      `<li style="margin-bottom:4px">${esc(l)} <span style="color:#ef4444">${esc(v)}</span></li>`
    ).join('')

    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><title>Voucher ${esc(voucherNum)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:18mm 20mm}
@media print{html,body{background:#fff!important;width:100%!important}}
body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:13px;line-height:1.4;width:100%}
.page{display:flex;flex-direction:column;min-height:250mm}
.card{background:#eef1f6;border-radius:10px}
.gray{color:#9aa3af}
.bold{font-weight:700;color:#111827}
</style></head><body>
<div class="page">

  <!-- TOP: Voucher title + Reference block -->
  <table style="width:100%;margin-bottom:18px">
    <tr>
      <td style="vertical-align:top">
        <div style="font-size:27px;font-weight:800;color:#111827">Voucher ${esc(voucherNum)}</div>
      </td>
      <td style="text-align:right;vertical-align:top;width:230px">
        <div class="gray" style="font-size:13px">Reference</div>
        <div class="bold" style="font-size:13.5px;margin-top:1px;margin-bottom:9px">${esc(refNum)}</div>
        <div class="gray" style="font-size:13px">Issued on</div>
        <div style="font-size:13px;color:#1f2937;margin-top:1px;margin-bottom:9px">${fmtFull(today)}</div>
        <div class="gray" style="font-size:13px">Stay</div>
        <div style="font-size:13px;color:#1f2937;margin-top:1px;margin-bottom:10px">${esc(stayStr)}</div>
        <div style="font-size:21px;font-weight:800;color:#ea580c">PENDING</div>
      </td>
    </tr>
  </table>

  <!-- ISSUED BY -->
  <div class="gray" style="font-size:13px;margin-bottom:8px">Issued by:</div>
  <div class="card" style="padding:14px 16px;margin-bottom:22px">
    <table>
      <tr>
        <td style="width:60px;vertical-align:middle;padding-right:14px">
          <div style="width:48px;height:48px;background:#f7941d;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:800;color:#fff;text-align:center;line-height:1.3;letter-spacing:0.3px">TRAVEL<br/>AGENCY</div>
        </td>
        <td style="vertical-align:middle">
          <div class="bold" style="font-size:14.5px">${esc(agName)}</div>
          ${agAddr  ? `<div style="font-size:12.5px;color:#374151;margin-top:2px">Address: ${esc(agAddr)}</div>` : ''}
          ${agEmail ? `<div style="font-size:12.5px;color:#374151">Email: ${esc(agEmail)}</div>` : ''}
        </td>
      </tr>
    </table>
  </div>

  <!-- HOTEL + HOLDER -->
  <table style="width:100%;margin-bottom:22px">
    <tr style="vertical-align:top">
      <td style="width:50%">
        <div class="bold" style="font-size:14.5px;margin-bottom:3px">${esc(hotelName)||'&nbsp;'}</div>
        ${hotelAddr ? `<div style="font-size:12.5px;color:#374151">Address: ${esc(hotelAddr)}</div>` : ''}
      </td>
      <td style="width:50%">
        <div class="bold" style="font-size:14.5px;margin-bottom:3px">Holder :</div>
        <div class="bold" style="font-size:13.5px">${esc(clientName)||'&nbsp;'}</div>
        ${clientAddr  ? `<div style="font-size:12.5px;color:#374151;margin-top:2px">Address: ${esc(clientAddr)}</div>` : ''}
        ${clientPhone ? `<div style="font-size:12.5px;color:#374151;margin-top:2px">Phone: ${esc(clientPhone)}</div>` : ''}
        ${agEmail     ? `<div style="font-size:12.5px;color:#374151;margin-top:2px">Email: ${esc(agEmail)}</div>` : ''}
      </td>
    </tr>
  </table>

  <!-- CHAMBRE + VOYAGEURS -->
  <div class="card" style="margin-bottom:18px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">${guestRows}</table>
  </div>

  <!-- CANCELLATION POLICY -->
  <div class="card" style="padding:14px 18px;margin-bottom:0">
    <div class="bold" style="font-size:13.5px;margin-bottom:8px">Cancellation Policy</div>
    <ul style="padding-left:18px;font-size:12.5px;color:#374151;list-style-type:disc">${cancelItems}</ul>
    <div style="font-size:11.5px;color:#9aa3af;font-style:italic;text-align:center;margin-top:10px">
      The date and time conform to the local time zone
    </div>
  </div>

  <!-- SPACER pousse le footer en bas de page -->
  <div style="flex:1"></div>

  <!-- FOOTER — Flynbeds.com -->
  <div>
    <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:3px">Flynbeds.com</div>
    <div style="font-size:12px;color:#374151;line-height:1.55">
      Address : 09 Boulevard Zighou<br/>
      D Yousef Constantine Algeria 25000<br/>
      Email : Info@Flynbeds.dz<br/>
      Helpdesk : Https://Support.flynbeds.net/<br/>
      Phone : +213 (0) 671 31 09 27<br/>
      Phone : +213 (0) 671 32 09 27<br/>
      Phone : +213 (0) 560 00 15 47
    </div>
  </div>

  <div style="text-align:center;margin-top:26px">
    <div style="font-size:21px;font-weight:800">
      <span style="color:#1e293b">flynbeds</span><span style="color:#ec4899">.com</span>
    </div>
    <div style="font-size:10px;color:#9aa3af;font-style:italic;margin-top:1px">One click and the world is yours</div>
  </div>

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
            📌 Modèle identique au voucher Flynbeds. Le champ Email du titulaire reprend automatiquement celui de l&apos;agence (comportement Flynbeds standard). Sauvegarde automatique.
          </div>

          {!clientAddr && (
            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'0.625rem',padding:'0.625rem 0.875rem',fontSize:'0.75rem',color:'#1e40af'}}>
              ℹ️ Aucune adresse client enregistrée — ajoutez-la dans la fiche client pour qu&apos;elle apparaisse sous &quot;Holder&quot;.
            </div>
          )}

          <div>
            <label style={lbl}>N° de voucher</label>
            <input value={voucherNum} onChange={e=>setVoucherNum(e.target.value.replace(/\D/g,''))} style={inp} placeholder="92043"/>
          </div>

          <div>
            <label style={lbl}>🏨 Nom de l'hôtel</label>
            <input value={hotelName} onChange={e=>setHotelName(e.target.value)} style={inp} placeholder="Ex: El Mouradi Club Selima"/>
          </div>
          <div>
            <label style={lbl}>📍 Adresse de l'hôtel</label>
            <input value={hotelAddr} onChange={e=>setHotelAddr(e.target.value)} style={inp} placeholder="Ex: Zone Touristique Port El Kantaoui, Sousse"/>
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
                  {g.type==='Child'&&(
                    <input type="number" min={0} max={17} value={g.age??''} onChange={e=>updateGuest(i,'age',e.target.value)}
                      placeholder="Âge" style={{...inp,width:56,flexShrink:0,textAlign:'center'}}/>
                  )}
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
