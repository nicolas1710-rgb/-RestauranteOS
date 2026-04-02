import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RestaurantOS — Sistema de pedidos',
  description: 'Sistema de automatización de pedidos para restaurantes',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
