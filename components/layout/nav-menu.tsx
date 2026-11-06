'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { Nav, NavLink } from '@/lib/content/schema/config'
import { Icon } from '@/components/ui/icons'
import { ThemeToggle } from './theme-toggle'

export function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href)
}

/** Brand mark: the three track lines running into one station (colours from content/tracks). */
export function LineMark({ lines, size = 22 }: { lines: { id: string; color: string }[]; size?: number }) {
  const n = lines.length
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {lines.map((l, i) => {
        const y = 5 + (i * 14) / Math.max(1, n - 1)
        return <path key={l.id} d={`M2 ${y} C 9 ${y}, 11 12, 17 12`} fill="none" stroke={l.color} strokeWidth="2.6" strokeLinecap="round" />
      })}
      <circle cx="18.5" cy="12" r="3.6" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.2" />
    </svg>
  )
}

/** Primary destinations: a quiet row; the current one carries a short ink rule beneath it. */
export function PrimaryNav({ items }: { items: NavLink[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Điều hướng chính" className="hidden h-full items-stretch md:flex">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          title={n.desc}
          aria-current={isActive(path, n.href) ? 'page' : undefined}
          className="relative flex items-center px-3 text-[0.95rem] font-medium text-ink-2 transition-colors hover:text-ink aria-[current=page]:text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-transparent aria-[current=page]:after:bg-ink"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  )
}

/** "Yours" menu: personal pages and the theme switch. Click to open; Esc, outside click or navigation closes it. */
export function MoreMenu({ more }: { more: Nav['more'] }) {
  const path = usePathname()
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
  const active = more.items.some((i) => isActive(path, i.href))
  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-paper-2 ${active ? 'text-ink' : 'text-ink-2'}`}
      >
        <Icon name={more.icon} width={16} height={16} />
        {more.label}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-rule bg-card p-1.5 shadow-[0_18px_40px_-18px_rgba(23,33,29,0.35)]">
          {more.items.map((i) => (
            <Link key={i.href} role="menuitem" href={i.href} aria-current={isActive(path, i.href) ? 'page' : undefined} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-paper-2 aria-[current=page]:bg-accent-soft">
              <Icon name={i.icon} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <span className="block text-sm font-medium text-ink">{i.label}</span>
                {i.desc && <span className="block text-xs leading-snug text-ink-3">{i.desc}</span>}
              </span>
            </Link>
          ))}
          <div className="mt-1 border-t border-rule px-3 pb-1.5 pt-2.5">
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  )
}
