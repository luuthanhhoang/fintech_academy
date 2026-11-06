'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Shortcut, SiteConfig } from '@/lib/content/schema/config'
import { CatalogProvider } from '@/components/data/catalog-provider'
import { FocusToast } from '@/components/focus/focus-chip'
import { FocusProvider } from '@/components/focus/focus-provider'
import { HelpDialog } from './help-dialog'
import { useShortcuts } from './shortcuts'
import { StudyTimer } from './study-timer'
import { MobileTabs, TopBar, type Line } from './topbar'

const SearchDialog = dynamic(() => import('@/components/search/search-dialog').then((m) => m.SearchDialog), { ssr: false })

/**
 * True when the page is shown inside the village's in-world reader (an iframe): the world already provides the
 * navigation, so the shell hides its bars. Marked on <html data-embed> so pages can hide world-only links too.
 */
function useEmbedded() {
  const [embedded, setEmbedded] = useState(false)
  useEffect(() => {
    let inFrame = false
    try {
      inFrame = window.self !== window.top
    } catch {
      inFrame = true
    }
    if (inFrame) document.documentElement.dataset.embed = '1'
    const id = window.setTimeout(() => setEmbedded(inFrame), 0)
    return () => window.clearTimeout(id)
  }, [])
  return embedded
}

function ShellInner({ site, shortcuts, lines, children }: { site: SiteConfig; shortcuts: Shortcut[]; lines: Line[]; children: ReactNode }) {
  const [search, setSearch] = useState(false)
  const [help, setHelp] = useState(false)
  const handlers = useMemo(() => ({ openSearch: () => setSearch(true), showHelp: () => setHelp(true) }), [])
  useShortcuts(shortcuts, handlers)
  // The home page is the full-bleed 3D village: no page padding, no footer.
  const home = usePathname() === '/'
  const embedded = useEmbedded()
  if (embedded) {
    return (
      <main id="main" className="mx-auto w-full max-w-[980px] px-4 pb-16 pt-5 sm:px-6">
        {children}
      </main>
    )
  }
  return (
    <div className="flex min-h-dvh flex-col [--topbar:3.5rem]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:p-2">
        Bỏ qua tới nội dung chính
      </a>
      <TopBar site={site} lines={lines} onSearch={() => setSearch(true)} />
      <main id="main" className={home ? 'w-full flex-1' : 'mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-8 sm:px-6 md:pb-16 lg:px-8 lg:pt-12'}>
        {children}
      </main>
      {!home && (
        <footer className="mx-auto mb-20 flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-6 text-xs text-ink-3 sm:px-6 md:mb-0 lg:px-8">
          <p>{site.disclaimer}</p>
          <button type="button" onClick={() => setHelp(true)} className="underline">
            Phím tắt (?)
          </button>
        </footer>
      )}
      <MobileTabs site={site} />
      <HelpDialog shortcuts={shortcuts} open={help} onClose={() => setHelp(false)} />
      {search && <SearchDialog open={search} onClose={() => setSearch(false)} />}
      <StudyTimer />
      <FocusToast />
    </div>
  )
}

export function AppShell(props: { site: SiteConfig; shortcuts: Shortcut[]; lines: Line[]; children: ReactNode }) {
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
