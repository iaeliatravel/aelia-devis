'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',        icon: '📋', label: 'Devis' },
  { href: '/new',     icon: '➕', label: 'Nouveau' },
  { href: '/stats',   icon: '📊', label: 'Stats',   disabled: true },
  { href: '/settings',icon: '⚙️', label: 'Réglages', disabled: true },
]

export default function MobileNav() {
  const path = usePathname()

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Navigation mobile">
      {NAV_ITEMS.map(item => (
        item.disabled ? (
          <button key={item.href} className="mobile-nav-item" disabled
            style={{ opacity: 0.4, cursor: 'not-allowed' }}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ) : (
          <Link key={item.href} href={item.href}
            className={`mobile-nav-item ${path === item.href ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        )
      ))}
    </nav>
  )
}
