'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateQuoteNumber } from '@/lib/quotes'
import QuoteEditor from '@/components/QuoteEditor'

export default function NouveauDevisPage() {
  const router = useRouter()

  async function handleCreate(_: string | null, clientName: string, clientPhone: string) {
    /* Nom par défaut : N/A si rien n'est saisi */
    const name  = clientName.trim()  || 'N/A'
    const phone = clientPhone.trim() || null

    const quoteNumber = await generateQuoteNumber('devis')

    /* Créer le client */
    const { data: client } = await supabase
      .from('clients')
      .insert({ name, phone })
      .select()
      .single()

    const clientId = client?.id ?? null

    /* Créer le devis */
    const { data, error } = await supabase.from('quotes').insert({
      quote_number:  quoteNumber,
      document_type: 'devis',
      issue_date:    new Date().toISOString().split('T')[0],
      validity_days: 7,
      client_id:     clientId,
      status:        'draft',
      total_cost:    0,
      total_client:  0,
      profit:        0,
    }).select().single()

    if (!error && data) router.push(`/devis/${data.id}`)
  }

  return <QuoteEditor mode="new" onCreate={handleCreate} />
}
