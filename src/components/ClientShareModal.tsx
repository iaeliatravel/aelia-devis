'use client'
import { useState } from 'react'
import { Quote, AgencyConfig, DocumentType } from '@/types/database'
import { supabase } from '@/lib/supabase'
import DocTypeBadge, { DOC_TYPE_CONFIG } from './DocTypeBadge'

type DocType   = 'devis' | 'proforma' | 'facture' | 'bon'
type PayMethod = 'Espèces' | 'Virement bancaire' | 'Chèque' | 'CCP'
type GenMode   = 'print' | 'image'

interface Props { quote: Quote; agency: AgencyConfig; onClose: () => void; onDocTypeChange?: (t: DocumentType) => void }

const e  = (s?: string | null) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const n  = (v: number) => new Intl.NumberFormat('fr-DZ').format(Math.round(v))
const fd = (d: Date)   => d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})

const DOC_TABS: {id:DocType;dbKey:DocumentType;icon:string;label:string}[] = [
  {id:'devis',    dbKey:'devis',         icon:'📄', label:'Devis'},
  {id:'proforma', dbKey:'proforma',      icon:'📋', label:'Facture Proforma'},
  {id:'facture',  dbKey:'facture',       icon:'🧾', label:'Facture'},
  {id:'bon',      dbKey:'bon_versement', icon:'💳', label:'Bon de Versement'},
]

const PAY_METHODS: PayMethod[] = ['Espèces','Virement bancaire','Chèque','CCP']
const PAY_ICONS: Record<PayMethod,string> = {'Espèces':'💵','Virement bancaire':'🏦','Chèque':'📝','CCP':'🏛️'}

/** Convert DB value → modal tab id */
function dbToTab(dt?: DocumentType | string | null): DocType {
  switch(dt) {
    case 'proforma':      return 'proforma'
    case 'facture':       return 'facture'
    case 'bon_versement': return 'bon'
    default:              return 'devis'
  }
}

