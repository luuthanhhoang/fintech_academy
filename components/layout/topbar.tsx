'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { isNavGroup, type NavGroup, type NavItem, type SiteConfig } from '@/lib/content/schema/config'
import { FocusChip } from '@/components/focus/focus-chip'
import { Icon } from '@/components/ui/icons'
import { Dialog } from './dialog'
import { DesktopNav, isActive } from './nav-menu'
import { ThemeToggle } from './theme-toggle'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </svg>
)

/** Slim top bar: brand, grouped navigation, search, focus timer, theme. Replaces the old 14-item sidebar. */
export function TopBar({ site, onSearch }: { site: SiteConfig; onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-[var(--topbar)] w-full max-w-[1360px] items-center gap-3 px-3 sm:px-5">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Icon name="tree" className="text-accent" width={20} height={20} />
          {site.name}
        </Link>
        <DesktopNav nav={site.nav} />
        <div className="ml-auto flex items-center gap-2">
          <FocusChip />
          <button type="button" onClick={onSearch} aria-label="Tìm kiếm" className="flex items-center gap-2 rounded-md border border-rule px-2.5 py-1.5 text-sm text-ink-3 hover:bg-paper-2">
            <SearchIcon />
            <span className="hidden md:inline">Tìm kiếm</span>
            <kbd className="num hidden text-xs md:inline">⌘K</kbd>
          </button>
          <span className="hidden lg:block">
            <ThemeToggle />
          </span>
        </div>
      </div>
    </header>
  )
}

/** Bottom tab bar on small screens: top-level links open directly, groups open a sheet. */
export function MobileTabs({ site }: { site: SiteConfig }) {
  const path = usePathname()
  const [sheet, setSheet] = useState<NavGroup | null>(null)
  const tabs = site.nav.filter((n) => n.mobile)
  const rest: NavItem[] = site.nav.filter((n) => !n.mobile)
  const cls = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] text-ink-3 aria-[current=page]:text-accent'
  return (
    <>
      <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {tabs.map((n) =>
          isNavGroup(n) ? (
            <button key={n.label} type="button" onClick={() => setSheet(n)} aria-haspopup="dialog" aria-current={n.items.some((i) => isActive(path, i.href)) ? 'page' : undefined} className={cls}>
              <Icon name={n.icon} />
              {n.label}
            </button>
          ) : (
            <Link key={n.href} href={n.href} aria-current={isActive(path, n.href) ? 'page' : undefined} className={cls}>
              <Icon name={n.icon} />
              {n.label}
            </Link>
          ),
        )}
        <button type="button" onClick={() => setSheet({ label: 'Thêm', icon: 'gear', mobile: false, items: rest.flatMap((n) => (isNavGroup(n) ? n.items : [n])) })} className={cls}>
          <Icon name="gear" />
          Thêm
        </button>
      </nav>
      <Dialog open={sheet !== null} onClose={() => setSheet(null)} label={sheet?.label ?? 'Menu'}>
        <nav className="p-2" aria-label={sheet?.label}>
          <p className="px-3 py-2 text-xs font-semibold text-ink-3">{sheet?.label}</p>
          {sheet?.items.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setSheet(null)} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-paper-2">
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
