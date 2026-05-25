import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aelia Travel — Gestion des Devis',
  description: 'Application de gestion des devis de voyage pour agences touristiques',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  )
}
