'use client'
import { useState, useRef, useCallback } from 'react'
import { Quote, AgencyConfig } from '@/types/database'

interface Props {
  quote: Quote
  agency: AgencyConfig
  onClose: () => void
}

const BOARD_LABELS: Record<string, string> = {
  room_only: 'Chambre seulement', breakfast: 'Petit déjeuner',
  half_board: 'Demi pension', full_board: 'Pension complète', all_inclusive: 'Tout inclus',
}

function fmtNum(n: number) {
  return n.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })
}

export default function ClientShareModal({ quote, agency, onClose }: Props) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone]             = useState<'pdf'|'img'|null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const items = quote.items || []
  const total = items.reduce((s, i) => s + (i.total_price || 0), 0)

  // ── Build the HTML string for the client document ──────────────────────────
  const buildHTML = useCallback(() => {
    const logoUrl = agency.logo_url || ''
    const rows = items.map(item => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #e8edf3;font-size:13px;line-height:1.55;vertical-align:top;color:#1e293b">${item.description}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8edf3;font-size:13px;text-align:center;vertical-align:top;color:#1e293b;white-space:nowrap">${item.quantity}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8edf3;font-size:13px;text-align:right;vertical-align:top;color:#1e293b;white-space:nowrap;font-variant-numeric:tabular-nums">${fmtNum(item.unit_price)} DA</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e8edf3;font-size:13px;text-align:right;vertical-align:top;color:#1e293b;white-space:nowrap;font-weight:600;font-variant-numeric:tabular-nums">${fmtNum(item.total_price)} DA</td>
      </tr>`).join('')

    const issueDate = new Date(quote.issue_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const clientLabel = [quote.client?.name, quote.client?.phone].filter(Boolean).join(' | ') || '—'

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=1080"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital@0;1&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:40px 0}
  .page{width:1080px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10)}
  .header{background:linear-gradient(135deg,#0f2c5c 0%,#1e4080 60%,#2a5298 100%);padding:48px 56px 60px;position:relative;overflow:hidden}
  .header::before{content:'';position:absolute;top:-80px;right:-80px;width:320px;height:320px;background:rgba(255,255,255,0.04);border-radius:50%}
  .header::after{content:'';position:absolute;bottom:-60px;right:120px;width:200px;height:200px;background:rgba(255,255,255,0.03);border-radius:50%}
  .header-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
  .agency-name{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px}
  .agency-info{font-size:13px;color:rgba(255,255,255,0.75);line-height:1.7}
  .logo-box{width:100px;height:100px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.2)}
  .logo-box img{width:90px;height:90px;object-fit:contain}
  .logo-placeholder{font-size:11px;color:#94a3b8;text-align:center;padding:8px}
  .devis-title{font-family:'Playfair Display',serif;font-style:italic;font-size:48px;color:#fff;margin:28px 0 4px;position:relative;z-index:1}
  .devis-sub{font-size:12px;color:rgba(255,255,255,0.6);font-style:italic;position:relative;z-index:1;margin-bottom:20px}
  .badges{display:flex;gap:12px;position:relative;z-index:1}
  .badge{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:30px;padding:8px 20px;text-align:center;backdrop-filter:blur(4px)}
  .badge-label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.6);display:block;margin-bottom:2px}
  .badge-value{font-size:16px;font-weight:700;color:#fff}
  .wave{width:100%;height:40px;display:block;margin-top:-1px}
  .body{padding:40px 56px 56px}
  .client-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 24px;margin-bottom:36px;display:flex;align-items:center;gap:16px}
  .client-icon{width:40px;height:40px;background:#e1e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
  .client-label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:3px}
  .client-value{font-size:14px;font-weight:600;color:#1e293b}
  table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
  thead tr{background:#0f2c5c}
  thead th{padding:14px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.07em;color:rgba(255,255,255,0.9);font-weight:600}
  thead th:not(:first-child){text-align:center}
  thead th:last-child{text-align:right}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:nth-child(even){background:#f8fafc}
  .remarks-section{margin-top:36px;margin-bottom:36px}
  .remarks-title{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:10px;font-weight:600}
  .remarks-text{font-size:13px;color:#475569;line-height:1.6}
  .total-row{display:flex;justify-content:flex-end;margin-top:24px}
  .total-box{background:linear-gradient(135deg,#0f2c5c,#1e4080);border-radius:14px;padding:24px 36px;text-align:right;min-width:280px}
  .total-label{font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);margin-bottom:8px}
  .total-amount{font-size:38px;font-weight:800;color:#fff;letter-spacing:-1px;font-variant-numeric:tabular-nums}
  .total-currency{font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px}
  .footer{border-top:1px solid #e2e8f0;padding:20px 56px;display:flex;justify-content:space-between;align-items:center}
  .footer-left{font-size:12px;color:#94a3b8}
  .footer-accent{width:60px;height:3px;background:linear-gradient(90deg,#0f2c5c,#4f8ef0);border-radius:2px}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div>
        <div class="agency-name">${agency.name}</div>
        <div class="agency-info">
          ${agency.address ? agency.address + '<br>' : ''}
          ${agency.city ? agency.city + '<br>' : ''}
          ${agency.phone ? agency.phone : ''}
        </div>
      </div>
      <div class="logo-box">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo"/>` : `<div class="logo-placeholder">${agency.name.substring(0,2).toUpperCase()}</div>`}
      </div>
    </div>
    <div class="devis-title">Devis</div>
    <div class="devis-sub">${agency.footer_note || 'Devis valable 07 jours sous réserve de disponibilité'}</div>
    <div class="badges">
      <div class="badge"><span class="badge-label">N° Devis</span><span class="badge-value">${quote.quote_number}</span></div>
      <div class="badge"><span class="badge-label">Date d&apos;émission</span><span class="badge-value">${issueDate}</span></div>
    </div>
  </div>
  <svg class="wave" viewBox="0 0 1080 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,0 C360,40 720,0 1080,20 L1080,0 Z" fill="#1e4080"/>
  </svg>
  <div class="body">
    <div class="client-card">
      <div class="client-icon">👤</div>
      <div>
        <div class="client-label">Client</div>
        <div class="client-value">${clientLabel}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:55%">Description</th>
          <th style="width:10%">Qté</th>
          <th style="width:17%">Prix unitaire</th>
          <th style="width:18%">Prix total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${quote.remarks ? `<div class="remarks-section"><div class="remarks-title">Remarques</div><div class="remarks-text">${quote.remarks}</div></div>` : ''}
    <div class="total-row">
      <div class="total-box">
        <div class="total-label">Total TTC</div>
        <div class="total-amount">${fmtNum(total)}</div>
        <div class="total-currency">Dinars Algériens (DA)</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-left">${agency.name} — ${agency.city || 'Algérie'}</div>
    <div class="footer-accent"></div>
  </div>
</div>
</body>
</html>`
  }, [quote, agency, items, total])

  // ── Generate PNG via html2canvas ─────────────────────────────────────────
  async function generateImage() {
    setGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      // Render in a hidden iframe-like container
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;z-index:-1'
      container.innerHTML = buildHTML()
      document.body.appendChild(container)
      // Wait for fonts/images
      await new Promise(r => setTimeout(r, 800))
      const pageEl = container.querySelector('.page') as HTMLElement
      const canvas = await html2canvas(pageEl || container, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1080,
        logging: false,
      })
      document.body.removeChild(container)
      const link = document.createElement('a')
      link.download = `Devis_${quote.quote_number.replace('/', '_')}_client.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setDone('img')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la génération de l\'image.')
    }
    setGenerating(false)
  }

  // ── Generate PDF via print dialog (most reliable cross-browser) ──────────
  async function generatePDF() {
    setGenerating(true)
    try {
      const printWin = window.open('', '_blank', 'width=1200,height=800')
      if (!printWin) { alert('Popup bloquée. Autorisez les popups pour ce site.'); setGenerating(false); return }
      printWin.document.write(buildHTML())
      printWin.document.close()
      await new Promise(r => setTimeout(r, 1200))
      printWin.print()
      setDone('pdf')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la génération du PDF.')
    }
    setGenerating(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, borderRadius: '1.25rem',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📤 Partager le devis</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Devis {quote.quote_number} · {[quote.client?.name, quote.client?.phone].filter(Boolean).join(' | ') || '—'}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
            border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Génère un document <strong>client</strong> sans les informations internes (coût brut, bénéfice, marge).
          </p>

          {/* Preview summary */}
          <div style={{ background: 'var(--color-surface-offset)', borderRadius: '0.75rem', padding: '1rem',
            border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
              Contenu du document
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[
                '✅ Entête agence avec logo',
                '✅ N° devis & date d\'émission',
                '✅ Informations client',
                `✅ ${items.length} prestation(s)`,
                '✅ Total TTC',
                quote.remarks ? '✅ Remarques' : null,
                '🚫 Coût brut, bénéfice, marge (masqués)',
              ].filter(Boolean).map((line, i) => (
                <p key={i} style={{ fontSize: '0.8125rem', color: line!.startsWith('🚫') ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.25rem' }}>
            <button onClick={generatePDF} disabled={generating}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
                background: '#0f2c5c', color: 'white', border: 'none', cursor: generating ? 'wait' : 'pointer',
                fontWeight: 700, fontSize: '0.9375rem', opacity: generating ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generating ? '⏳ Génération...' : '📄 Générer PDF (via impression)'}
            </button>
            <button onClick={generateImage} disabled={generating}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
                background: '#0f766e', color: 'white', border: 'none', cursor: generating ? 'wait' : 'pointer',
                fontWeight: 700, fontSize: '0.9375rem', opacity: generating ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generating ? '⏳ Génération...' : '🖼️ Générer Image PNG (1080px)'}
            </button>
          </div>

          {done && (
            <div style={{ background: '#d1fae5', borderRadius: '0.625rem', padding: '0.75rem 1rem',
              fontSize: '0.875rem', color: '#065f46', fontWeight: 500, textAlign: 'center' }}>
              {done === 'pdf' ? '✅ Fenêtre d\'impression ouverte !' : '✅ Image téléchargée !'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
