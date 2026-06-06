'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Quote, AgencyConfig, DocumentType } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { generateQuoteNumber, DOC_PREFIX, effectiveProfit } from '@/lib/quotes'
import DocTypeBadge, { DOC_TYPE_CONFIG } from './DocTypeBadge'

type DocType   = 'devis' | 'proforma' | 'facture' | 'bon'
type PayMethod = 'Espèces' | 'Virement bancaire' | 'Chèque' | 'CCP'
type GenMode   = 'print' | 'image'

interface Props {
  quote: Quote
  agency: AgencyConfig
  onClose: () => void
  onDocTypeChange?: (t: DocumentType, newNumber: string) => void
}

const esc = (s?: string | null) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n  = (v: number) => new Intl.NumberFormat('fr-DZ').format(Math.round(v))
const fd = (d: Date)   => d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })

const DOC_TABS: { id: DocType; dbKey: DocumentType; icon: string; label: string }[] = [
  { id:'devis',    dbKey:'devis',         icon:'📄', label:'Devis' },
  { id:'proforma', dbKey:'proforma',      icon:'📋', label:'Facture Proforma' },
  { id:'facture',  dbKey:'facture',       icon:'🧾', label:'Facture' },
  { id:'bon',      dbKey:'bon_versement', icon:'💳', label:'Bon de Versement' },
]
const PAY_METHODS: PayMethod[] = ['Espèces', 'Virement bancaire', 'Chèque', 'CCP']
const PAY_ICONS: Record<PayMethod, string> = {
  'Espèces':'💵', 'Virement bancaire':'🏦', 'Chèque':'📝', 'CCP':'🏛️'
}

