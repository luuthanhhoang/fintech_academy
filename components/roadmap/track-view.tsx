'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { fmtPct } from '@/lib/util/format'
import { stageMastery } from '@/lib/mastery/compute'
import { useMastery } from '@/components/data/use-learner'
import { StatusBadge } from '@/components/ui/badges'
import { minutes } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'
import { ConceptChip } from './concept-chip'
import { StateLegend } from './legend'

const TrackGraph = dynamic(() => import('./track-graph').then((m) => m.TrackGraph), { ssr: false, loading: () => <Skeleton lines={10} /> })

export function TrackView({ catalog, trackId }: { catalog: Catalog; trackId: string }) {
  const mastery = useMastery(catalog)
  const [view, setView] = useState<'stages' | 'graph'>('stages')
  const track = catalog.tracks.find((t) => t.id === trackId)
  if (!track) return null
  if (mastery.status === 'loading') return <Skeleton lines={10} />
  const stats = new Map(stageMastery(catalog, mastery.scores).map((s) => [s.stageId, s]))
  const progress = new Map(mastery.records.progress.map((p) => [p.lessonId, p.status]))

  const color = `var(--line-${track.id})`
  return (
    <div className="font-sans">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <StateLegend />
        <div role="tablist" aria-label="Kiểu xem" className="flex rounded-full bg-paper-2 p-1 text-sm">
          {(['stages', 'graph'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className="rounded-full px-4 py-1.5 text-ink-2 aria-selected:bg-card aria-selected:text-ink aria-selected:shadow-sm">
              {v === 'stages' ? 'Theo ga' : 'Đồ thị khái niệm'}
            </button>
          ))}
        </div>
      </div>
      {view === 'graph' ? (
        <TrackGraph catalog={catalog} trackId={trackId} states={mastery.states} scores={mastery.scores} />
      ) : (
        <ol className="relative">
          {[...track.stages].sort((a, b) => a.order - b.order).map((s, i, all) => {
            const st = stats.get(s.id)
            const lessons = catalog.lessons.filter((l) => l.stage === s.id).sort((a, b) => a.order - b.order)
            const planned = catalog.planned.filter((p) => p.stage === s.id).sort((a, b) => a.order - b.order)
            const concepts = catalog.concepts.filter((c) => c.stage === s.id)
            const done = lessons.filter((l) => progress.get(l.id) === 'completed').length
            return (
              <li key={s.id} id={s.id} className="relative scroll-mt-24 pb-14 pl-10 sm:pl-14">
                {/* The rail runs down to the next station; the dot is this station. */}
                {i < all.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-3 w-[6px] sm:left-[15px]" style={{ background: color }} />}
                <span aria-hidden="true" className="absolute left-0 top-1 h-7 w-7 rounded-full border-[5px] bg-card sm:left-1 sm:h-[30px] sm:w-[30px]" style={{ borderColor: color, background: lessons.length && done === lessons.length ? color : undefined }} />
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-display text-2xl font-bold">
                    <span className="mr-2 text-ink-3">Ga {s.id.toUpperCase()}</span>
                    {s.title.vi}
                  </h2>
                  <p className="num text-sm text-ink-3">
                    {lessons.length ? `Đã học ${done}/${lessons.length} bài` : 'Chưa có bài viết'}
                    {st?.mean !== null && st ? ` · thành thạo trung bình ${fmtPct(st.mean, 0)}` : ''}
                  </p>
                </div>
                <p className="mt-2 max-w-[65ch] text-ink-2">{s.summary}</p>
                {(lessons.length > 0 || planned.length > 0) && (
                  <ul className="mt-5 overflow-hidden rounded-2xl bg-card ring-1 ring-rule/70">
                    {lessons.map((l) => {
                      const p = progress.get(l.id)
                      return (
                        <li key={l.id} className="border-b border-rule/60 last:border-0">
                          <Link href={`/lessons/${l.id}/`} className="flex items-center gap-4 px-5 py-4 hover:bg-paper-2/60">
                            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={p === 'completed' ? { background: color, color: 'var(--card)' } : { boxShadow: `inset 0 0 0 2px ${color}` }}>
                              {p === 'completed' ? '✓' : p === 'started' ? '◐' : ''}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium leading-snug text-ink">{l.title.vi}</span>
                              <span className="mt-0.5 block text-sm text-ink-3">
                                {minutes(l.estMinutes)}
                                {p === 'completed' ? ' · đã học xong' : p === 'started' ? ' · đang học dở' : ''}
                              </span>
                            </span>
                            <StatusBadge status={l.status} />
                          </Link>
                        </li>
                      )
                    })}
                    {planned.map((p) => (
                      <li key={p.id} className="flex items-center gap-4 border-b border-rule/60 px-5 py-4 text-ink-3 last:border-0">
                        <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full border-2 border-dashed border-rule" />
                        <span className="flex-1">{p.title.vi}</span>
                        <span className="text-xs">Sắp viết</span>
                      </li>
                    ))}
                  </ul>
                )}
                {concepts.length > 0 && (
                  <details className="group mt-4">
                    <summary className="cursor-pointer list-none text-sm font-medium text-ink-2 hover:text-ink">
                      <span className="inline-block transition-transform group-open:rotate-90">▸</span> {concepts.length} khái niệm ở ga này
                    </summary>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {concepts.map((c) => (
                        <ConceptChip key={c.id} concept={c} state={mastery.states.get(c.id) ?? 'planned'} score={mastery.scores.get(c.id)} />
                      ))}
                    </div>
                  </details>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
