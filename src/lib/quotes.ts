import { supabase } from './supabase'
import { Quote, QuoteItem, DocumentType } from '@/types/database'

export async function getQuotes(): Promise<Quote[]> {
  const { data } = await supabase
    .from('quotes')
    .select('*, client:clients(*), items:quote_items(*)')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { data } = await supabase
    .from('quotes')
    .select('*, client:clients(*), items:quote_items(*)')
    .eq('id', id)
    .single()
  return data
}

/** Préfixes par type de document */
export const DOC_PREFIX: Record<DocumentType, string> = {
  devis:         'D',
  proforma:      'P',
  facture:       'F',
  bon_versement: 'B',
}

/**
 * Génère un numéro unique par catégorie.
 * Format : D001/2026, P001/2026, F001/2026, B001/2026
 */
export async function generateQuoteNumber(docType: DocumentType = 'devis'): Promise<string> {
  const prefix = DOC_PREFIX[docType]
  const year   = new Date().getFullYear()

  // Chercher le dernier numéro de cette catégorie pour l'année en cours
  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .like('quote_number', `${prefix}%/${year}`)
    .order('created_at', { ascending: false })
    .limit(1)

  let lastNum = 0
  if (data?.[0]?.quote_number) {
    // Format attendu : D001/2026 → extraire "001"
    const match = data[0].quote_number.match(/^[A-Z](\d+)\//)
    if (match) lastNum = parseInt(match[1], 10)
  }

  const seq = String(lastNum + 1).padStart(3, '0')
  return `${prefix}${seq}/${year}`
}

export function calcItemTotals(item: Partial<QuoteItem>): Partial<QuoteItem> {
  const quantity   = item.quantity   || 1
  const unitCost   = item.unit_cost  || 0
  const marginPct  = item.margin_pct || 0

  const unitPrice  = unitCost * (1 + marginPct / 100)
  const totalCost  = unitCost * quantity
  const totalPrice = unitPrice * quantity
  const profit     = totalPrice - totalCost

  return {
    ...item,
    quantity,
    unit_cost:   unitCost,
    margin_pct:  marginPct,
    unit_price:  Math.round(unitPrice  * 100) / 100,
    total_cost:  Math.round(totalCost  * 100) / 100,
    total_price: Math.round(totalPrice * 100) / 100,
    profit:      Math.round(profit     * 100) / 100,
  }
}

export function calcQuoteTotals(items: QuoteItem[]) {
  const total_cost   = items.reduce((s, i) => s + (i.total_cost  || 0), 0)
  const total_client = items.reduce((s, i) => s + (i.total_price || 0), 0)
  const profit       = items.reduce((s, i) => s + (i.profit      || 0), 0)

  return {
    total_cost:   Math.round(total_cost   * 100) / 100,
    total_client: Math.round(total_client * 100) / 100,
    profit:       Math.round(profit       * 100) / 100,
  }
}

/** Bénéfice effectif : manuel si activé, sinon calculé */
export function effectiveProfit(q: Quote): number {
  return (q.manual_profit_enabled && q.manual_profit != null)
    ? q.manual_profit
    : (q.profit || 0)
}
