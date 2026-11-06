'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { Track } from '@/lib/content/schema/track'
import { lineProgress, lineStations, nextOnLine, type LessonStatus, type StationStat } from '@/lib/roadmap/line'
import { minutes } from '@/components/ui/primitives'

const lineVar = (id: string) => `var(--line-${id})`

/**
 * A station dot: hollow until you complete a lesson there, filling clockwise with the share completed;
 * dashed when the station has no lesson written yet.
 */
function StationDot({ s, color }: { s: StationStat; color: string }) {
  const share = s.written ? s.done / s.written : 0
  const style: CSSProperties = s.written
    ? { background: `conic-gradient(${color} ${share * 360}deg, var(--card) 0deg)`, borderColor: color }
    : { borderColor: 'var(--ink-3)', borderStyle: 'dashed', background: 'var(--card)' }
  return <span aria-hidden="true" className="relative z-10 block h-5 w-5 shrink-0 rounded-full border-[3px]" style={style} />
}

function stationLabel(s: StationStat) {
  if (!s.written) return s.planned ? `${s.planned} bài sắp viết` : 'Chưa có bài'
  return `${s.done}/${s.written} bài`
}

/** One track's line: stations left to right (top to bottom on phones), each linking to its place on the track page. */
export function Line({ track, stations }: { track: Track; stations: StationStat[] }) {
  const color = lineVar(track.id)
  return (
    <ol className="relative grid gap-y-5 md:grid-flow-col md:gap-y-0" style={{ gridAutoColumns: 'minmax(0, 1fr)' }}>
      {stations.map((s, i) => (
        <li key={s.stageId} className="relative">
          {/* The rail: a segment to the next station (vertical on phones, horizontal from md). */}
          {i < stations.length - 1 && (
            <span aria-hidden="true" className="absolute left-[10px] top-[10px] h-[calc(100%+1.25rem)] w-[5px] -translate-x-1/2 md:left-1/2 md:top-[7.5px] md:h-[5px] md:w-full md:translate-x-0" style={{ background: color }} />
          )}
          <Link href={`/tracks/${track.id}/#${s.stageId}`} className="group relative flex items-start gap-3 rounded-lg md:flex-col md:items-center md:gap-2 md:text-center">
            <StationDot s={s} color={color} />
            <span className="min-w-0">
              <span className="block text-[0.95rem] font-semibold leading-snug text-ink group-hover:underline md:text-sm">{s.title}</span>
              <span className="num block text-xs text-ink-3">{stationLabel(s)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** All tracks as lines, each with where you are and the lesson to take next. */
export function TransitMap({ catalog, progress }: { catalog: Catalog; progress: ReadonlyMap<string, LessonStatus> }) {
  const tracks = [...catalog.tracks].sort((a, b) => a.order - b.order)
  return (
    <div className="space-y-14">
      {tracks.map((t) => {
        const stations = lineStations(catalog, t.id, progress)
        const share = lineProgress(stations)
        const next = nextOnLine(catalog, t.id, progress)
        return (
          <section key={t.id} aria-labelledby={`line-${t.id}`}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div className="max-w-2xl">
                <h2 id={`line-${t.id}`} className="flex items-center gap-3 font-display text-2xl font-bold">
                  <span aria-hidden="true" className="h-[6px] w-8 rounded-full" style={{ background: lineVar(t.id) }} />
                  <Link href={`/tracks/${t.id}/`} className="hover:underline">
                    {t.title.vi}
                  </Link>
                </h2>
                <p className="mt-2 text-ink-2">{t.summary}</p>
              </div>
              <div className="text-sm">
                <p className="num text-ink-3">{share === null ? 'Chưa có bài viết' : `Đã học ${Math.round(share * 100)}% số bài đã viết`}</p>
                {next && (
                  <Link href={`/lessons/${next.id}/`} className="mt-1.5 inline-flex max-w-xs items-center gap-2 rounded-full bg-ink py-2 pl-3 pr-4 font-medium text-card hover:opacity-90">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: lineVar(t.id) }} />
                    <span className="truncate">Học tiếp: {next.title.vi}</span>
                  </Link>
                )}
                {next && <p className="mt-1 text-xs text-ink-3">{minutes(next.estMinutes)}</p>}
              </div>
            </div>
            <Line track={t} stations={stations} />
          </section>
        )
      })}
    </div>
  )
}
