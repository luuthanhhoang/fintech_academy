'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { isNavGroup, type NavGroup, type NavItem, type NavLink } from '@/lib/content/schema/config'
import { Icon } from '@/components/ui/icons'

export function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href)
}

const groupActive = (path: string, g: NavGroup) => g.items.some((i) => isActive(path, i.href))

const ITEM = 'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-paper-2 aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent'

function LinkItem({ n, path }: { n: NavLink; path: string }) {
  return (
    <Link href={n.href} aria-current={isActive(path, n.href) ? 'page' : undefined} className={ITEM}>
      <Icon name={n.icon} width={16} height={16} />
      {n.label}
    </Link>
  )
}

/** Dropdown: click to open, Esc / outside click / navigation to close. */
function Group({ g, path }: { g: NavGroup; path: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', out)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(id)
  }, [path])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        aria-current={groupActive(path, g) ? 'page' : undefined}
        className={`${ITEM} gap-1.5`}
      >
        <Icon name={g.icon} width={16} height={16} />
        {g.label}
        <span aria-hidden="true" className="text-[10px] text-ink-3">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-rule bg-paper p-1.5 shadow-xl">
          {g.items.map((i) => (
            <Link key={i.href} role="menuitem" href={i.href} aria-current={isActive(path, i.href) ? 'page' : undefined} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-paper-2 aria-[current=page]:bg-accent-soft">
              <Icon name={i.icon} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <span className="block text-sm font-medium text-ink">{i.label}</span>
                {i.desc && <span className="block text-xs leading-snug text-ink-3">{i.desc}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function DesktopNav({ nav }: { nav: NavItem[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-0.5 lg:flex">
      {nav.map((n) => (isNavGroup(n) ? <Group key={n.label} g={n} path={path} /> : <LinkItem key={n.href} n={n} path={path} />))}
    </nav>
  )
}
