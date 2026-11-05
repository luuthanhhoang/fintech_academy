'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { fmtPct } from '@/lib/util/format'
import { stageMastery } from '@/lib/mastery/compute'
import { useMastery } from '@/components/data/use-learner'
import { StatusBadge } from '@/components/ui/badges'
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

  return (
    <div className="font-sans">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <StateLegend />
        <div role="tablist" aria-label="Kiểu xem" className="flex rounded-md border border-rule p-0.5 text-sm">
          {(['stages', 'graph'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className="rounded px-3 py-1 aria-selected:bg-accent-soft aria-selected:text-accent">
              {v === 'stages' ? 'Theo chặng' : 'Đồ thị khái niệm'}
            </button>
          ))}
        </div>
      </div>
      {view === 'graph' ? (
        <TrackGraph catalog={catalog} trackId={trackId} states={mastery.states} scores={mastery.scores} />
      ) : (
        <ol className="space-y-10">
          {[...track.stages].sort((a, b) => a.order - b.order).map((s) => {
            const st = stats.get(s.id)
            const lessons = catalog.lessons.filter((l) => l.stage === s.id).sort((a, b) => a.order - b.order)
            const planned = catalog.planned.filter((p) => p.stage === s.id).sort((a, b) => a.order - b.order)
            return (
              <li key={s.id} id={s.id} className="scroll-mt-20">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="num text-xs text-ink-3">Chặng {s.order}</span>
                  <h2 className="font-serif text-2xl font-semibold">{s.title.vi}</h2>
                  <span className="text-sm text-ink-3">({s.title.en})</span>
                  <span className="num ml-auto text-xs text-ink-3">
                    Thành thạo TB: {st?.mean === null || !st ? 'chưa có dữ liệu' : `${fmtPct(st.mean, 0)} (${st.measured}/${st.total} khái niệm có dữ liệu)`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-2">{s.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {catalog.concepts.filter((c) => c.stage === s.id).map((c) => (
                    <ConceptChip key={c.id} concept={c} state={mastery.states.get(c.id) ?? 'planned'} score={mastery.scores.get(c.id)} />
                  ))}
                </div>
                <ul className="mt-4 divide-y divide-rule rounded-lg border border-rule">
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <Link href={`/lessons/${l.id}/`} className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-paper-2">
                        <span className="font-medium">{l.title.vi}</span>
                        <span className="text-xs text-ink-3">{l.title.en} · ~{l.estMinutes} phút</span>
                        <span className="ml-auto flex items-center gap-2 text-xs">
                          {progress.get(l.id) === 'completed' ? <span className="text-good">✓ Hoàn thành</span> : progress.get(l.id) === 'started' ? <span className="text-accent">◐ Đang học</span> : null}
                          <StatusBadge status={l.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                  {planned.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-ink-3">
                      <span>{p.title.vi}</span>
                      <span className="text-xs">{p.title.en}</span>
                      <span className="ml-auto"><StatusBadge status="planned" /></span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
