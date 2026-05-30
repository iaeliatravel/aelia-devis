'use client'
import { useState, useCallback } from 'react'
import { Quote, AgencyConfig } from '@/types/database'

interface Props {
  quote: Quote
  agency: AgencyConfig
  onClose: () => void
}

function fmtNum(n: number) {
  // Format compact: pas de .00 inutile, séparateurs de milliers
  return new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function ClientShareModal({ quote, agency, onClose }: Props) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState<'pdf' | 'img' | null>(null)

  const items    = quote.items || []
  const total    = items.reduce((s, i) => s + (i.total_price || 0), 0)
  const validity = quote.validity_days || 7

  // Calcul date validité
  const issueDate    = new Date(quote.issue_date)
  const validityDate = new Date(issueDate)
  validityDate.setDate(issueDate.getDate() + validity)
  const issueDateFmt    = issueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const validityDateFmt = validityDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const clientLabel = [quote.client?.name, quote.client?.phone].filter(Boolean).join(' | ') || '—'
  const logoUrl     = agency.logo_url || ''

  const buildHTML = useCallback((): string => {
    const rows = items.map(item => `
      <tr>
        <td class="td-desc">${item.description}</td>
        <td class="td-center">${item.quantity}</td>
        <td class="td-right">${fmtNum(item.unit_price)}&nbsp;DA</td>
        <td class="td-right td-bold">${fmtNum(item.total_price)}&nbsp;DA</td>
      </tr>`).join('')

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=1080"/>
<title>Devis ${quote.quote_number} — ${agency.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#fff;color:#1e293b;
  width:1080px;margin:0 auto;
}
.page{width:1080px;background:#fff;overflow:hidden}

/* ── HEADER ── */
.header{
  background:linear-gradient(135deg,#0f2c5c 0%,#1a3a6e 50%,#1e4d8c 100%);
  padding:28px 48px 36px;
  position:relative;overflow:hidden
}
.header::before{
  content:'';position:absolute;top:-100px;right:-60px;
  width:280px;height:280px;border-radius:50%;
  background:rgba(255,255,255,0.04)
}
.h-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
.agency-name{font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;margin-bottom:4px}
.agency-info{font-size:11.5px;color:rgba(255,255,255,0.72);line-height:1.7}
.logo-box{
  width:80px;height:80px;background:#fff;border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.22);flex-shrink:0
}
.logo-box img{width:72px;height:72px;object-fit:contain}
.logo-txt{font-size:18px;font-weight:800;color:#1e3a6e;text-align:center}
.h-bottom{display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;position:relative;z-index:1}
.devis-word{font-size:36px;font-style:italic;color:#fff;font-weight:300;letter-spacing:-0.5px}
.devis-sub{font-size:10.5px;color:rgba(255,255,255,0.55);font-style:italic;margin-top:2px}
.badges{display:flex;gap:10px;align-items:flex-end}
.badge{
  background:rgba(255,255,255,0.11);border:1px solid rgba(255,255,255,0.22);
  border-radius:24px;padding:6px 16px;text-align:center
}
.badge-lbl{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.55);display:block;margin-bottom:1px}
.badge-val{font-size:13px;font-weight:700;color:#fff}

/* ── BODY ── */
.body{padding:28px 48px 44px}
.client-card{
  background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
  padding:13px 20px;margin-bottom:24px;
  display:flex;align-items:center;gap:12px
}
.client-icon{width:34px;height:34px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.client-lbl{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:2px}
.client-val{font-size:13px;font-weight:600;color:#1e293b}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{background:#0f2c5c}
thead th{
  padding:10px 14px;text-align:left;
  font-size:10px;text-transform:uppercase;letter-spacing:0.07em;
  color:rgba(255,255,255,0.9);font-weight:600
}
.th-center{text-align:center}
.th-right{text-align:right}
tbody tr{border-bottom:1px solid #e8edf3}
tbody tr:last-child{border-bottom:none}
tbody tr:nth-child(even){background:#f8fafc}
.td-desc{padding:11px 14px;line-height:1.55;vertical-align:top;color:#1e293b}
.td-center{padding:11px 14px;text-align:center;vertical-align:top;color:#374151;white-space:nowrap}
.td-right{padding:11px 14px;text-align:right;vertical-align:top;color:#374151;white-space:nowrap;font-variant-numeric:tabular-nums}
.td-bold{font-weight:700;color:#1e293b}

/* ── TOTAL ── */
.total-wrap{display:flex;justify-content:flex-end;margin-top:20px}
.total-box{
  background:linear-gradient(135deg,#0f2c5c,#1e4d8c);
  border-radius:12px;padding:18px 28px;text-align:right;min-width:240px
}
.total-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.65);margin-bottom:6px}
.total-amt{font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.5px;font-variant-numeric:tabular-nums}
.total-cur{font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px}

/* ── VALIDITY ── */
.validity{
  margin-top:14px;
  display:flex;align-items:center;gap:8px;
  font-size:11px;color:#64748b;justify-content:flex-end
}
.validity strong{color:#1e293b}

/* ── REMARKS ── */
.remarks{margin-top:20px;margin-bottom:0}
.remarks-lbl{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;font-weight:600}
.remarks-txt{font-size:12px;color:#475569;line-height:1.6}

/* ── FOOTER ── */
.footer{
  border-top:1px solid #e2e8f0;padding:14px 48px;
  display:flex;justify-content:space-between;align-items:center;margin-top:20px
}
.footer-txt{font-size:11px;color:#94a3b8}
.footer-line{width:50px;height:2.5px;background:linear-gradient(90deg,#0f2c5c,#4f8ef0);border-radius:2px}

/* ── PRINT ── */
@media print{
  body{width:100%;margin:0}
  .page{width:100%}
  @page{margin:0;size:A4 portrait}
}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="h-top">
      <div>
        <div class="agency-name">${agency.name}</div>
        <div class="agency-info">${[agency.address, agency.city, agency.phone].filter(Boolean).join('<br>')}</div>
      </div>
      <div class="logo-box">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="Logo" crossorigin="anonymous"/>`
          : `<div class="logo-txt">${agency.name.substring(0, 2).toUpperCase()}</div>`}
      </div>
    </div>
    <div class="h-bottom">
      <div>
        <div class="devis-word">Devis</div>
        <div class="devis-sub">${agency.footer_note || 'Sous réserve de disponibilité'}</div>
      </div>
      <div class="badges">
        <div class="badge"><span class="badge-lbl">N° Devis</span><span class="badge-val">${quote.quote_number}</span></div>
        <div class="badge"><span class="badge-lbl">Date d'émission</span><span class="badge-val">${issueDateFmt}</span></div>
      </div>
    </div>
  </div>

  <div class="body">
    <div class="client-card">
      <div class="client-icon">👤</div>
      <div>
        <div class="client-lbl">Client</div>
        <div class="client-val">${clientLabel}</div>
      </div>
    </div>

    <table>
      <thead><tr>
        <th style="width:54%">Description</th>
        <th class="th-center" style="width:9%">Qté</th>
        <th class="th-right"  style="width:18%">Prix unitaire</th>
        <th class="th-right"  style="width:19%">Prix total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    ${quote.remarks ? `<div class="remarks"><div class="remarks-lbl">Remarques</div><div class="remarks-txt">${quote.remarks}</div></div>` : ''}

    <div class="total-wrap">
      <div class="total-box">
        <div class="total-lbl">Total TTC</div>
        <div class="total-amt">${fmtNum(total)}</div>
        <div class="total-cur">Dinars Algériens (DA)</div>
      </div>
    </div>

    <div class="validity">
      ⏳ Validité : <strong>${validity} jours</strong> — jusqu'au <strong>${validityDateFmt}</strong>
    </div>
  </div>

  <div class="footer">
    <div class="footer-txt">${agency.name} — ${agency.city || 'Algérie'}</div>
    <div class="footer-line"></div>
  </div>
</div>
</body>
</html>`
  }, [quote, agency, items, total, validity, issueDateFmt, validityDateFmt, clientLabel, logoUrl])

  // ── PDF via impression ────────────────────────────────────────────────────
  async function generatePDF() {
    setGenerating(true)
    const printWin = window.open('', '_blank', 'width=1200,height=900')
    if (!printWin) { alert('Autorisez les popups pour ce site.'); setGenerating(false); return }
    printWin.document.write(buildHTML())
    printWin.document.close()
    await new Promise(r => setTimeout(r, 1000))
    printWin.print()
    setDone('pdf')
    setGenerating(false)
  }

  // ── IMAGE via html2canvas ─────────────────────────────────────────────────
  async function generateImage() {
    setGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const container   = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;background:#fff;z-index:-1'
      container.innerHTML     = buildHTML()
      document.body.appendChild(container)
      await new Promise(r => setTimeout(r, 900))
      const pageEl = container.querySelector('.page') as HTMLElement
      const canvas = await html2canvas(pageEl || container, {
        scale: 1.5,          // 1080 × 1.5 = 1620px — lisible sur mobile
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 8000,
      })
      document.body.removeChild(container)
      const link      = document.createElement('a')
      link.download   = `Devis_${quote.quote_number.replace('/', '_')}_client.jpg`
      link.href       = canvas.toDataURL('image/jpeg', 0.88) // JPEG = plus léger que PNG
      link.click()
      setDone('img')
    } catch (e) {
      console.error(e); alert('Erreur génération image.')
    }
    setGenerating(false)
  }

  // ── LOGO URL info ─────────────────────────────────────────────────────────
  const logoInfo = logoUrl
    ? { ok: true,  msg: `✅ Logo configuré` }
    : { ok: false, msg: `⚠️ Pas de logo — allez dans ⚙️ Agence → champ "URL du logo" et collez l'URL de votre logo (ex: Supabase Storage ou lien direct https://…)` }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:460, borderRadius:'1.25rem',
        background:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
        overflow:'hidden', color:'#111827' }}>

        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #e5e7eb',
          display:'flex', alignItems:'center', justifyContent:'space-between', background:'#ffffff' }}>
          <div>
            <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#111827' }}>📤 Partager le devis client</h2>
            <p style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:2 }}>
              Devis {quote.quote_number} · {clientLabel}
            </p>
          </div>
          <button onClick={onClose} style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
            border:'1px solid #e5e7eb', background:'#f3f4f6', cursor:'pointer', fontSize:'1rem', color:'#374151' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.875rem', background:'#ffffff' }}>

          {/* Logo status */}
          <div style={{ background: logoInfo.ok ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${logoInfo.ok ? '#bbf7d0' : '#fde68a'}`,
            borderRadius:'0.625rem', padding:'0.75rem 1rem',
            fontSize:'0.8125rem', color: logoInfo.ok ? '#166534' : '#92400e', lineHeight:1.5 }}>
            {logoInfo.msg}
          </div>

          {/* Contenu */}
          <div style={{ background:'#f9fafb', borderRadius:'0.75rem', padding:'1rem',
            border:'1px solid #e5e7eb' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:600, color:'#6b7280',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.625rem' }}>
              Contenu du document client
            </p>
            {[
              '✅ Entête agence + logo',
              `✅ Devis ${quote.quote_number} — ${issueDateFmt}`,
              `✅ Validité : ${validity} j (jusqu'au ${validityDateFmt})`,
              '✅ Informations client',
              `✅ ${items.length} prestation(s) — Total ${fmtNum(total)} DA`,
              quote.remarks ? '✅ Remarques' : null,
              '🚫 Coût brut, marge, bénéfice (masqués)',
            ].filter(Boolean).map((line, i) => (
              <p key={i} style={{ fontSize:'0.8125rem', color: (line as string).startsWith('🚫') ? '#9ca3af' : '#111827',
                paddingBlock:'0.1875rem' }}>{line}</p>
            ))}
          </div>

          {/* Buttons */}
          <button onClick={generatePDF} disabled={generating}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.75rem',
              background:'#0f2c5c', color:'white', border:'none',
              cursor: generating ? 'wait' : 'pointer', fontWeight:700,
              fontSize:'0.9375rem', opacity: generating ? 0.6 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating ? '⏳ Génération...' : '📄 PDF (impression → Enregistrer PDF)'}
          </button>

          <button onClick={generateImage} disabled={generating}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.75rem',
              background:'#0f766e', color:'white', border:'none',
              cursor: generating ? 'wait' : 'pointer', fontWeight:700,
              fontSize:'0.9375rem', opacity: generating ? 0.6 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating ? '⏳ Génération...' : '🖼️ Image JPEG (légère, 1080px mobile)'}
          </button>

          {done && (
            <div style={{ background:'#d1fae5', borderRadius:'0.625rem', padding:'0.75rem 1rem',
              fontSize:'0.875rem', color:'#065f46', fontWeight:500, textAlign:'center' }}>
              {done === 'pdf' ? '✅ Fenêtre impression ouverte — choisir "Enregistrer en PDF"' : '✅ Image téléchargée !'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
