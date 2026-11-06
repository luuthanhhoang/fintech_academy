import type { Metadata, Viewport } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { getContent } from '@/lib/content/server'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

export function generateMetadata(): Metadata {
  const { site } = getContent().config
  return { title: { default: site.name, template: `%s · ${site.name}` }, description: site.tagline }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef2ee' },
    { media: '(prefers-color-scheme: dark)', color: '#111714' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const { config, tracks } = getContent()
  const lines = [...tracks].sort((a, b) => a.order - b.order).map((t) => ({ id: t.id, color: t.color }))
  // Each track's line colour is a CSS variable (--line-<track>) so any component can draw that track's line.
  const vars = Object.fromEntries(lines.map((l) => [`--line-${l.id}`, l.color])) as CSSProperties
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased" style={vars}>
        <AppShell site={config.site} shortcuts={config.shortcuts} lines={lines}>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
