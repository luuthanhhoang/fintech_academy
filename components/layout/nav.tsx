'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SiteConfig } from '@/lib/content/schema/config'
import { Icon } from '@/components/ui/icons'

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href)
}

export function Sidebar({ site, onSearch }: { site: SiteConfig; onSearch: () => void }) {
  const path = usePathname()
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-rule bg-paper px-4 py-6 lg:flex">
      <Link href="/" className="mb-1 font-serif text-xl font-semibold">
        {site.name}
      </Link>
      <p className="mb-6 text-xs leading-snug text-ink-3">{site.tagline}</p>
      <button type="button" onClick={onSearch} className="mb-5 flex items-center justify-between rounded-md border border-rule px-3 py-1.5 text-left text-sm text-ink-3 hover:bg-paper-2">
        Tìm kiếm… <span className="num text-xs">⌘K</span>
      </button>
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-0.5">
        {site.nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(path, n.href) ? 'page' : undefined}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-ink-2 hover:bg-paper-2 aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent"
          >
            <Icon name={n.icon} />
            <span>{n.label}</span>
            <span className="ml-auto text-[0.7rem] text-ink-3">{n.en}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export function MobileNav({ site }: { site: SiteConfig }) {
  const path = usePathname()
  return (
    <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {site.nav
        .filter((n) => n.mobile)
        .map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(path, n.href) ? 'page' : undefined}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] text-ink-3 aria-[current=page]:text-accent"
          >
            <Icon name={n.icon} />
            {n.label}
          </Link>
        ))}
    </nav>
  )
}

export function MobileHeader({ site, onSearch, onMenu }: { site: SiteConfig; onSearch: () => void; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-rule bg-paper/95 px-4 py-2.5 backdrop-blur lg:hidden">
      <button type="button" onClick={onMenu} aria-label="Mở menu" className="rounded p-1 text-ink-2 hover:bg-paper-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Link href="/" className="font-serif text-lg font-semibold">
        {site.name}
      </Link>
      <button type="button" onClick={onSearch} aria-label="Tìm kiếm" className="ml-auto rounded p-1 text-ink-2 hover:bg-paper-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.5-4.5" />
        </svg>
      </button>
    </header>
  )
}
