'use client'
import { useState } from 'react'
import { Quote, AgencyConfig } from '@/types/database'

interface Guest { name: string; type: 'Adult' | 'Child' }

interface Props {
  quote: Quote
  agency: AgencyConfig
  onClose: () => void
}

const BOARD_LABELS: Record<string, string> = {
  room_only:       'Room Only',
  breakfast:       'Bed & Breakfast',
  half_board:      'Half Board',
  half_board_plus: 'Half Board Plus',
  full_board:      'Full Board',
  all_inclusive:   'All Inclusive',
}

export default function VoucherModal({ quote, agency, onClose }: Props) {
  /* ── Trouver la première prestation hôtel ── */
  const hotelItem = (quote.items || []).find(i => i.service_type === 'hotel')

  const [guests,     setGuests]     = useState<Guest[]>(() => {
    const adults   = hotelItem?.adults   || 1
    const children = hotelItem?.children || 0
    const list: Guest[] = []
    for (let i = 0; i < adults;   i++) list.push({ name: '', type: 'Adult' })
    for (let i = 0; i < children; i++) list.push({ name: '', type: 'Child' })
    return list
  })
  const [generating, setGenerating] = useState(false)
  const [refNum,     setRefNum]     = useState(quote.quote_number.replace('/', '-'))

  const today = new Date()
  const fmt   = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')
  const fmtL  = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' PM'

  const checkin  = hotelItem?.checkin_date  ? new Date(hotelItem.checkin_date)  : null
  const checkout = hotelItem?.checkout_date ? new Date(hotelItem.checkout_date) : null
  const nights   = hotelItem?.nights ||
    (checkin && checkout ? Math.round((checkout.getTime() - checkin.getTime()) / 86400000) : 0)

  const stayStr = checkin && checkout
    ? `${fmt(checkin)} to ${fmt(checkout)} (${nights} night${nights !== 1 ? 's' : ''})`
    : '—'

  const hotelName  = hotelItem?.hotel_name || '—'
  const roomType   = hotelItem?.room_type  || '—'
  const boardLabel = BOARD_LABELS[hotelItem?.board_type || ''] || hotelItem?.board_type || '—'

  const clientName  = quote.client?.name  || ''
  const clientPhone = quote.client?.phone || ''

  const logoUrl  = agency.logo_url || ''
  const agName   = agency.name    || 'AELIA TRAVEL AGENCY'
  const agAddr   = [agency.address, agency.city].filter(Boolean).join(', ')
  const agEmail  = agency.email   || ''
  const agPhone  = agency.phone   || ''

  function updateGuest(i: number, field: keyof Guest, val: string) {
    setGuests(g => g.map((x, j) => j === i ? { ...x, [field]: val } : x))
  }
  function addGuest(type: 'Adult' | 'Child') {
    setGuests(g => [...g, { name: '', type }])
  }
  function removeGuest(i: number) {
    setGuests(g => g.filter((_, j) => j !== i))
  }

  /* ── HTML du voucher ── */
  function buildVoucherHTML(): string {
    const esc = (s?: string | null) =>
      String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const guestRows = guests.map(g => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333">${esc(g.name) || '<span style="color:#bbb">—</span>'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:right">${g.type}</td>
      </tr>`).join('')

    const logoBlock = logoUrl
      ? `<img src="${logoUrl}" crossorigin="anonymous" alt="Logo"
          style="width:56px;height:56px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;border:1px solid #e5e7eb"/>`
      : `<div style="width:56px;height:56px;background:#f97316;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:1.2;padding:4px">TRAVEL<br>AGENCY</div>`

    const logoBottomBlock = logoUrl
      ? `<img src="${logoUrl}" crossorigin="anonymous" alt="Logo"
          style="width:48px;height:48px;object-fit:contain;border-radius:6px;margin-bottom:12px;display:block"/>`
      : ''

    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>Voucher ${esc(refNum)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:15mm 18mm}
@media print{html,body{background:#fff!important;width:100%!important}}
body{font-family:Arial,"Helvetica Neue",sans-serif;color:#333;background:#fff;font-size:13px;width:100%}
.card{border:1.5px solid #e0e0e0;border-radius:8px;overflow:hidden;margin-bottom:20px}
.card-header{background:#f7f7f7;padding:10px 16px;font-size:14px;font-weight:700;color:#222;border-bottom:1px solid #e0e0e0}
.card-body{padding:14px 16px}
table{width:100%;border-collapse:collapse}
td,th{vertical-align:top}
.confirmed{font-size:28px;font-weight:800;color:#16a34a;letter-spacing:1px}
.label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
.value{font-size:13px;color:#222;font-weight:600}
.divider{border:none;border-top:1.5px solid #e0e0e0;margin:16px 0}
</style></head><body>

<!-- TOP HEADER -->
<table style="margin-bottom:18px">
  <tr>
    <td style="vertical-align:middle">
      <div style="font-size:22px;font-weight:800;color:#111">Voucher ${esc(refNum)}</div>
    </td>
    <td style="text-align:right;vertical-align:top">
      <div class="label">Reference</div>
      <div style="font-size:14px;font-weight:800;color:#111">HTBD${esc(refNum)}</div>
      <div class="label" style="margin-top:6px">Issued on</div>
      <div class="value">${fmtL(today)}</div>
      <div class="label" style="margin-top:6px">Stay</div>
      <div class="value">${esc(stayStr)}</div>
      <div style="margin-top:8px">
        <span class="confirmed">PROVISOIRE</span>
      </div>
    </td>
  </tr>
</table>

<!-- AGENCY ROW -->
<div class="card" style="margin-bottom:18px">
  <div class="card-body">
    <table>
      <tr>
        <td style="padding-right:14px;vertical-align:middle;width:70px">${logoBlock}</td>
        <td style="vertical-align:middle">
          <div style="font-size:15px;font-weight:800;color:#111">${esc(agName)}</div>
          ${agAddr  ? `<div style="font-size:12px;color:#555;margin-top:3px">Address: ${esc(agAddr)}</div>` : ''}
          ${agEmail ? `<div style="font-size:12px;color:#555">Email: ${esc(agEmail)}</div>` : ''}
          ${agPhone ? `<div style="font-size:12px;color:#555">Phone: ${esc(agPhone)}</div>` : ''}
        </td>
      </tr>
    </table>
  </div>
</div>

<!-- CLIENT + HOLDER -->
<table style="margin-bottom:18px;width:100%">
  <tr>
    <td style="width:50%;padding-right:12px;vertical-align:top">
      <div class="card">
        <div class="card-header">${esc(hotelName)}</div>
        <div class="card-body">
          ${agAddr ? `<div style="font-size:12px;color:#666;margin-bottom:6px">Address: ${esc(agAddr)}</div>` : ''}
        </div>
      </div>
    </td>
    <td style="width:50%;padding-left:12px;vertical-align:top">
      <div class="card">
        <div class="card-header">Holder :</div>
        <div class="card-body">
          <div style="font-size:14px;font-weight:800;color:#111;margin-bottom:4px">${esc(clientName || 'CLIENT')}</div>
          ${clientPhone ? `<div style="font-size:12px;color:#555">Phone: ${esc(clientPhone)}</div>` : ''}
        </div>
      </div>
    </td>
  </tr>
</table>

<!-- ROOM + GUESTS -->
<div class="card" style="margin-bottom:18px">
  <table>
    <thead>
      <tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f7f7f7">
        <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:700;border-bottom:1px solid #e0e0e0;color:#111">${esc(roomType)}<br><span style="font-size:12px;font-weight:400;color:#555">${esc(boardLabel)}</span></th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;font-weight:700;border-bottom:1px solid #e0e0e0;color:#111">Guest</th>
      </tr>
    </thead>
    <tbody>${guestRows || '<tr><td colspan="2" style="padding:10px 12px;color:#bbb;font-style:italic">No guests listed</td></tr>'}</tbody>
  </table>
</div>

<!-- FOOTER SPACER -->
<div style="height:40px"></div>

<!-- BOTTOM AGENCY INFO -->
<hr style="border:none;border-top:1.5px solid #e0e0e0;margin-bottom:16px"/>
<div style="text-align:center;padding:0 20px">
  ${logoBottomBlock}
  <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px">${esc(agName)}</div>
  ${agAddr  ? `<div style="font-size:11px;color:#555">Address: ${esc(agAddr)}</div>` : ''}
  ${agEmail ? `<div style="font-size:11px;color:#555">Email: ${esc(agEmail)}</div>` : ''}
  ${agPhone ? `<div style="font-size:11px;color:#555">Phone: ${esc(agPhone)}</div>` : ''}
</div>

</body></html>`
  }

  async function generate() {
    setGenerating(true)
    const win = window.open('', '_blank', 'width=900,height=800')
    if (!win) { alert('Autorisez les popups pour ce site.'); setGenerating(false); return }
    win.document.write(buildVoucherHTML())
    win.document.close()
    await new Promise(r => setTimeout(r, 1200))
    win.print()
    setGenerating(false)
  }

  const inpSt: React.CSSProperties = {
    width: '100%', padding: '0.4rem 0.625rem', borderRadius: '0.5rem',
    border: '1px solid #e5e7eb', fontSize: '0.8125rem', outline: 'none',
    fontFamily: 'inherit', color: '#111827', background: '#fff',
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex',
      alignItems:'center', justifyContent:'center', padding:'0.75rem' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} onClick={onClose}/>
      <div style={{ position:'relative', width:'100%', maxWidth:520,
        maxHeight:'92vh', overflowY:'auto', borderRadius:'1.25rem',
        background:'#fff', border:'1px solid #e5e7eb',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)', color:'#111827',
        fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, zIndex:2, padding:'1rem 1.25rem',
          borderBottom:'1px solid #e5e7eb', background:'#fff',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontWeight:700, fontSize:'0.9375rem' }}>🏨 Voucher Provisoire</h2>
            <p style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:2 }}>
              {quote.quote_number} · {clientName || clientPhone}
            </p>
          </div>
          <button onClick={onClose} style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
            border:'1px solid #e5e7eb', background:'#f3f4f6', cursor:'pointer',
            fontSize:'1rem', color:'#374151' }}>✕</button>
        </div>

        <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Résumé hôtel */}
          {hotelItem ? (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0',
              borderRadius:'0.75rem', padding:'0.875rem 1rem', fontSize:'0.875rem' }}>
              <div style={{ fontWeight:700, color:'#065f46', marginBottom:4 }}>🏨 {hotelName}</div>
              <div style={{ color:'#374151' }}>
                {roomType} · {boardLabel}
              </div>
              <div style={{ color:'#6b7280', marginTop:4, fontVariantNumeric:'tabular-nums' }}>
                📅 {stayStr}
              </div>
            </div>
          ) : (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a',
              borderRadius:'0.75rem', padding:'0.875rem 1rem', fontSize:'0.875rem', color:'#92400e' }}>
              ⚠️ Aucune prestation hôtel dans ce document. Le voucher sera généré avec les informations disponibles.
            </div>
          )}

          {/* N° de référence */}
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600,
              color:'#6b7280', marginBottom:'0.25rem' }}>N° de référence</label>
            <input value={refNum} onChange={e => setRefNum(e.target.value)} style={inpSt}
              placeholder="Ex: D001-2026"/>
          </div>

          {/* Guests */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:'0.5rem' }}>
              <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#6b7280',
                textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Voyageurs ({guests.length})
              </label>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => addGuest('Adult')}
                  style={{ padding:'0.25rem 0.625rem', borderRadius:'0.375rem', cursor:'pointer',
                    fontSize:'0.75rem', fontWeight:600, background:'#dbeafe', color:'#1d4ed8',
                    border:'none', fontFamily:'inherit' }}>+ Adulte</button>
                <button onClick={() => addGuest('Child')}
                  style={{ padding:'0.25rem 0.625rem', borderRadius:'0.375rem', cursor:'pointer',
                    fontSize:'0.75rem', fontWeight:600, background:'#fef3c7', color:'#92400e',
                    border:'none', fontFamily:'inherit' }}>+ Enfant</button>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {guests.map((g, i) => (
                <div key={i} style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                  <span style={{ fontSize:'0.75rem', fontWeight:600, minWidth:50, flexShrink:0,
                    color: g.type === 'Adult' ? '#1d4ed8' : '#92400e' }}>
                    {g.type === 'Adult' ? '👤' : '🧒'} {g.type}
                  </span>
                  <input value={g.name} onChange={e => updateGuest(i, 'name', e.target.value)}
                    placeholder="Prénom Nom" style={{ ...inpSt, flex:1 }}/>
                  <select value={g.type}
                    onChange={e => updateGuest(i, 'type', e.target.value as 'Adult' | 'Child')}
                    style={{ ...inpSt, width:'auto', flexShrink:0, cursor:'pointer' }}>
                    <option value="Adult">Adult</option>
                    <option value="Child">Child</option>
                  </select>
                  {guests.length > 1 && (
                    <button onClick={() => removeGuest(i)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:'#ef4444', fontSize:'1rem', padding:'0.25rem', flexShrink:0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info sur ce qui sera généré */}
          <div style={{ background:'#f9fafb', borderRadius:'0.75rem', padding:'0.875rem 1rem',
            border:'1px solid #e5e7eb', fontSize:'0.8125rem', color:'#374151' }}>
            <div style={{ fontWeight:600, marginBottom:6, fontSize:'0.75rem',
              textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280' }}>
              Contenu du voucher
            </div>
            <div>✅ En-tête : {agName}{logoUrl ? ' + logo' : ''}</div>
            <div>✅ Référence : {refNum}</div>
            <div>✅ Statut : <strong style={{ color:'#16a34a' }}>PROVISOIRE</strong></div>
            <div>✅ Hôtel : {hotelName} · {roomType}</div>
            <div>✅ Séjour : {stayStr}</div>
            <div>✅ Client : {clientName || '—'}{clientPhone ? ` · ${clientPhone}` : ''}</div>
            <div>✅ {guests.length} voyageur{guests.length > 1 ? 's' : ''}</div>
            <div>✅ Pied de page : coordonnées {agName}</div>
          </div>

          {/* Bouton */}
          <button onClick={generate} disabled={generating}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.75rem',
              background: generating ? '#6b7280' : '#0f2c5c', color:'#fff',
              border:'none', cursor: generating ? 'wait' : 'pointer',
              fontWeight:700, fontSize:'0.9375rem',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating ? '⏳ Génération...' : '🖨️ Générer le Voucher PDF (impression → Enregistrer)'}
          </button>

          <p style={{ fontSize:'0.75rem', color:'#9ca3af', textAlign:'center' }}>
            Dans la fenêtre d'impression, choisir &quot;Enregistrer en PDF&quot; et activer &quot;Graphiques d'arrière-plan&quot;
          </p>
        </div>
      </div>
    </div>
  )
}
