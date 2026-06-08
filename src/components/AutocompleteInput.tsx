'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSuggestions } from '@/lib/suggestions'

/* ── Suggestions locales de secours ── */
const LOCAL: Record<string, string[]> = {
  hotel: [
    'Abou Sofiane','El Aurassi','Sofitel Algiers','Sheraton Club des Pins',
    'Mercure Alger','Hilton Garden Inn','Radisson Blu','Novotel',
    'Blumar Resort','Nesrine','Lella Baya','Vincci Nour Baya','Iberostar Hammamet',
    'Marriott','Hilton','Conrad','JW Marriott','Four Seasons','Intercontinental',
    'Sheraton','Grand Hyatt','Rotana','Le Méridien','Waldorf Astoria',
    'Dukes Dubai','Mövenpick','Habtoor Grand','Jumeirah','Palazzo Versace',
    'Madinah Hilton','Pullman ZamZam','Swissotel Al Maqam','Clock Tower',
  ],
  city: [
    'Alger','Oran','Constantine','Annaba','Tlemcen','Sétif','Béjaïa','Blida',
    'Paris','Lyon','Marseille','Nice','Bordeaux','Toulouse',
    'Istanbul','Ankara','Antalya','Bodrum','Izmir',
    'Dubaï','Abu Dhabi','Sharjah','Ras Al-Khaïmah',
    'Le Caire','Alexandrie','Hurghada','Charm el-Cheikh',
    'Hammamet','Tunis','Sousse','Djerba','Monastir',
    'Marrakech','Casablanca','Fès','Agadir','Rabat',
    'Rome','Milan','Venise','Florence','Naples',
    'Madrid','Barcelone','Séville',
    'Doha','Koweït','Mascate','Amman','Beyrouth',
    'La Mecque','Médine','Riyad','Djedda',
    'Bangkok','Bali','Singapour','Kuala Lumpur','Tokyo',
    'New York','Miami','Los Angeles',
    'Moscou','Saint-Pétersbourg',
  ],
  country: [
    'Algérie','Tunisie','Maroc','Mauritanie','Libye',
    'France','Espagne','Italie','Allemagne','Belgique','Suisse','Portugal','Pays-Bas',
    'Turquie','Grèce','Chypre','Malte',
    'Émirats arabes unis','Arabie Saoudite','Qatar','Koweït','Bahreïn','Oman','Jordanie',
    'Égypte','Liban','Syrie',
    'Thaïlande','Indonésie','Malaisie','Singapour','Japon','Chine','Corée du Sud',
    'États-Unis','Canada','Mexique',
    'Russie','Ukraine','Turquie',
    'Sénégal','Côte d Ivoire','Madagascar','Éthiopie',
    'Inde','Pakistan',
  ],
  airline: [
    'Air Algérie','Saudia','Turkish Airlines','Air France','Emirates',
    'Qatar Airways','Etihad','Flydubai','Air Arabia','Tunisair',
    'Royal Air Maroc','EgyptAir','British Airways','Lufthansa',
    'Swiss Air','Iberia','Alitalia','Brussels Airlines',
  ],
  vehicle_type: [
    'Minibus 8 places','Van 6 places','Berline','Bus 30 places',
    'Bus 50 places','4×4','Limousine',
  ],
}

interface Props {
  value: string
  onChange: (v: string) => void
  category: string
  placeholder?: string
  label?: string
  required?: boolean
}

export default function AutocompleteInput({ value, onChange, category, placeholder = '', label, required }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen,      setIsOpen]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [rect,        setRect]        = useState<DOMRect | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  /* Recalculer la position du dropdown à chaque ouverture + resize/scroll */
  const updateRect = useCallback(() => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [isOpen, updateRect])

  /* Charger les suggestions */
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!value.trim()) { setSuggestions([]); setIsOpen(false); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      updateRect()

      /* 1. Suggestions locales (instantané) */
      const local = (LOCAL[category] || [])
        .filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
        .slice(0, 6)

      /* 2. Suggestions Supabase (depuis l'historique) */
      let remote: string[] = []
      try {
        remote = await getSuggestions(category, value)
      } catch { /* ignore */ }

      /* Fusionner sans doublons */
      const merged = Array.from(new Set([...remote, ...local])).slice(0, 8)
      setSuggestions(merged)
      if (merged.length > 0) setIsOpen(true)
      setLoading(false)
    }, 200)

    return () => clearTimeout(timerRef.current)
  }, [value, category, updateRect])

  function handleSelect(s: string) {
    onChange(s)
    setIsOpen(false)
    setSuggestions([])
  }

  const lbl: React.CSSProperties = {
    fontSize:'0.75rem', fontWeight:500, display:'block',
    marginBottom:'0.25rem', color:'var(--color-text-muted)',
  }
  const inpStyle: React.CSSProperties = {
    width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem',
    fontSize:'0.875rem', outline:'none',
    border:'1px solid var(--color-border)', background:'var(--color-surface)',
    color:'var(--color-text)', fontFamily:'inherit',
    paddingRight: loading ? '2rem' : '0.75rem',
  }

  return (
    <div style={{ position:'relative' }}>
      {label && (
        <label style={lbl}>
          {label} {required && <span style={{ color:'var(--color-error)' }}>*</span>}
        </label>
      )}
      <div style={{ position:'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); updateRect() }}
          onFocus={() => { updateRect(); if (suggestions.length > 0) setIsOpen(true) }}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          style={inpStyle}
          autoComplete="off"
        />
        {loading && (
          <span style={{ position:'absolute', right:'0.5rem', top:'50%',
            transform:'translateY(-50%)', color:'var(--color-text-muted)', fontSize:'0.875rem' }}>⟳</span>
        )}
      </div>

      {/* Dropdown — position:fixed pour éviter le clipping des parents overflow:hidden/auto */}
      {isOpen && suggestions.length > 0 && rect && (
        <div
          style={{
            position:'fixed',
            top: rect.bottom + 2,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            borderRadius:'0.5rem',
            boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
            maxHeight:'12rem',
            overflowY:'auto',
            background:'#ffffff',
            border:'1px solid #e5e7eb',
          }}
        >
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); handleSelect(s) }}
              style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'0.5rem 0.75rem', fontSize:'0.875rem',
                border:'none', borderBottom:'1px solid #f3f4f6',
                background:'transparent', cursor:'pointer', fontFamily:'inherit',
                color:'#111827',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
