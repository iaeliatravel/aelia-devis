'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getQuote } from '@/lib/quotes'
import { Quote } from '@/types/database'
import QuoteEditor from '@/components/QuoteEditor'

export default function DevisPage() {
  const { id } = useParams() as { id: string }
  const [quote, setQuote]   = useState<Quote|null>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    getQuote(id).then(q=>{ setQuote(q); setLoading(false) })
  },[id])

  if (loading) return (
    <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      {[...Array(8)].map((_,i)=><div key={i} className="skeleton" style={{ height:64 }} />)}
    </div>
  )
  if (!quote) return (
    <div style={{ padding:'2rem', textAlign:'center', color:'var(--color-text-muted)' }}>Devis introuvable.</div>
  )
  return <QuoteEditor mode="edit" quote={quote} />
}
