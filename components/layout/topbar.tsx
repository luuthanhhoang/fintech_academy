'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { SiteConfig } from '@/lib/content/schema/config'
import { Icon } from '@/components/ui/icons'
import { Dialog } from './dialog'
import { isActive, LineMark, MoreMenu, PrimaryNav } from './nav-menu'
import { ThemeToggle } from './theme-toggle'

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </svg>
)

export interface Line { id: string; color: string }

/** Top bar: brand, four destinations, then search, "ask the tutor" and your personal menu. */
export function TopBar({ site, lines, onSearch }: { site: SiteConfig; lines: Line[]; onSearch: () => void }) {
  const nav = site.nav
  const path = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-card/92 backdrop-blur">
      <div className="mx-auto flex h-[var(--topbar)] w-full max-w-[1200px] items-stretch gap-2 px-3 sm:px-5">
        <Link href="/" className="mr-3 flex items-center gap-2 font-display text-[1.05rem] font-bold tracking-tight">
          <LineMark lines={lines} />
          {site.name}
        </Link>
        <PrimaryNav items={nav.primary} />
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={onSearch} aria-label="Tìm kiếm" className="flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1.5 text-sm text-ink-3 transition-colors hover:text-ink">
            <SearchIcon />
            <span className="hidden lg:inline">Tìm bài, khái niệm…</span>
            <kbd className="hidden rounded border border-rule bg-card px-1 text-[0.7rem] lg:inline">⌘K</kbd>
          </button>
          <Link
            href={nav.ask.href}
            aria-current={isActive(path, nav.ask.href) ? 'page' : undefined}
            className="hidden items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft aria-[current=page]:bg-accent-soft sm:flex"
          >
            <Icon name={nav.ask.icon} width={16} height={16} />
            {nav.ask.label}
          </Link>
          <MoreMenu more={nav.more} />
        </div>
      </div>
    </header>
  )
}

/** Phone tab bar: the primary destinations, plus "more" for the tutor and personal pages. */
export function MobileTabs({ site }: { site: SiteConfig }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const nav = site.nav
  const extra = [nav.ask, ...nav.more.items]
  const cls = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium text-ink-3 aria-[current=page]:text-ink'
  return (
    <>
      <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-rule bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {nav.primary.map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(path, n.href) ? 'page' : undefined} className={cls}>
            <Icon name={n.icon} />
            {n.label}
          </Link>
        ))}
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-current={extra.some((i) => isActive(path, i.href)) ? 'page' : undefined} className={cls}>
          <Icon name={nav.more.icon} />
          Thêm
        </button>
      </nav>
      <Dialog open={open} onClose={() => setOpen(false)} label={nav.more.label}>
        <nav className="p-2" aria-label={nav.more.label}>
          {extra.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-paper-2">
              <Icon name={i.icon} className="mt-0.5 text-accent" />
              <span>
                <span className="block text-sm font-medium">{i.label}</span>
                {i.desc && <span className="block text-xs text-ink-3">{i.desc}</span>}
              </span>
            </Link>
          ))}
          <div className="border-t border-rule p-3">
            <ThemeToggle />
          </div>
        </nav>
      </Dialog>
    </>
  )
}
