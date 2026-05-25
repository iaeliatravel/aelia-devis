'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateQuoteNumber } from '@/lib/quotes'
import QuoteEditor from '@/components/QuoteEditor'

export default function NouveauDevisPage() {
  const router = useRouter()

  async function handleCreate(_: string|null, clientName: string, clientPhone: string) {
    const quoteNumber = await generateQuoteNumber()
    let clientId: string|null = null
    if (clientName.trim()) {
      const { data } = await supabase.from('clients')
        .insert({ name:clientName.trim(), phone:clientPhone.trim()||null })
        .select().single()
      clientId = data?.id ?? null
    }
    const { data, error } = await supabase.from('quotes').insert({
      quote_number:quoteNumber, issue_date:new Date().toISOString().split('T')[0],
      validity_days:7, client_id:clientId, status:'draft',
      total_cost:0, total_client:0, profit:0,
    }).select().single()
    if (!error && data) router.push(`/devis/${data.id}`)
  }

  return <QuoteEditor mode="new" onCreate={handleCreate} />
}
