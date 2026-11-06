/** A track drawn as a rail line (pure): per-station progress and the lesson to take next. */
import type { Catalog } from '../content/catalog'

export type LessonStatus = 'started' | 'completed'

export interface StationStat {
  stageId: string
  order: number
  title: string
  /** Lessons written for this station, and how many of them you completed. */
  written: number
  done: number
  /** Lessons announced but not yet written. */
  planned: number
}

export function lineStations(catalog: Pick<Catalog, 'tracks' | 'lessons' | 'planned'>, trackId: string, progress: ReadonlyMap<string, LessonStatus>): StationStat[] {
  const track = catalog.tracks.find((t) => t.id === trackId)
  if (!track) return []
  return [...track.stages]
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const lessons = catalog.lessons.filter((l) => l.stage === s.id)
      return {
        stageId: s.id,
        order: s.order,
        title: s.title.vi,
        written: lessons.length,
        done: lessons.filter((l) => progress.get(l.id) === 'completed').length,
        planned: catalog.planned.filter((p) => p.stage === s.id).length,
      }
    })
}

/** The first written lesson along the line (station order, then lesson order) that you have not completed. */
export function nextOnLine(catalog: Pick<Catalog, 'tracks' | 'lessons'>, trackId: string, progress: ReadonlyMap<string, LessonStatus>) {
  const track = catalog.tracks.find((t) => t.id === trackId)
  if (!track) return null
  const rank = new Map(track.stages.map((s) => [s.id, s.order]))
  return (
    catalog.lessons
      .filter((l) => l.track === trackId && progress.get(l.id) !== 'completed')
      .sort((a, b) => (rank.get(a.stage) ?? 0) - (rank.get(b.stage) ?? 0) || a.order - b.order)[0] ?? null
  )
}

/** Share of written lessons completed along the whole line (0–1), or null when nothing is written yet. */
export function lineProgress(stations: readonly StationStat[]): number | null {
  const written = stations.reduce((a, s) => a + s.written, 0)
  return written ? stations.reduce((a, s) => a + s.done, 0) / written : null
}
