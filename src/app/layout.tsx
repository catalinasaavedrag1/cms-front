import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'CMS Web · Comercial Web',
  description: 'CMS enterprise para la vitrina digital B2C/B2B',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
