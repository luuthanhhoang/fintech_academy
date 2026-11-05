'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { useMemo, useState, type ReactNode } from 'react'
import type { Shortcut, SiteConfig } from '@/lib/content/schema/config'
import { CatalogProvider } from '@/components/data/catalog-provider'
import { FocusPill } from '@/components/focus/focus-pill'
import { FocusProvider } from '@/components/focus/focus-provider'
import { HelpDialog } from './help-dialog'
import { MenuSheet } from './menu-sheet'
import { MobileHeader, MobileNav, Sidebar } from './nav'
import { useShortcuts } from './shortcuts'
import { StudyTimer } from './study-timer'
import { ThemeToggle } from './theme-toggle'

const SearchDialog = dynamic(() => import('@/components/search/search-dialog').then((m) => m.SearchDialog), { ssr: false })

function ShellInner({ site, shortcuts, children }: { site: SiteConfig; shortcuts: Shortcut[]; children: ReactNode }) {
  const [search, setSearch] = useState(false)
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const handlers = useMemo(() => ({ openSearch: () => setSearch(true), showHelp: () => setHelp(true) }), [])
  useShortcuts(shortcuts, handlers)
  // Full-bleed pages (the 3D village) opt out of the reading column.
  const fullBleed = usePathname().startsWith('/village')
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:p-2">
        Bỏ qua tới nội dung chính
      </a>
      <Sidebar site={site} onSearch={() => setSearch(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader site={site} onSearch={() => setSearch(true)} onMenu={() => setMenu(true)} />
        <main id="main" className={fullBleed ? 'w-full flex-1 pb-16 lg:pb-0' : 'mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10'}>
          {children}
        </main>
        <footer className="mx-auto mb-20 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-5 text-xs text-ink-3 sm:px-6 lg:mb-0 lg:px-10">
          <p>{site.disclaimer}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setHelp(true)} className="underline">
              Phím tắt (?)
            </button>
            <ThemeToggle />
          </div>
        </footer>
      </div>
      <MobileNav site={site} />
      <MenuSheet site={site} open={menu} onClose={() => setMenu(false)} />
      <HelpDialog shortcuts={shortcuts} open={help} onClose={() => setHelp(false)} />
      {search && <SearchDialog open={search} onClose={() => setSearch(false)} />}
      <StudyTimer />
      <FocusPill />
    </div>
  )
}

export function AppShell(props: { site: SiteConfig; shortcuts: Shortcut[]; children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CatalogProvider>
        <FocusProvider>
          <ShellInner {...props} />
        </FocusProvider>
      </CatalogProvider>
    </ThemeProvider>
  )
}
