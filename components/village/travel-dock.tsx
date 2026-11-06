'use client'

import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { WorldView } from '@/lib/content/schema/world'
import type { WorldLayout } from '@/lib/world/layout'

export interface TravelTarget { kind: 'station' | 'school' | 'bus'; id: string; label: string }

/**
 * Bottom dock: how you are in the world (walking, flying over it, fishing your due cards), a focus session, and
 * "go to" — every station of every track, grouped by region, one tap away.
 */
export function TravelDock({ catalog, layout, views, current, dueCount, focusing, onView, onFocus, onTravel }: {
  catalog: Catalog
  layout: WorldLayout
  views: WorldView[]
  current: WorldView
  dueCount: number
  focusing: boolean
  onView: (id: string) => void
  onFocus: () => void
  onTravel: (t: TravelTarget) => void
}) {
  const [open, setOpen] = useState(false)
  // Walking, the overview and fishing are ways of being in the world; focus views come from a journey (⏱).
  const modes = views.filter((v) => v.mode !== 'focus')
  const regions = catalog.world.map.regions
  const btn = 'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors'
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 px-3">
      {open && (
        <div className="pointer-events-auto grid max-h-[45vh] w-[min(46rem,100%)] gap-3 overflow-y-auto rounded-2xl border border-rule bg-paper/95 p-3 font-sans shadow-2xl backdrop-blur sm:grid-cols-3">
          {regions.map((r) => {
            const track = catalog.tracks.find((t) => t.id === r.track)
            const stations = layout.stations.filter((s) => s.regionId === r.id)
            return (
              <section key={r.id}>
                <h3 className="font-serif text-sm font-semibold">{r.title}</h3>
                <p className="mb-1 text-[11px] text-ink-3">{track?.title.vi}</p>
                <ul className="space-y-0.5">
                  {stations.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => (setOpen(false), onTravel({ kind: 'station', id: s.id, label: s.title }))} className="w-full rounded-md px-1.5 py-1 text-left text-xs hover:bg-paper-2">
                        <span className="num mr-1 text-ink-3">{s.id.toUpperCase()}</span>
                        {s.title}
                      </button>
                    </li>
                  ))}
                  {layout.schools.filter((c) => c.regionId === r.id).map((c) => (
                    <li key={c.title}>
                      <button type="button" onClick={() => (setOpen(false), onTravel({ kind: 'school', id: c.regionId, label: c.title }))} className="w-full rounded-md px-1.5 py-1 text-left text-xs hover:bg-paper-2">
                        🏫 {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
      <div role="toolbar" aria-label="Trong làng" className="pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full border border-rule bg-paper/90 p-1 font-sans shadow-lg backdrop-blur">
        {modes.map((v) => (
          <button key={v.id} type="button" onClick={() => onView(v.id)} aria-pressed={v.id === current.id} title={v.description} className={`${btn} ${v.id === current.id ? 'bg-accent text-paper' : 'text-ink-2 hover:bg-paper-2'}`}>
            {v.title}
            {v.mode === 'review' && dueCount > 0 && <span className="num ml-1 rounded-full bg-lantern px-1.5 text-[10px] text-paper">{dueCount}</span>}
          </button>
        ))}
        <button type="button" onClick={onFocus} disabled={focusing} className={`${btn} text-ink-2 hover:bg-paper-2 disabled:opacity-50`}>
          ⏱ Tập trung
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${btn} ${open ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2'}`}>
          🧭 Đi tới
        </button>
      </div>
    </div>
  )
}
