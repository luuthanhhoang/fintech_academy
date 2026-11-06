'use client'

import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'
import { useMemo, useState, type ReactNode } from 'react'
import type { Shortcut, SiteConfig } from '@/lib/content/schema/config'
import { CatalogProvider } from '@/components/data/catalog-provider'
import { HelpDialog } from './help-dialog'
import { useShortcuts } from './shortcuts'
import { StudyTimer } from './study-timer'
import { MobileTabs, TopBar, type Line } from './topbar'

const SearchDialog = dynamic(() => import('@/components/search/search-dialog').then((m) => m.SearchDialog), { ssr: false })

function ShellInner({ site, shortcuts, lines, children }: { site: SiteConfig; shortcuts: Shortcut[]; lines: Line[]; children: ReactNode }) {
  const [search, setSearch] = useState(false)
  const [help, setHelp] = useState(false)
  const handlers = useMemo(() => ({ openSearch: () => setSearch(true), showHelp: () => setHelp(true) }), [])
  useShortcuts(shortcuts, handlers)
  return (
    <div className="flex min-h-dvh flex-col [--topbar:3.5rem]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:p-2">
        Bỏ qua tới nội dung chính
      </a>
      <TopBar site={site} lines={lines} onSearch={() => setSearch(true)} />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 pt-8 sm:px-6 md:pb-20 lg:px-8 lg:pt-14">
        {children}
      </main>
      <footer className="mx-auto mb-20 flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-6 text-xs text-ink-3 sm:px-6 md:mb-0 lg:px-8">
        <p>{site.disclaimer}</p>
        <button type="button" onClick={() => setHelp(true)} className="underline">
          Phím tắt (?)
        </button>
      </footer>
      <MobileTabs site={site} />
      <HelpDialog shortcuts={shortcuts} open={help} onClose={() => setHelp(false)} />
      {search && <SearchDialog open={search} onClose={() => setSearch(false)} />}
      <StudyTimer />
    </div>
  )
}

export function AppShell(props: { site: SiteConfig; shortcuts: Shortcut[]; lines: Line[]; children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CatalogProvider>
        <ShellInner {...props} />
      </CatalogProvider>
    </ThemeProvider>
  )
}
