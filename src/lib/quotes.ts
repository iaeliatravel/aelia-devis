import { supabase } from './supabase'
import { Quote, QuoteItem } from '@/types/database'

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

export async function generateQuoteNumber(): Promise<string> {
  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .order('created_at', { ascending: false })
    .limit(1)

  const lastNum = data?.[0]?.quote_number ? parseInt(data[0].quote_number.split('/')[0]) : 0
  const newNum = String(lastNum + 1).padStart(3, '0')
  const year = new Date().getFullYear()
  return `${newNum}/${year}`
}

export function calcItemTotals(item: Partial<QuoteItem>): Partial<QuoteItem> {
  const quantity = item.quantity || 1
  const unitCost = item.unit_cost || 0
  const marginPct = item.margin_pct || 0

  const unitPrice = unitCost * (1 + marginPct / 100)
  const totalCost = unitCost * quantity
  const totalPrice = unitPrice * quantity
  const profit = totalPrice - totalCost

  return {
    ...item,
    quantity,
    unit_cost: unitCost,
    margin_pct: marginPct,
    unit_price: Math.round(unitPrice * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    total_price: Math.round(totalPrice * 100) / 100,
    profit: Math.round(profit * 100) / 100,
  }
}

export function calcQuoteTotals(items: QuoteItem[]) {
  const total_cost = items.reduce((sum, i) => sum + (i.total_cost || 0), 0)
  const total_client = items.reduce((sum, i) => sum + (i.total_price || 0), 0)
  const profit = items.reduce((sum, i) => sum + (i.profit || 0), 0)

  return {
    total_cost: Math.round(total_cost * 100) / 100,
    total_client: Math.round(total_client * 100) / 100,
    profit: Math.round(profit * 100) / 100,
  }
}
