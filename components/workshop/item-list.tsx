import Link from 'next/link'
import type { ReactNode } from 'react'

export interface HubItem {
  href: string
  title: string
  summary: string
  /** Tracks whose lessons use this item: shown as their line colours. */
  tracks: { id: string; title: string }[]
  /** Lessons that use it (by title). */
  usedIn: string[]
  /** Extra line under the summary (e.g. the concepts a scenario trains). */
  note?: string
  badge?: ReactNode
}

/** A quiet list of practice items: title and summary, the track lines it belongs to, where it is used. */
export function ItemList({ items }: { items: HubItem[] }) {
  return (
    <ul className="divide-y divide-rule/70 overflow-hidden rounded-2xl bg-card ring-1 ring-rule/70">
      {items.map((it) => (
        <li key={it.href}>
          <Link href={it.href} className="group grid gap-1 px-5 py-4 hover:bg-paper-2/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
            <span className="min-w-0">
              <span className="block font-display text-lg font-semibold leading-snug text-ink group-hover:underline">{it.title}</span>
              <span className="mt-1 block max-w-[70ch] text-ink-2">{it.summary}</span>
              {it.note && <span className="mt-1.5 block text-sm text-ink-3">{it.note}</span>}
              {it.usedIn.length > 0 && <span className="mt-1.5 block text-sm text-ink-3">Dùng trong bài: {it.usedIn.join(' · ')}</span>}
            </span>
            <span className="flex items-start gap-2 pt-1 sm:justify-end">
              {it.badge}
              {it.tracks.map((t) => (
                <span key={t.id} title={t.title} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-3">
                  <span aria-hidden="true" className="h-[5px] w-5 rounded-full" style={{ background: `var(--line-${t.id})` }} />
                  {t.title}
                </span>
              ))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
