import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
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
    { media: '(prefers-color-scheme: light)', color: '#fbfaf6' },
    { media: '(prefers-color-scheme: dark)', color: '#191917' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const { site, shortcuts } = getContent().config
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased">
        <AppShell site={site} shortcuts={shortcuts}>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
