'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { markTodayBlock, setSetting } from '@/lib/db/repos/activity'
import { Skeleton } from '@/components/ui/states'
import { TODAY_BLOCKS } from './blocks'
import { useToday } from './use-today'

/** Which track today's plan follows: all, or one line (its colour on the chip). */
function FocusPicker({ catalog }: { catalog: Catalog }) {
  const focus = useLiveQuery(async () => ({ v: (await db().settings.get('focusTrack'))?.value }), [])
  const current = typeof focus?.v === 'string' ? focus.v : ''
  const options = [{ id: '', title: 'Tất cả lộ trình' }, ...[...catalog.tracks].sort((a, b) => a.order - b.order).map((t) => ({ id: t.id, title: t.title.vi }))]
  return (
    <div role="radiogroup" aria-label="Học theo lộ trình" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id || 'all'}
          type="button"
          role="radio"
          aria-checked={current === o.id}
          onClick={() => void setSetting('focusTrack', o.id || null)}
          className="flex items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-sm text-ink-2 aria-checked:border-ink aria-checked:bg-ink aria-checked:text-card"
        >
          {o.id && <span aria-hidden="true" className="h-[5px] w-4 rounded-full" style={{ background: `var(--line-${o.id})` }} />}
          {o.title}
        </button>
      ))}
    </div>
  )
}

/**
 * Today as a route of stops (order from content/config/today.yaml). The first unfinished stop is open; finished
 * stops fold away with a tick; any stop can be opened. Progress is saved per day.
 */
export function TodayView({ catalog }: { catalog: Catalog }) {
  const today = useToday(catalog)
  const [opened, setOpened] = useState<Set<string>>(new Set())
  if (!today) return <Skeleton lines={10} />
  const blocks = catalog.config.today.blocks
  const done = blocks.filter((b) => today.completed.has(b.id)).length
  const current = blocks.find((b) => !today.completed.has(b.id))?.id ?? null
  const toggle = (id: string) => setOpened((s) => new Set(s.has(id) ? [...s].filter((x) => x !== id) : [...s, id]))
  return (
    <div className="font-sans">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="num font-display text-4xl font-bold">
            {done}
            <span className="text-ink-3">/{blocks.length}</span>
          </p>
          <p className="text-ink-2">{done === blocks.length ? 'Xong cả hành trình hôm nay. Mai gặp lại.' : 'điểm dừng đã đi qua hôm nay'}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <FocusPicker catalog={catalog} />
        </div>
      </div>
      <ol className="relative">
        {blocks.map((b, i) => {
          const Block = TODAY_BLOCKS[b.id]
          const isDone = today.completed.has(b.id)
          const isOpen = b.id === current ? !opened.has(b.id) : opened.has(b.id)
          return (
            <li key={b.id} className="relative pb-6 pl-12">
              {i < blocks.length - 1 && <span aria-hidden="true" className={`absolute bottom-0 left-[15px] top-8 w-[3px] ${isDone ? 'bg-accent' : 'bg-rule'}`} />}
              <span
                aria-hidden="true"
                className={`num absolute left-0 top-0.5 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${isDone ? 'bg-accent text-card' : b.id === current ? 'bg-ink text-card' : 'border-2 border-rule bg-card text-ink-3'}`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <div className={`rounded-2xl ${isOpen ? 'bg-card p-5 ring-1 ring-rule/70 sm:p-6' : ''}`}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button type="button" onClick={() => toggle(b.id)} aria-expanded={isOpen} className="min-w-0 flex-1 text-left">
                    <span className={`block font-display text-xl font-bold ${isDone && !isOpen ? 'text-ink-3' : ''}`}>{b.title}</span>
                    <span className="block text-sm text-ink-3">{b.description}</span>
                  </button>
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <input type="checkbox" checked={isDone} onChange={(e) => markTodayBlock(today.day, b.id, e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                    Xong
                  </label>
                </div>
                {isOpen && (
                  <div className="mt-5">
                    <Block catalog={catalog} today={today} />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