function dbToTab(dt?: DocumentType | string | null): DocType {
  switch (dt) {
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
  const [addCachet,  setAddCachet]  = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [done,       setDone]       = useState<'pdf' | 'img' | null>(null)
  const [curNumber,  setCurNumber]  = useState(quote.quote_number)

  const items    = quote.items || []
  const totalHT  = items.reduce((s, i) => s + (i.total_price || 0), 0)
  const tva      = totalHT * 0.19
  const totalTTC = totalHT + tva
  const validity = quote.validity_days || 7

  const issueDate    = new Date(quote.issue_date)
  const expDate      = new Date(issueDate)
  expDate.setDate(issueDate.getDate() + validity)
  const issueDateStr = fd(issueDate)
  const expDateStr   = fd(expDate)
  const clientLabel  = [quote.client?.name, quote.client?.phone].filter(Boolean).join(' · ') || '—'
  const logoUrl      = agency.logo_url  || ''
  const stampUrl     = agency.stamp_url || ''
  /* 4 cm réel en print (96 dpi) = 4 × 96/2.54 ≈ 151 px
     image 1080px (≈1.36× A4 794px) → 151 × 1.36 ≈ 205 px   */
  const CACHET_PRINT = 151
  const CACHET_IMAGE = 205

  const currentTab = DOC_TABS.find(t => t.id === docType)!
  const isChanged  = dbToTab(quote.document_type) !== docType

  /* ── Sauvegarde type + renumérotation ── */
  async function saveDocType() {
    if (!quote.id) return
    setSaving(true)
    const prefix    = DOC_PREFIX[currentTab.dbKey]
    let newNumber   = curNumber
    if (!curNumber.startsWith(prefix)) {
      newNumber = await generateQuoteNumber(currentTab.dbKey)
    }
    await supabase.from('quotes').update({
      document_type:  currentTab.dbKey,
      payment_method: docType === 'bon' ? payMethod : null,
      quote_number:   newNumber,
      updated_at:     new Date().toISOString(),
    }).eq('id', quote.id)
    setCurNumber(newNumber)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
    onDocTypeChange?.(currentTab.dbKey, newNumber)
  }

  /* ══════════════════════════════════════════════════════
     HELPERS CACHET
  ══════════════════════════════════════════════════════ */
  function cachetImg(sizePx: number): string {
    if (!addCachet || !stampUrl) return ''
    /* Pas de bordure CSS — l'image du cachet est déjà circulaire */
    return `<img src="${stampUrl}" crossorigin="anonymous"
      style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;flex-shrink:0;opacity:0.88" alt="Cachet"/>`
  }

  /* ══════════════════════════════════════════════════════
     TEMPLATE BASE — Devis / Proforma / Facture
  ══════════════════════════════════════════════════════ */
  function buildBaseHTML(mode: GenMode, dt: 'devis' | 'proforma' | 'facture'): string {
    const p  = mode === 'print'
    const fs = (a: number, b: number) => p ? a : b

    const hasTVA       = dt === 'facture' || dt === 'proforma'
    const displayTotal = hasTVA ? totalTTC : totalHT
    const displayLabel = hasTVA ? 'Total TTC' : 'Total'

    const titles = {
      devis:    { word:'Devis',            sub:`Valable ${validity} jours — sous réserve de disponibilité` },
      proforma: { word:'Facture Proforma', sub:'Document provisoire — non fiscal' },
      facture:  { word:'Facture',          sub:'' },
    }
    const { word, sub } = titles[dt]

    const fiscalBlock = dt === 'facture' && (agency.rc || agency.nif || agency.nis) ? `
      <div style="margin-top:${fs(5,7)}px;padding:${fs(4,6)}px ${fs(8,10)}px;
        background:#f5f8fc;border-radius:4px;border:1px solid #e2e8f0;
        display:flex;gap:${fs(12,18)}px;flex-wrap:wrap">
        ${agency.rc  ? `<span style="font-size:${fs(8,10)}px;color:#6b7f93"><strong style="color:#0d2340">RC</strong> ${esc(agency.rc)}</span>`  : ''}
        ${agency.nif ? `<span style="font-size:${fs(8,10)}px;color:#6b7f93"><strong style="color:#0d2340">NIF</strong> ${esc(agency.nif)}</span>` : ''}
        ${agency.nis ? `<span style="font-size:${fs(8,10)}px;color:#6b7f93"><strong style="color:#0d2340">NIS</strong> ${esc(agency.nis)}</span>` : ''}
      </div>` : ''

    const metaItems = [
      { label:'N° Document', val: esc(curNumber) },
      { label:"Date d'émission", val: issueDateStr },
      ...(dt === 'devis' ? [{ label:"Valide jusqu'au", val: expDateStr }] : []),
    ]

    const rows = items.map((it, i) => `
      <tr style="background:${i % 2 === 1 ? '#f5f8fc' : '#fff'}">
        <td style="padding:${fs(7,9)}px 10px;font-size:${fs(10.5,13)}px;color:#1a2b3c;vertical-align:top;line-height:1.45">${esc(it.description)}</td>
        <td style="padding:${fs(7,9)}px 10px;text-align:center;font-size:${fs(10,12)}px;color:#475569;white-space:nowrap;vertical-align:top">${it.quantity}</td>
        <td style="padding:${fs(7,9)}px 10px;text-align:right;font-size:${fs(10,12)}px;color:#475569;white-space:nowrap;vertical-align:top;font-variant-numeric:tabular-nums">${n(it.unit_price)}&nbsp;DA</td>
        <td style="padding:${fs(7,9)}px 10px;text-align:right;font-size:${fs(10,12)}px;font-weight:700;color:#0d2340;white-space:nowrap;vertical-align:top;font-variant-numeric:tabular-nums">${n(it.total_price)}&nbsp;DA</td>
      </tr>`).join('')

    const tvaBlock = hasTVA ? `
      <div style="display:flex;justify-content:flex-end;margin-bottom:${fs(10,14)}px">
        <div style="min-width:${fs(220,280)}px">
          ${[['Sous-total HT', n(totalHT) + ' DA'], ['TVA (19%)', n(tva) + ' DA']].map(([l, v]) => `
            <div style="display:flex;justify-content:space-between;padding:${fs(4,6)}px 0;border-bottom:1px solid #e2e8f0">
              <span style="font-size:${fs(11,13)}px;color:#64748b">${l}</span>
              <span style="font-size:${fs(11,13)}px;font-weight:500;color:#1e293b;font-variant-numeric:tabular-nums">${v}</span>
            </div>`).join('')}
        </div>
      </div>` : ''

    const cachetSize = p ? CACHET_PRINT : CACHET_IMAGE
    const totalRow = `
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:${fs(12,16)}px;margin-bottom:${fs(10,14)}px">
        ${addCachet && stampUrl ? cachetImg(cachetSize) : ''}
        <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#0d2340;border-radius:8px;padding:${p ? '12px 18px' : '16px 24px'};text-align:right;min-width:${fs(185,240)}px">
          <div style="font-size:${fs(8,10)}px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.55);margin-bottom:5px">${displayLabel}</div>
          <div style="font-size:${fs(20,27)}px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums">${n(displayTotal)}</div>
          <div style="font-size:${fs(8,10)}px;color:rgba(255,255,255,.4);margin-top:3px">Dinars Algériens (DA)</div>
        </div>
      </div>`

    /* Remarques — toujours affichées si présentes */
    const remarksBlock = quote.remarks ? `
      <div style="margin-top:${fs(13,18)}px;background:#f5f8fc;border:1px solid #e2e8f0;border-radius:7px;padding:${p ? '9px 12px' : '13px 16px'}">
        <div style="font-size:${fs(8,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7f93;margin-bottom:4px">Remarques</div>
        <div style="font-size:${fs(10.5,13)}px;color:#475569;line-height:1.55">${esc(quote.remarks)}</div>
      </div>` : ''

    return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"/><title>${word} ${esc(curNumber)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:12mm 14mm}
@media print{html,body{background:#fff!important;width:100%!important}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a2b3c;background:${p ? '#fff' : '#e8eef5'};${p ? 'width:100%' : 'width:1080px;margin:0 auto'}}
</style></head><body>
<div style="background:#fff;${p ? '' : 'border-radius:6px;overflow:hidden;margin:24px auto;max-width:1040px;box-shadow:0 4px 32px rgba(0,0,0,.1)'}">

  <div style="padding:${p ? '18px 34px 20px' : '26px 48px 28px'};border-bottom:3px solid #1e6fa5;
    display:flex;justify-content:space-between;align-items:flex-start;background:#fff">
    <div>
      <div style="font-size:${fs(16,22)}px;font-weight:800;color:#0d2340">${esc(agency.name)}</div>
      <div style="font-size:${fs(9.5,11.5)}px;color:#6b7f93;line-height:1.75;margin-top:5px">
        ${[agency.address, agency.city, agency.phone, agency.email].filter(Boolean).map(esc).join('<br>')}
      </div>
      ${fiscalBlock}
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:${fs(8,12)}px">
      ${logoUrl ? `<img src="${logoUrl}" crossorigin="anonymous"
        style="width:${fs(52,70)}px;height:${fs(52,70)}px;object-fit:contain;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc" alt="logo"/>` : ''}
      <div style="text-align:right">
        <div style="font-size:${fs(22,30)}px;font-weight:300;color:#1e6fa5;font-style:italic">${word}</div>
        ${sub ? `<div style="font-size:${fs(9,11)}px;color:#94a3b8;margin-top:3px;font-style:italic">${sub}</div>` : ''}
      </div>
    </div>
  </div>

  <div style="background:#f5f8fc;border-bottom:1px solid #e2e8f0;
    padding:${p ? '9px 34px' : '12px 48px'};display:flex;gap:0;flex-wrap:wrap">
    ${metaItems.map((m, i) => `
      <div style="${i > 0 ? `border-left:1px solid #d4dde8;padding-left:${fs(16,22)}px;margin-left:${fs(16,22)}px` : ''}">
        <div style="font-size:${fs(8.5,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7f93">${m.label}</div>
        <div style="font-size:${fs(11,14)}px;font-weight:700;color:#0d2340;margin-top:2px;font-variant-numeric:tabular-nums">${m.val}</div>
      </div>`).join('')}
  </div>

  <div style="padding:${p ? '18px 34px 28px' : '24px 48px 40px'}">
    <div style="display:flex;align-items:center;gap:${fs(10,14)}px;border:1px solid #e2e8f0;border-radius:7px;
      padding:${p ? '8px 12px' : '11px 16px'};margin-bottom:${fs(14,20)}px">
      <div style="width:${fs(26,34)}px;height:${fs(26,34)}px;background:#dbeafe;border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-size:${fs(13,18)}px;flex-shrink:0">👤</div>
      <div>
        <div style="font-size:${fs(8.5,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7f93">
          ${dt === 'facture' ? 'Facturé à' : 'Client'}</div>
        <div style="font-size:${fs(12,15)}px;font-weight:700;color:#0d2340;margin-top:2px">${esc(clientLabel)}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:${fs(14,20)}px">
      <thead><tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#0d2340">
        ${['Description', 'Qté', 'Prix unitaire', 'Prix total'].map((h, i) =>
          `<th style="padding:${fs(7,10)}px 10px;font-size:${fs(8.5,10)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.9);text-align:${i === 0 ? 'left' : 'right'}">${h}</th>`).join('')}
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="4" style="padding:${fs(18,24)}px;text-align:center;color:#94a3b8;font-style:italic;font-size:${fs(10.5,13)}px">Aucune prestation</td></tr>`}</tbody>
    </table>

    ${tvaBlock}
    ${totalRow}

    ${dt === 'devis' ? `<div style="text-align:right;font-size:${fs(9.5,11)}px;color:#64748b;margin-top:${fs(6,10)}px">
      ⏳ Valable jusqu'au <strong style="color:#0d2340">${expDateStr}</strong>
    </div>` : ''}

    ${remarksBlock}
  </div>

  <div style="border-top:1px solid #e2e8f0;padding:${p ? '8px 34px' : '11px 48px'};
    display:flex;justify-content:space-between;background:#f8fafc">
    <span style="font-size:${fs(8.5,10.5)}px;color:#94a3b8">${esc(agency.name)}${agency.city ? ` — ${esc(agency.city)}` : ''}</span>
    <span style="font-size:${fs(8.5,10.5)}px;color:#94a3b8">Émis le ${issueDateStr}</span>
  </div>
</div>
</body></html>`
  }

  /* ══════════════════════════════════════════════════════
     TEMPLATE BON DE VERSEMENT
  ══════════════════════════════════════════════════════ */
  function buildBonHTML(mode: GenMode): string {
    const p  = mode === 'print'
    const fs = (a: number, b: number) => p ? a : b
    const cachetSize = p ? CACHET_PRINT : CACHET_IMAGE

    /* Pas d'étiquettes "EXEMPLAIRE CLIENT / ARCHIVE AGENCE" */
    const renderBon = () => `
    <div style="position:relative;background:#fff;border:.75px solid #d3d1c7;
      border-radius:${fs(5,8)}px;overflow:hidden;${p ? '' : 'box-shadow:0 2px 16px rgba(0,0,0,.07)'}">

      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;
        background:#1a2540;padding:${fs(10,14)}px ${fs(18,24)}px;display:flex;align-items:center;gap:${fs(10,14)}px">
        ${logoUrl ? `<img src="${logoUrl}" crossorigin="anonymous"
          style="width:${fs(40,56)}px;height:${fs(40,56)}px;object-fit:contain;border-radius:6px;background:rgba(255,255,255,.1)" alt="logo"/>` : ''}
        <div>
          <div style="font-size:${fs(13,18)}px;font-weight:700;color:#fff">${esc(agency.name)}</div>
          <div style="font-size:${fs(8,10)}px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-top:2px">
            Agence de voyages &amp; tourisme
          </div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:${fs(11,15)}px;font-weight:700;color:#F0997B;letter-spacing:.08em;text-transform:uppercase">Bon de Versement</div>
          <div style="font-size:${fs(9,11)}px;color:rgba(255,255,255,.45);margin-top:3px">N° ${esc(curNumber)}</div>
        </div>
      </div>

      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;height:2.5px;background:#D85A30"></div>

      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#faf8f4;border-bottom:1px solid #f3f0e8;
        padding:${fs(7,10)}px ${fs(18,24)}px;display:flex;flex-wrap:wrap;gap:0">
        ${[
          { label:'Date',             val: issueDateStr },
          { label:'Bénéficiaire',     val: esc(clientLabel) },
          { label:'Mode de paiement', val: `${PAY_ICONS[payMethod]} ${payMethod}` },
        ].map((m, i) => `
          <div style="${i > 0 ? `border-left:1px solid #e0ddd5;padding-left:${fs(14,20)}px;margin-left:${fs(14,20)}px` : ''}">
            <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:#888780">${m.label}</div>
            <div style="font-size:${fs(10.5,13)}px;font-weight:600;color:#2C2C2A;margin-top:2px">${m.val}</div>
          </div>`).join('')}
      </div>

      <div style="padding:${fs(9,12)}px ${fs(18,24)}px 0">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f3f0e8">
            <th style="padding:${fs(4,6)}px 8px;font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780;text-align:left">Désignation de la prestation</th>
            <th style="padding:${fs(4,6)}px 8px;font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780;text-align:center">Qté</th>
            <th style="padding:${fs(4,6)}px 8px;font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780;text-align:right">Montant (DA)</th>
          </tr></thead>
          <tbody>
            ${items.map((it, i) => `
              <tr style="border-bottom:1px dashed ${i === items.length - 1 ? 'transparent' : '#f3f0e8'}">
                <td style="padding:${fs(5,7)}px 8px;font-size:${fs(9.5,12)}px;color:#2C2C2A;vertical-align:top;line-height:1.4">
                  <span style="display:inline-flex;align-items:center;justify-content:center;
                    width:${fs(15,18)}px;height:${fs(15,18)}px;border-radius:50%;
                    background:#FAECE7;color:#993C1D;font-size:${fs(8,9.5)}px;font-weight:700;
                    margin-right:6px;flex-shrink:0;vertical-align:middle">${i + 1}</span>${esc(it.description)}
                </td>
                <td style="padding:${fs(5,7)}px 8px;font-size:${fs(9.5,12)}px;color:#2C2C2A;text-align:center;vertical-align:top">${it.quantity}</td>
                <td style="padding:${fs(5,7)}px 8px;font-size:${fs(9.5,12)}px;font-weight:600;color:#2C2C2A;text-align:right;font-variant-numeric:tabular-nums;vertical-align:top">${n(it.total_price)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;align-items:stretch;gap:${fs(8,12)}px;padding:${fs(8,12)}px ${fs(18,24)}px ${fs(10,14)}px">
        <div style="flex:1.5;background:#faf8f4;border-radius:6px;padding:${fs(7,10)}px;border:1px solid #D3D1C7;min-height:${fs(44,56)}px">
          <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:#888780;margin-bottom:3px">Remarques</div>
          <div style="font-size:${fs(9,11)}px;color:#2C2C2A;line-height:1.5">${esc(bonNotes || quote.remarks || '')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:${fs(8,12)}px">
          ${addCachet && stampUrl ? cachetImg(cachetSize) : ''}
          <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1a2540;border-radius:7px;
            padding:${fs(9,12)}px ${fs(12,18)}px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;min-width:${fs(120,150)}px">
            <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:rgba(255,255,255,.5);margin-bottom:4px">Montant versé</div>
            <div style="font-size:${fs(17,22)}px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;line-height:1">${n(totalHT)}</div>
            <div style="font-size:${fs(7.5,9)}px;color:#F0997B;margin-top:3px;font-weight:500">Dinars Algériens</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:${p ? '1.5rem' : '2rem'};
        padding:${fs(7,10)}px ${fs(18,24)}px ${fs(10,14)}px;
        border-top:1px dashed #D3D1C7;margin:0 ${fs(6,8)}px">
        ${[{ l:'Signature du client', s:'Lu et approuvé' }, { l:'Cachet &amp; Signature Agence', s:'' }].map(sig => `
          <div style="flex:1">
            <div style="font-size:${fs(7.5,9)}px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780">${sig.l}</div>
            ${sig.s ? `<div style="font-size:${fs(7,8.5)}px;color:#888780;font-style:italic;margin-top:1px">${sig.s}</div>` : ''}
            <div style="height:1px;background:#D3D1C7;margin-top:${fs(22,30)}px"></div>
          </div>`).join('')}
      </div>

      <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f3f0e8;border-top:1px solid #D3D1C7;
        padding:${fs(6,9)}px ${fs(18,24)}px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:${fs(8.5,10.5)}px;font-weight:600;color:#2d3a5a">${esc(agency.name)}</div>
          ${(agency.address || agency.city) ? `<div style="font-size:${fs(7.5,9)}px;color:#888780">${[agency.address, agency.city].filter(Boolean).map(esc).join(', ')}</div>` : ''}
        </div>
        <div style="text-align:right;font-size:${fs(7.5,9)}px;color:#888780;line-height:1.5">
          ${[agency.phone, agency.email].filter(Boolean).map(esc).join('<br>')}
        </div>
      </div>
    </div>`

    /* Print → 2 copies séparées par une ligne pointillée (sans étiquettes) */
    const body = p
      ? renderBon() + `<div style="margin:10px 0;border-top:2px dashed #D3D1C7"></div>` + renderBon()
      : renderBon()

    return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"/><title>Bon de Versement ${esc(curNumber)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:8mm 10mm}
@media print{html,body{background:#fff!important;width:100%!important}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#2C2C2A;
  background:${p ? '#fff' : '#f0ede8'};${p ? 'width:100%' : 'width:1080px;margin:0 auto'}}
</style></head>
<body><div style="${p ? '' : 'padding:24px;max-width:1080px;margin:0 auto'}">${body}</div></body></html>`
  }

  function getHTML(mode: GenMode): string {
    if (docType === 'bon') return buildBonHTML(mode)
    return buildBaseHTML(mode, docType as 'devis' | 'proforma' | 'facture')
  }

  async function generatePDF() {
    await saveDocType()
    setGenerating(true); setDone(null)
    const win = window.open('', '_blank', 'width=960,height=800')
    if (!win) { alert('Autorisez les popups pour ce site.'); setGenerating(false); return }
    win.document.write(getHTML('print'))
    win.document.close()
    await new Promise(r => setTimeout(r, 1200))
    win.print()
    setDone('pdf'); setGenerating(false)
  }

  function buildMobileHTML(): string {
    const esc2 = (s?: string|null) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  
    const hasTVA2 = docType==='facture'||docType==='proforma'
    const dispTotal = hasTVA2 ? totalTTC : totalHT
    const word2 = {devis:'Devis',proforma:'Facture Proforma',facture:'Facture',bon:'Bon de Versement'}[docType]
  
    const itemCards = items.map((it,i) => `
      <div style="background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;
        border-left:4px solid #1e6fa5;box-shadow:0 2px 10px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
          color:#1e6fa5;margin-bottom:6px">Prestation ${i+1}</div>
        <div style="font-size:13px;color:#1a2b3c;line-height:1.5;margin-bottom:10px">${esc2(it.description)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:12px;color:#6b7f93;background:#f5f8fc;border-radius:20px;padding:3px 10px">
            Qté : ${it.quantity}
          </div>
          <div style="font-size:20px;font-weight:800;color:#0d2340;font-variant-numeric:tabular-nums">
            ${n(it.total_price)} <span style="font-size:12px;font-weight:500;color:#6b7f93">DA</span>
          </div>
        </div>
      </div>`).join('')
  
    return `<!DOCTYPE html><html lang="fr"><head>
  <meta charset="UTF-8"/>
  <style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#0d2340;width:750px;color:#1a2b3c}
  </style></head><body>
  <div style="width:750px;background:#0d2340;overflow:hidden">
  
    <!-- En-tête agence -->
    <div style="background:linear-gradient(145deg,#0d2340 0%,#1a3a6e 100%);
      padding:36px 40px 28px;text-align:center;position:relative">
      <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;
        border-radius:50%;background:rgba(255,255,255,0.03)"></div>
      ${logoUrl?`<img src="${logoUrl}" crossorigin="anonymous"
        style="width:70px;height:70px;object-fit:contain;border-radius:14px;
        border:2px solid rgba(255,255,255,0.15);margin-bottom:14px;background:rgba(255,255,255,0.08)"/>`:''}
      <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.5px">${esc2(agency.name)}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;line-height:1.7">
        ${[agency.address,agency.city,agency.phone].filter(Boolean).map(esc2).join(' · ')}
      </div>
    </div>
  
    <!-- Type de document -->
    <div style="background:#1e6fa5;padding:14px 40px;text-align:center">
      <div style="font-size:28px;font-weight:300;color:#fff;font-style:italic;letter-spacing:-0.3px">${word2}</div>
      ${docType==='devis'?`<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;font-style:italic">
        Valable ${validity} jours — sous réserve de disponibilité</div>`:''}
      ${docType==='proforma'?`<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px">Document provisoire — non fiscal</div>`:''}
    </div>
  
    <!-- Barre N° + Date -->
    <div style="background:#0f2c5c;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.4);margin-bottom:4px">N° Document</div>
        <div style="font-size:20px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums">${esc2(curNumber)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.4);margin-bottom:4px">Émis le</div>
        <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.8)">${issueDateStr}</div>
      </div>
    </div>
  
    <!-- Client -->
    <div style="background:#fff;padding:18px 32px;border-bottom:3px solid #f5f8fc">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:6px">
        ${docType==='facture'?'Facturé à':'Client'}
      </div>
      <div style="font-size:20px;font-weight:700;color:#0d2340">${esc2(clientLabel.split(' · ')[0])}</div>
      ${clientLabel.includes(' · ')?`<div style="font-size:14px;color:#6b7f93;margin-top:3px">${esc2(clientLabel.split(' · ')[1])}</div>`:''}
    </div>
  
    <!-- Prestations -->
    <div style="background:#f5f8fc;padding:16px 24px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#6b7f93;margin-bottom:12px;font-weight:600">
        ${items.length} Prestation${items.length>1?'s':''}
      </div>
      ${itemCards}
    </div>
  
    <!-- TVA (si facture/proforma) -->
    ${hasTVA2?`
    <div style="background:#fff;padding:14px 32px;border-top:1px solid #f0f0f0">
      ${[['Sous-total HT',n(totalHT)+' DA'],['TVA 19%',n(tva)+' DA']].map(([l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f5f5">
          <span style="font-size:13px;color:#6b7f93">${l}</span>
          <span style="font-size:13px;font-weight:500;color:#1a2b3c;font-variant-numeric:tabular-nums">${v}</span>
        </div>`).join('')}
    </div>`:''}
  
    <!-- Total -->
    <div style="background:#0d2340;padding:28px 32px;text-align:center;position:relative">
      ${addCachet&&stampUrl?`<div style="position:absolute;left:24px;top:50%;transform:translateY(-50%)">
        <img src="${stampUrl}" crossorigin="anonymous" style="width:64px;height:64px;object-fit:contain;opacity:0.85"/></div>`:''}
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:10px">
        ${docType==='facture'?'TOTAL TTC':'TOTAL'}
      </div>
      <div style="font-size:48px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1;font-variant-numeric:tabular-nums">
        ${n(dispTotal)}
      </div>
      <div style="font-size:14px;color:rgba(255,255,255,0.4);margin-top:8px">Dinars Algériens (DA)</div>
    </div>
  
    <!-- Validité + remarques -->
    <div style="background:#0f2c5c;padding:16px 32px">
      ${docType==='devis'?`
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:${quote.remarks?'12px':'0'}">
        <span style="font-size:13px;color:rgba(255,255,255,0.5)">⏳ Valable jusqu'au</span>
        <span style="font-size:14px;font-weight:700;color:#E8956A">${expDateStr}</span>
      </div>`:''}
      ${quote.remarks?`
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px 14px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.35);margin-bottom:6px">Remarques</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.55">${esc2(quote.remarks)}</div>
      </div>`:''}
    </div>
  
    <!-- Footer -->
    <div style="background:#08172a;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:11px;color:rgba(255,255,255,0.3)">${esc2(agency.name)}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:right">
        ${[agency.phone,agency.email].filter(Boolean).map(esc2).join(' · ')}
      </div>
    </div>
  </div>
  </body></html>`
  }
  
  async function generateImage() {
    await saveDocType()
    setGenerating(true); setDone(null)
    try {
      const html2canvas = (await import('html2canvas')).default
      const iframe = document.createElement('iframe')
      // 750px = format portrait mobile
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:750px;height:4000px;border:none;visibility:hidden;'
      document.body.appendChild(iframe)
      const iDoc = iframe.contentDocument!
      iDoc.open()
      iDoc.write(buildMobileHTML())
      iDoc.close()
      await new Promise(r => setTimeout(r, 1800))
      const target = iDoc.body.firstElementChild as HTMLElement || iDoc.body
      const canvas = await html2canvas(target, {
        scale: 2,           // 1500px output — net sur tous les écrans
        useCORS: true, allowTaint: true, backgroundColor: '#0d2340',
        logging: false, windowWidth: 750, imageTimeout: 12000,
      })
      document.body.removeChild(iframe)
      const link = document.createElement('a')
      link.download = `${currentTab.label.replace(/\s+/g,'_')}_${curNumber.replace('/','_')}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.88)
      link.click()
      setDone('img')
    } catch(err) { console.error(err); alert("Erreur lors de la génération.") }
    setGenerating(false)
  }

  const cfg    = DOC_TYPE_CONFIG[currentTab.dbKey]
  const logoOk = !!logoUrl

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'0.75rem' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:500, maxHeight:'94vh', overflowY:'auto',
        borderRadius:'1.25rem', background:'#fff', border:'1px solid #e5e7eb',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)', color:'#111827',
        fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

        <div style={{ position:'sticky', top:0, zIndex:2, padding:'1rem 1.25rem', borderBottom:'1px solid #e5e7eb',
          background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontWeight:700, fontSize:'0.9375rem', color:'#111827' }}>📤 Partager / Convertir</h2>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              <span style={{ fontSize:'0.75rem', color:'#6b7280', fontVariantNumeric:'tabular-nums' }}>{curNumber}</span>
              <DocTypeBadge type={quote.document_type || 'devis'} size="sm" />
              {isChanged && <span style={{ fontSize:'0.6875rem', color:'#f59e0b', fontStyle:'italic' }}>→ {currentTab.label}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ padding:'0.25rem 0.5rem', borderRadius:'0.375rem',
            border:'1px solid #e5e7eb', background:'#f3f4f6', cursor:'pointer', fontSize:'1rem', color:'#374151' }}>✕</button>
        </div>

        <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>

          <div>
            <div style={{ fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'#6b7280', marginBottom:'0.5rem' }}>
              Type de document
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
              {DOC_TABS.map(tab => {
                const tc = DOC_TYPE_CONFIG[tab.dbKey]; const active = docType === tab.id
                return (
                  <button key={tab.id} onClick={() => { setDocType(tab.id); setDone(null) }}
                    style={{ padding:'0.6rem 0.75rem', borderRadius:'0.625rem', cursor:'pointer',
                      textAlign:'left', fontSize:'0.8125rem', fontWeight:active ? 700 : 500,
                      border:`2px solid ${active ? tc.border : '#e5e7eb'}`,
                      background:active ? tc.bg : '#f9fafb',
                      color:active ? tc.color : '#374151', transition:'all 0.15s' }}>
                    {tab.icon} {tab.label}
                    {tab.dbKey === (quote.document_type || 'devis') && (
                      <span style={{ marginLeft:4, fontSize:'0.625rem', opacity:0.6 }}>●</span>
                    )}
                  </button>
                )
              })}
            </div>
            {isChanged && (
              <button onClick={saveDocType} disabled={saving}
                style={{ marginTop:'0.5rem', width:'100%', padding:'0.5rem',
                  borderRadius:'0.625rem', cursor:saving ? 'wait' : 'pointer',
                  fontSize:'0.8125rem', fontWeight:600,
                  background:saved ? '#d1fae5' : cfg.bg,
                  color:saved ? '#065f46' : cfg.color,
                  border:`1.5px solid ${saved ? '#6ee7b7' : cfg.border}`, transition:'all 0.2s' }}>
                {saving ? '⏳ Sauvegarde...' : saved ? `✅ Converti → "${currentTab.label}" (${curNumber})` : `💾 Sauvegarder → "${currentTab.label}"`}
              </button>
            )}
          </div>

          {docType === 'bon' && (
            <div style={{ background:'#fdf8f5', border:'1px solid #fde8d8', borderRadius:'0.75rem', padding:'0.875rem 1rem' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'#92400e', marginBottom:'0.625rem' }}>
                💳 Paramètres du bon
              </div>
              <div style={{ fontSize:'0.75rem', fontWeight:500, color:'#6b7280', marginBottom:'0.375rem' }}>Mode de paiement</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.375rem', marginBottom:'0.625rem' }}>
                {PAY_METHODS.map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    style={{ padding:'0.375rem 0.625rem', borderRadius:'0.5rem', cursor:'pointer',
                      fontSize:'0.8125rem', fontWeight:payMethod === m ? 700 : 400,
                      border:`1.5px solid ${payMethod === m ? '#D85A30' : '#e5e7eb'}`,
                      background:payMethod === m ? '#FAECE7' : '#fff',
                      color:payMethod === m ? '#993C1D' : '#374151' }}>
                    {PAY_ICONS[m]} {m}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:'0.75rem', fontWeight:500, color:'#6b7280', marginBottom:'0.25rem' }}>Remarques</div>
              <textarea value={bonNotes} onChange={ev => setBonNotes(ev.target.value)} rows={2}
                placeholder="Observations, conditions…"
                style={{ width:'100%', padding:'0.5rem 0.625rem', borderRadius:'0.5rem',
                  border:'1px solid #e5e7eb', background:'#fff', fontSize:'0.8125rem',
                  resize:'none', outline:'none', fontFamily:'inherit', color:'#111827' }} />
            </div>
          )}

          <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer',
            padding:'0.625rem 0.875rem', borderRadius:'0.625rem',
            border:`1.5px solid ${addCachet ? '#0d2340' : '#e5e7eb'}`,
            background:addCachet ? '#eff6ff' : '#f9fafb', transition:'all 0.15s' }}>
            <input type="checkbox" checked={addCachet} onChange={e => setAddCachet(e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer', flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'0.8125rem', fontWeight:600, color:addCachet ? '#0d2340' : '#374151' }}>
                🔵 Ajouter le cachet (4 cm, à gauche du total)
              </div>
              {stampUrl
                ? <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                    <img src={stampUrl} style={{ width:24, height:24, objectFit:'contain' }} alt="Cachet" />
                    <span style={{ fontSize:'0.6875rem', color:'#059669' }}>✅ Cachet configuré — sans bordure, taille réelle 4 cm</span>
                  </div>
                : <div style={{ fontSize:'0.6875rem', color:'#f59e0b', marginTop:3 }}>
                    ⚠️ Aucun cachet — <Link href="/settings" style={{ color:'#0d2340', fontWeight:600 }}>⚙️ Paramètres</Link> → URL du Cachet
                  </div>}
            </div>
          </label>

          <div style={{ background:logoOk ? '#f0fdf4' : '#fffbeb', border:`1px solid ${logoOk ? '#bbf7d0' : '#fde68a'}`,
            borderRadius:'0.625rem', padding:'0.5rem 0.875rem', fontSize:'0.8125rem',
            color:logoOk ? '#166534' : '#92400e' }}>
            {logoOk ? '✅ Logo configuré — visible dans le document'
              : <span>⚠️ Pas de logo · <Link href="/settings" style={{ color:'#0d2340', fontWeight:600 }}>⚙️ Paramètres</Link></span>}
          </div>

          <button onClick={generatePDF} disabled={generating}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.75rem', background:'#0f2c5c',
              color:'#fff', border:'none', cursor:generating ? 'wait' : 'pointer', fontWeight:700,
              fontSize:'0.9375rem', opacity:generating ? 0.6 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating ? '⏳ Génération...' : '📄 PDF A4 (impression → Enregistrer)'}
          </button>
          <button onClick={generateImage} disabled={generating}
            style={{ width:'100%', padding:'0.875rem', borderRadius:'0.75rem', background:'#0f766e',
              color:'#fff', border:'none', cursor:generating ? 'wait' : 'pointer', fontWeight:700,
              fontSize:'0.9375rem', opacity:generating ? 0.6 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating ? '⏳ Génération...' : '🖼️ Image 1080 px (WhatsApp / Email)'}
          </button>

          {done && (
            <div style={{ background:'#d1fae5', borderRadius:'0.625rem', padding:'0.75rem 1rem',
              fontSize:'0.875rem', color:'#065f46', fontWeight:500, textAlign:'center' }}>
              {done === 'pdf'
                ? "✅ Fenêtre ouverte — activer \"Graphiques d'arrière-plan\" → Enregistrer PDF"
                : `✅ Image ${currentTab.label} téléchargée !`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
