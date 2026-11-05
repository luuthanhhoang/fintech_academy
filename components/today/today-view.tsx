'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { markTodayBlock, setSetting } from '@/lib/db/repos/activity'
import { LinkButton, ProgressBar } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'
import { TODAY_BLOCKS } from './blocks'
import { useToday } from './use-today'

function FocusPicker({ catalog }: { catalog: Catalog }) {
  const focus = useLiveQuery(async () => ({ v: (await db().settings.get('focusTrack'))?.value }), [])
  return (
    <label className="flex items-center gap-2 text-sm">
      Lộ trình:
      <select value={typeof focus?.v === 'string' ? focus.v : ''} onChange={(e) => setSetting('focusTrack', e.target.value || null)} className="rounded-md border border-rule bg-paper px-2 py-1">
        <option value="">Cả hai</option>
        {catalog.tracks.map((t) => (
          <option key={t.id} value={t.id}>{t.title.vi}</option>
        ))}
      </select>
    </label>
  )
}

/** The daily loop. Block order/titles come from content/config/today.yaml; progress survives reloads. */
export function TodayView({ catalog }: { catalog: Catalog }) {
  const today = useToday(catalog)
  if (!today) return <Skeleton lines={10} />
  const blocks = catalog.config.today.blocks
  const done = blocks.filter((b) => today.completed.has(b.id)).length
  return (
    <div className="font-sans">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-56 flex-1">
          <p className="num mb-1 text-sm text-ink-2">Vòng lặp hôm nay: {done}/{blocks.length}</p>
          <ProgressBar value={done / blocks.length} label="Tiến độ hôm nay" />
        </div>
        <FocusPicker catalog={catalog} />
        <LinkButton href={`/village/?journey=${catalog.config.focus.journeys[0]?.id ?? ''}`}>🚆 Học theo chặng ở Làng học</LinkButton>
      </div>
      <ol className="space-y-5">
        {blocks.map((b, i) => {
          const Block = TODAY_BLOCKS[b.id]
          const isDone = today.completed.has(b.id)
          return (
            <li key={b.id} className={`rounded-xl border p-4 sm:p-5 ${isDone ? 'border-good/50 bg-good-soft/30' : 'border-rule'}`}>
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <span className="num text-xs text-ink-3">{String.fromCharCode(97 + i)}.</span>
                <h2 className="font-serif text-xl font-semibold">{b.title}</h2>
                <span className="text-xs text-ink-3">{b.description}</span>
                <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-2">
                  <input type="checkbox" checked={isDone} onChange={(e) => markTodayBlock(today.day, b.id, e.target.checked)} />
                  {isDone ? 'Đã xong' : 'Đánh dấu xong'}
                </label>
              </div>
              <Block catalog={catalog} today={today} />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