export default function ClientShareModal({ quote, agency, onClose, onDocTypeChange }: Props) {
  const [docType,    setDocType]    = useState<DocType>(dbToTab(quote.document_type))
  const [payMethod,  setPayMethod]  = useState<PayMethod>((quote.payment_method as PayMethod) || 'Espèces')
  const [bonNotes,   setBonNotes]   = useState(quote.remarks || '')
  const [generating, setGenerating] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [done,       setDone]       = useState<'pdf'|'img'|null>(null)

  const items    = quote.items || []
  const totalHT  = items.reduce((s,i) => s+(i.total_price||0), 0)
  const tva      = totalHT * 0.19
  const totalTTC = totalHT + tva
  const validity = quote.validity_days || 7
  const issueDate = new Date(quote.issue_date)
  const expDate   = new Date(issueDate); expDate.setDate(issueDate.getDate() + validity)
  const issueDateStr = fd(issueDate)
  const expDateStr   = fd(expDate)
  const clientLabel  = [quote.client?.name, quote.client?.phone].filter(Boolean).join(' · ') || '—'
  const logoUrl      = agency.logo_url || ''

  const currentTab   = DOC_TABS.find(t => t.id === docType)!
  const isChanged    = dbToTab(quote.document_type) !== docType
  const isNewType    = isChanged

  /* ── Save document type to DB ── */
  async function saveDocType() {
    if (!quote.id) return
    setSaving(true)
    const dbDocType = currentTab.dbKey
    await supabase.from('quotes').update({
      document_type: dbDocType,
      payment_method: docType === 'bon' ? payMethod : null,
      updated_at: new Date().toISOString(),
    }).eq('id', quote.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onDocTypeChange?.(dbDocType)
  }

  /* ── HTML Templates ── */
  function buildBaseHTML(mode: GenMode, dt: 'devis'|'proforma'|'facture'): string {
    const p = mode === 'print'
    const fs = (a: number, b: number) => p ? a : b
    const titles = {
      devis:    { word:'Devis',            sub:`Valable ${validity} jours — sous réserve de disponibilité` },
      proforma: { word:'Facture Proforma', sub:'Document provisoire — non fiscal' },
      facture:  { word:'Facture',          sub:'' },
    }
    const { word, sub } = titles[dt]
    const displayTotal = dt === 'facture' ? totalTTC : totalHT
    const displayLabel = dt === 'facture' ? 'Total TTC' : 'Total'

    const metaItems = [
      { label:'N° Document', val: e(quote.quote_number) },
      { label:"Date d'émission", val: issueDateStr },
      ...(dt==='devis' ? [{label:"Valide jusqu'au", val:expDateStr}] : []),
    ]

    const rows = items.map((it,i) => `
      <tr style="background:${i%2===1?'#f5f8fc':'#fff'}">
        <td style="padding:${fs(7,9)}px 10px;font-size:${fs(10.5,13)}px;color:#1a2b3c;vertical-align:top;line-height:1.45">${e(it.description)}</td>
        <td style="padding:${fs(7,9)}px 10px;text-align:center;font-size:${fs(10,12)}px;color:#475569;white-space:nowrap">${it.quantity}</td>
        <td style="padding:${fs(7,9)}px 10px;text-align:right;font-size:${fs(10,12)}px;color:#475569;white-space:nowrap;font-variant-numeric:tabular-nums">${n(it.unit_price)}&nbsp;DA</td>
        <td style="padding:${fs(7,9)}px 10px;text-align:right;font-size:${fs(10,12)}px;font-weight:700;color:#0d2340;white-space:nowrap;font-variant-numeric:tabular-nums">${n(it.total_price)}&nbsp;DA</td>
      </tr>`).join('')

    const tvaBlock = dt==='facture' ? `
      <div style="display:flex;justify-content:flex-end;margin-bottom:${fs(12,18)}px">
        <div style="min-width:${fs(220,280)}px">
          ${[['Sous-total HT',n(totalHT)+' DA'],['TVA (19%)',n(tva)+' DA']].map(([l,v])=>`
            <div style="display:flex;justify-content:space-between;padding:${fs(4,6)}px 0;border-bottom:1px solid #e2e8f0">
              <span style="font-size:${fs(11,13)}px;color:#64748b">${l}</span>
              <span style="font-size:${fs(11,13)}px;font-weight:500;color:#1e293b;font-variant-numeric:tabular-nums">${v}</span>
            </div>`).join('')}
        </div>
      </div>` : ''

    return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"/><title>${word} ${e(quote.quote_number)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:12mm 14mm}
@media print{html,body{background:#fff!important;width:100%!important}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a2b3c;background:${p?'#fff':'#e8eef5'};${p?'width:100%':'width:1080px;margin:0 auto'}}
</style></head><body>
<div style="background:#fff;${p?'':'border-radius:6px;overflow:hidden;margin:24px auto;max-width:1040px;box-shadow:0 4px 32px rgba(0,0,0,.1)'}">
  <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;
    padding:${p?'18px 34px 20px':'26px 48px 28px'};border-bottom:3px solid #1e6fa5;
    display:flex;justify-content:space-between;align-items:flex-start;background:#fff">
    <div>
      <div style="font-size:${fs(16,22)}px;font-weight:800;color:#0d2340">${e(agency.name)}</div>
      <div style="font-size:${fs(9.5,11.5)}px;color:#6b7f93;line-height:1.75;margin-top:5px">
        ${[agency.address,agency.city,agency.phone,agency.email].filter(Boolean).map(e).join('<br>')}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:${fs(8,12)}px">
      ${logoUrl?`<img src="${logoUrl}" crossorigin="anonymous" style="width:${fs(52,70)}px;height:${fs(52,70)}px;object-fit:contain;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc" alt="logo"/>`:''}
      <div style="text-align:right">
        <div style="font-size:${fs(22,30)}px;font-weight:300;color:#1e6fa5;font-style:italic">${word}</div>
        ${sub?`<div style="font-size:${fs(9,11)}px;color:#94a3b8;margin-top:3px;font-style:italic">${sub}</div>`:''}
      </div>
    </div>
  </div>
  <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f5f8fc;border-bottom:1px solid #e2e8f0;padding:${p?'9px 34px':'12px 48px'};display:flex;gap:0;flex-wrap:wrap">
    ${metaItems.map((m,i)=>`
      <div style="${i>0?`border-left:1px solid #d4dde8;padding-left:${fs(16,22)}px;margin-left:${fs(16,22)}px`:''}">
        <div style="font-size:${fs(8.5,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7f93">${m.label}</div>
        <div style="font-size:${fs(11,14)}px;font-weight:700;color:#0d2340;margin-top:2px;font-variant-numeric:tabular-nums">${m.val}</div>
      </div>`).join('')}
  </div>
  <div style="padding:${p?'18px 34px 28px':'24px 48px 40px'}">
    <div style="display:flex;align-items:center;gap:${fs(10,14)}px;border:1px solid #e2e8f0;border-radius:7px;padding:${p?'8px 12px':'11px 16px'};margin-bottom:${fs(14,20)}px">
      <div style="width:${fs(26,34)}px;height:${fs(26,34)}px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${fs(13,18)}px;flex-shrink:0">👤</div>
      <div>
        <div style="font-size:${fs(8.5,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7f93">${dt==='facture'?'Facturé à':'Client'}</div>
        <div style="font-size:${fs(12,15)}px;font-weight:700;color:#0d2340;margin-top:2px">${e(clientLabel)}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:${fs(14,20)}px">
      <thead><tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#0d2340">
        ${['Description','Qté','Prix unitaire','Prix total'].map((h,i)=>`
          <th style="padding:${fs(7,10)}px 10px;font-size:${fs(8.5,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.9);text-align:${i===0?'left':'right'}">${h}</th>`).join('')}
      </tr></thead>
      <tbody>${rows||`<tr><td colspan="4" style="padding:${fs(18,24)}px;text-align:center;color:#94a3b8;font-style:italic;font-size:${fs(10.5,13)}px">Aucune prestation</td></tr>`}</tbody>
    </table>
    ${tvaBlock}
    <div style="display:flex;justify-content:flex-end;margin-bottom:${fs(10,14)}px">
      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#0d2340;border-radius:8px;padding:${p?'12px 18px':'16px 24px'};text-align:right;min-width:${fs(185,240)}px">
        <div style="font-size:${fs(8,10)}px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.55);margin-bottom:5px">${displayLabel}</div>
        <div style="font-size:${fs(20,27)}px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums">${n(displayTotal)}</div>
        <div style="font-size:${fs(8,10)}px;color:rgba(255,255,255,.4);margin-top:3px">Dinars Algériens (DA)</div>
      </div>
    </div>
    ${dt==='devis'?`<div style="text-align:right;font-size:${fs(9.5,11)}px;color:#64748b;margin-top:${fs(6,10)}px">⏳ Valable jusqu'au <strong style="color:#0d2340">${expDateStr}</strong></div>`:''}
    ${quote.remarks?`<div style="margin-top:${fs(13,18)}px;background:#f5f8fc;border:1px solid #e2e8f0;border-radius:7px;padding:${p?'9px 12px':'13px 16px'}">
      <div style="font-size:${fs(8,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7f93;margin-bottom:4px">Remarques</div>
      <div style="font-size:${fs(10.5,13)}px;color:#475569;line-height:1.55">${e(quote.remarks)}</div>
    </div>`:''}
  </div>
  <div style="border-top:1px solid #e2e8f0;padding:${p?'8px 34px':'11px 48px'};display:flex;justify-content:space-between;align-items:center;background:#f8fafc">
    <span style="font-size:${fs(8.5,10.5)}px;color:#94a3b8">${e(agency.name)}${agency.city?` — ${e(agency.city)}`:''}</span>
    <span style="font-size:${fs(8.5,10.5)}px;color:#94a3b8">Émis le ${issueDateStr}</span>
  </div>
</div></body></html>`
  }

  function buildBonHTML(mode: GenMode): string {
    const p = mode === 'print'
    const fs = (a: number, b: number) => p ? a : b

    const renderBon = (isArchive: boolean) => {
      const badge = isArchive
        ? {txt:'Archive Agence',    bg:'#FAEEDA', color:'#BA7517', border:'#FAC775'}
        : {txt:'Exemplaire Client', bg:'#E1F5EE', color:'#0F6E56', border:'#9FE1CB'}
      return `
    <div style="position:relative;background:#fff;border:.75px solid #d3d1c7;border-radius:${fs(5,8)}px;overflow:hidden;${p?'':'box-shadow:0 2px 16px rgba(0,0,0,.07)'}">
      <div style="position:absolute;top:${fs(8,10)}px;right:${fs(10,12)}px;font-size:${fs(6.5,8)}px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:3px;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border}">${badge.txt}</div>
      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1a2540;padding:${fs(10,14)}px ${fs(18,24)}px;display:flex;align-items:center;gap:${fs(10,14)}px">
        ${logoUrl?`<img src="${logoUrl}" crossorigin="anonymous" style="width:${fs(40,56)}px;height:${fs(40,56)}px;object-fit:contain;border-radius:6px;background:rgba(255,255,255,.1)" alt="logo"/>`:''}
        <div>
          <div style="font-size:${fs(13,18)}px;font-weight:700;color:#fff">${e(agency.name)}</div>
          <div style="font-size:${fs(8,10)}px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-top:2px">Agence de voyages &amp; tourisme</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:${fs(11,15)}px;font-weight:700;color:#F0997B;letter-spacing:.08em;text-transform:uppercase">Bon de Versement</div>
          <div style="font-size:${fs(9,11)}px;color:rgba(255,255,255,.45);margin-top:3px">N° ${e(quote.quote_number)}</div>
        </div>
      </div>
      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;height:2.5px;background:#D85A30"></div>
      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#faf8f4;border-bottom:1px solid #f3f0e8;padding:${fs(7,10)}px ${fs(18,24)}px;display:flex;flex-wrap:wrap;gap:0">
        ${[{label:'Date',val:issueDateStr},{label:'Bénéficiaire',val:e(clientLabel)},{label:'Mode de paiement',val:`${PAY_ICONS[payMethod]} ${payMethod}`}].map((m,i)=>`
          <div style="${i>0?`border-left:1px solid #e0ddd5;padding-left:${fs(14,20)}px;margin-left:${fs(14,20)}px`:''}">
            <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:#888780">${m.label}</div>
            <div style="font-size:${fs(10.5,13)}px;font-weight:600;color:#2C2C2A;margin-top:2px">${m.val}</div>
          </div>`).join('')}
      </div>
      <div style="padding:${fs(9,12)}px ${fs(18,24)}px 0">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f3f0e8">
            <th style="padding:${fs(4,6)}px 8px;font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780;text-align:left">Désignation</th>
            <th style="padding:${fs(4,6)}px 8px;font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780;text-align:right">Montant (DA)</th>
          </tr></thead>
          <tbody>${items.map((it,i)=>`
            <tr style="border-bottom:1px dashed ${i===items.length-1?'transparent':'#f3f0e8'}">
              <td style="padding:${fs(4,6)}px 8px;font-size:${fs(9.5,12)}px;color:#2C2C2A">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:${fs(15,18)}px;height:${fs(15,18)}px;border-radius:50%;background:#FAECE7;color:#993C1D;font-size:${fs(8,9.5)}px;font-weight:700;margin-right:6px">${i+1}</span>${e(it.description.split('|')[0].trim())}
              </td>
              <td style="padding:${fs(4,6)}px 8px;font-size:${fs(9.5,12)}px;font-weight:600;color:#2C2C2A;text-align:right;font-variant-numeric:tabular-nums">${n(it.total_price)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;align-items:stretch;gap:${fs(8,12)}px;padding:${fs(8,12)}px ${fs(18,24)}px ${fs(10,14)}px">
        <div style="flex:1.5;background:#faf8f4;border-radius:6px;padding:${fs(7,10)}px;border:1px solid #D3D1C7;min-height:${fs(44,56)}px">
          <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:#888780;margin-bottom:3px">Remarques</div>
          <div style="font-size:${fs(9,11)}px;color:#2C2C2A;line-height:1.5">${e(bonNotes||quote.remarks||'')}</div>
        </div>
        <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1a2540;border-radius:7px;padding:${fs(9,12)}px ${fs(12,18)}px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;min-width:${fs(120,150)}px">
          <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:rgba(255,255,255,.5);margin-bottom:4px">Montant versé</div>
          <div style="font-size:${fs(17,22)}px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;line-height:1">${n(totalHT)}</div>
          <div style="font-size:${fs(7.5,9)}px;color:#F0997B;margin-top:3px">Dinars Algériens</div>
        </div>
      </div>
      <div style="display:flex;gap:${p?'1.5rem':'2rem'};padding:${fs(7,10)}px ${fs(18,24)}px ${fs(10,14)}px;border-top:1px dashed #D3D1C7;margin:0 ${fs(6,8)}px">
        ${[{l:'Signature du client',s:'Lu et approuvé'},{l:'Cachet &amp; Signature Agence',s:''}].map(sig=>`
          <div style="flex:1">
            <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780">${sig.l}</div>
            ${sig.s?`<div style="font-size:${fs(7,8.5)}px;color:#888780;font-style:italic;margin-top:1px">${sig.s}</div>`:''}
            <div style="height:1px;background:#D3D1C7;margin-top:${fs(22,30)}px"></div>
          </div>`).join('')}
      </div>
      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f3f0e8;border-top:1px solid #D3D1C7;padding:${fs(6,9)}px ${fs(18,24)}px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:${fs(8.5,10.5)}px;font-weight:600;color:#2d3a5a">${e(agency.name)}</div>
          ${(agency.address||agency.city)?`<div style="font-size:${fs(7.5,9)}px;color:#888780">${[agency.address,agency.city].filter(Boolean).map(e).join(', ')}</div>`:''}
        </div>
        <div style="text-align:right;font-size:${fs(7.5,9)}px;color:#888780;line-height:1.5">${[agency.phone,agency.email].filter(Boolean).map(e).join('<br>')}</div>
      </div>
    </div>`
    }

    const body = p
      ? renderBon(false) + `<div style="margin:10px 0;border-top:2px dashed #D3D1C7"></div>` + renderBon(true)
      : renderBon(false)

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Bon de Versement ${e(quote.quote_number)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{size:A4;margin:8mm 10mm}@media print{html,body{background:#fff!important;width:100%!important}}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#2C2C2A;background:${p?'#fff':'#f0ede8'};${p?'width:100%':'width:1080px;margin:0 auto'}}</style></head>
<body><div style="${p?'':'padding:24px;max-width:1080px;margin:0 auto'}">${body}</div></body></html>`
  }

  function getHTML(mode: GenMode): string {
    if (docType === 'bon') return buildBonHTML(mode)
    return buildBaseHTML(mode, docType as 'devis'|'proforma'|'facture')
  }

  async function handleGenerate(mode: GenMode) {
    // Auto-save doc type to DB before generating
    await saveDocType()
    if (mode === 'print') await generatePDF()
    else await generateImage()
  }

  async function generatePDF() {
    setGenerating(true); setDone(null)
    const win = window.open('','_blank','width=960,height=800')
    if (!win) { alert('Autorisez les popups pour ce site.'); setGenerating(false); return }
    win.document.write(getHTML('print'))
    win.document.close()
    await new Promise(r => setTimeout(r, 1200))
    win.print()
    setDone('pdf'); setGenerating(false)
  }

  async function generateImage() {
    setGenerating(true); setDone(null)
    try {
      const html2canvas = (await import('html2canvas')).default
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;z-index:-1'
      container.innerHTML = getHTML('image')
      document.body.appendChild(container)
      await new Promise(r => setTimeout(r, 1200))
      const target = container.firstElementChild as HTMLElement
      const canvas = await html2canvas(target || container, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: docType==='bon'?'#f0ede8':'#e8eef5',
        logging: false, imageTimeout: 10000,
      })
      document.body.removeChild(container)
      const link     = document.createElement('a')
      const slug     = currentTab.label.replace(/\s+/g,'_')
      link.download  = `${slug}_${quote.quote_number.replace('/','_')}.jpg`
      link.href      = canvas.toDataURL('image/jpeg', 0.88)
      link.click()
      setDone('img')
    } catch(err) { console.error(err); alert('Erreur lors de la génération.') }
    setGenerating(false)
  }

  const cfg = DOC_TYPE_CONFIG[currentTab.dbKey]

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.75rem'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.55)'}} onClick={onClose}/>
      <div style={{position:'relative',width:'100%',maxWidth:500,maxHeight:'94vh',overflowY:'auto',
        borderRadius:'1.25rem',background:'#fff',border:'1px solid #e5e7eb',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',color:'#111827',
        fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>

        {/* Header */}
        <div style={{position:'sticky',top:0,zIndex:2,padding:'1rem 1.25rem',borderBottom:'1px solid #e5e7eb',
          background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{fontWeight:700,fontSize:'0.9375rem',color:'#111827'}}>📤 Partager / Convertir</h2>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
              <span style={{fontSize:'0.75rem',color:'#6b7280'}}>{quote.quote_number}</span>
              <span style={{fontSize:'0.6875rem',color:'#9ca3af'}}>·</span>
              {/* Badge du type actuel en BD */}
              <DocTypeBadge type={quote.document_type || 'devis'} size="sm"/>
              {isNewType && (
                <span style={{fontSize:'0.6875rem',color:'#f59e0b',fontStyle:'italic'}}>→ {currentTab.label}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{padding:'0.25rem 0.5rem',borderRadius:'0.375rem',
            border:'1px solid #e5e7eb',background:'#f3f4f6',cursor:'pointer',fontSize:'1rem',color:'#374151'}}>✕</button>
        </div>

        <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'1rem'}}>

          {/* Doc type tabs */}
          <div>
            <div style={{fontSize:'0.7rem',fontWeight:600,textTransform:'uppercase',
              letterSpacing:'0.08em',color:'#6b7280',marginBottom:'0.5rem'}}>
              Type de document
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
              {DOC_TABS.map(tab => {
                const tabCfg = DOC_TYPE_CONFIG[tab.dbKey]
                const isActive = docType === tab.id
                return (
                  <button key={tab.id} onClick={() => { setDocType(tab.id); setDone(null) }}
                    style={{padding:'0.6rem 0.75rem',borderRadius:'0.625rem',cursor:'pointer',
                      textAlign:'left',fontSize:'0.8125rem',fontWeight:isActive?700:500,
                      border:`2px solid ${isActive ? tabCfg.border : '#e5e7eb'}`,
                      background:isActive ? tabCfg.bg : '#f9fafb',
                      color:isActive ? tabCfg.color : '#374151',transition:'all 0.15s'}}>
                    {tab.icon} {tab.label}
                    {tab.dbKey === (quote.document_type || 'devis') && (
                      <span style={{marginLeft:4,fontSize:'0.625rem',opacity:0.7}}>● actuel</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Bouton sauvegarder le type */}
            {isNewType && (
              <button onClick={saveDocType} disabled={saving}
                style={{marginTop:'0.5rem',width:'100%',padding:'0.5rem',
                  borderRadius:'0.625rem',cursor:saving?'wait':'pointer',fontSize:'0.8125rem',fontWeight:600,
                  background: saved ? '#d1fae5' : `${cfg.bg}`,
                  color: saved ? '#065f46' : cfg.color,
                  border:`1.5px solid ${saved ? '#6ee7b7' : cfg.border}`,
                  transition:'all 0.2s'}}>
                {saving ? '⏳ Sauvegarde...' : saved ? `✅ Converti en "${currentTab.label}"` : `💾 Sauvegarder la conversion → "${currentTab.label}"`}
              </button>
            )}
          </div>

          {/* Bon fields */}
          {docType === 'bon' && (
            <div style={{background:'#fdf8f5',border:'1px solid #fde8d8',borderRadius:'0.75rem',padding:'0.875rem 1rem'}}>
              <div style={{fontSize:'0.7rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'#92400e',marginBottom:'0.625rem'}}>
                💳 Paramètres du bon
              </div>
              <div style={{marginBottom:'0.625rem'}}>
                <div style={{fontSize:'0.75rem',fontWeight:500,color:'#6b7280',marginBottom:'0.375rem'}}>Mode de paiement</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem'}}>
                  {PAY_METHODS.map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      style={{padding:'0.375rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',
                        fontSize:'0.8125rem',fontWeight:payMethod===m?700:400,
                        border:`1.5px solid ${payMethod===m?'#D85A30':'#e5e7eb'}`,
                        background:payMethod===m?'#FAECE7':'#fff',
                        color:payMethod===m?'#993C1D':'#374151'}}>
                      {PAY_ICONS[m]} {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:'0.75rem',fontWeight:500,color:'#6b7280',marginBottom:'0.25rem'}}>Remarques (optionnel)</div>
                <textarea value={bonNotes} onChange={ev => setBonNotes(ev.target.value)}
                  rows={2} placeholder="Observations, conditions…"
                  style={{width:'100%',padding:'0.5rem 0.625rem',borderRadius:'0.5rem',
                    border:'1px solid #e5e7eb',background:'#fff',fontSize:'0.8125rem',
                    resize:'none',outline:'none',fontFamily:'inherit',color:'#111827'}}/>
              </div>
            </div>
          )}

          {/* Logo */}
          <div style={{background:logoUrl?'#f0fdf4':'#fffbeb',border:`1px solid ${logoUrl?'#bbf7d0':'#fde68a'}`,
            borderRadius:'0.625rem',padding:'0.5rem 0.875rem',fontSize:'0.8125rem',
            color:logoUrl?'#166534':'#92400e'}}>
            {logoUrl ? '✅ Logo configuré — visible dans tous les documents'
              : <span>⚠️ Pas de logo · <strong>⚙️ Agence → "URL du logo"</strong></span>}
          </div>

          {/* Summary */}
          <div style={{background:'#f9fafb',borderRadius:'0.75rem',padding:'0.875rem 1rem',border:'1px solid #e5e7eb'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
              <p style={{fontSize:'0.7rem',fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em'}}>Contenu</p>
              <DocTypeBadge type={currentTab.dbKey} size="sm"/>
            </div>
            {[
              `✅ En-tête ${agency.name}${logoUrl?' + logo':''}`,
              `✅ N° ${quote.quote_number} — ${issueDateStr}`,
              docType==='devis'   ? `✅ Validité ${validity} jours → ${expDateStr}` : null,
              docType==='facture' ? `✅ TVA 19% → Total TTC ${n(totalTTC)} DA`       : null,
              docType==='bon'     ? `✅ Paiement : ${payMethod}`                      : null,
              docType==='bon'     ? '✅ 2 copies A4 : Client + Archive agence'        : null,
              `✅ ${items.length} prestation(s) — ${n(totalHT)} DA`,
              '🚫 Coût brut / marge / bénéfice masqués',
            ].filter(Boolean).map((line,i) => (
              <p key={i} style={{fontSize:'0.8125rem',paddingBlock:'0.1rem',
                color:(line as string).startsWith('🚫')?'#9ca3af':'#111827'}}>{line}</p>
            ))}
          </div>

          <button onClick={() => handleGenerate('print')} disabled={generating}
            style={{width:'100%',padding:'0.875rem',borderRadius:'0.75rem',background:'#0f2c5c',
              color:'#fff',border:'none',cursor:generating?'wait':'pointer',fontWeight:700,
              fontSize:'0.9375rem',opacity:generating?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {generating ? '⏳ Génération...' : '📄 PDF A4 (impression → Enregistrer)'}
          </button>

          <button onClick={() => handleGenerate('image')} disabled={generating}
            style={{width:'100%',padding:'0.875rem',borderRadius:'0.75rem',background:'#0f766e',
              color:'#fff',border:'none',cursor:generating?'wait':'pointer',fontWeight:700,
              fontSize:'0.9375rem',opacity:generating?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {generating ? '⏳ Génération...' : '🖼️ Image 1080 px (WhatsApp / Email)'}
          </button>

          {done && (
            <div style={{background:'#d1fae5',borderRadius:'0.625rem',padding:'0.75rem 1rem',
              fontSize:'0.875rem',color:'#065f46',fontWeight:500,textAlign:'center'}}>
              {done==='pdf'
                ? "✅ Fenêtre ouverte — activer \"Graphiques d'arrière-plan\" → Enregistrer PDF"
                : `✅ Image ${currentTab.label} téléchargée !`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
