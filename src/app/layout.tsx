import type { Metadata } from 'next'
import './globals.css'
import ServiceNav from '@/components/ServiceNav'

export const metadata: Metadata = {
  title: 'Aelia Travel — Espace de travail',
  description: 'Gestion des documents et services — AELIA TRAVEL AGENCY',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#1C1A17"/>
      </head>
      <body style={{ margin:0, padding:0 }}>
        <ServiceNav />
        <div id="page-content">
          {children}
        </div>
      </body>
    </html>
  )
}
