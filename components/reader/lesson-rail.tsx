'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import type { RailItem } from '@/lib/content/lesson-nav'
import { db } from '@/lib/db/dexie'

/** Left rail: where you are in the stage, which lessons are done, and a door to the same place on the village map. */
export function LessonRail({ items, currentId, trackId, trackTitle, stageId, stageTitle }: { items: RailItem[]; currentId: string; trackId: string; trackTitle: string; stageId: string; stageTitle: string }) {
  const progress = useLiveQuery(async () => new Map((await db().progress.toArray()).map((p) => [p.lessonId, p.status])), [])
  return (
    <nav aria-label="Các bài trong chặng" className="font-sans text-sm">
      <Link href={`/tracks/${trackId}/`} className="text-xs font-semibold text-ink-3 hover:text-accent">
        ← {trackTitle}
      </Link>
      <p className="mt-1 font-serif text-base font-semibold leading-snug">{stageTitle}</p>
      <ol className="mt-3 space-y-0.5 border-l border-rule">
        {items.map((it) => {
          const status = progress?.get(it.id)
          const current = it.id === currentId
          const mark = status === 'completed' ? '✓' : status === 'started' ? '◐' : it.written ? '○' : '·'
          const inner = (
            <>
              <span aria-hidden="true" className={`mt-px w-4 shrink-0 text-center ${status === 'completed' ? 'text-good' : 'text-ink-3'}`}>{mark}</span>
              <span className="min-w-0">
                <span className="block leading-snug">{it.title}</span>
                <span className="block text-[11px] text-ink-3">{it.written ? `~${it.minutes} phút` : 'Dự kiến'}</span>
              </span>
            </>
          )
          return (
            <li key={it.id}>
              {it.written ? (
                <Link href={`/lessons/${it.id}/`} aria-current={current ? 'page' : undefined} className="-ml-px flex gap-1.5 border-l-2 border-transparent py-1.5 pl-2.5 pr-1 text-ink-2 hover:text-ink aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent">
                  {inner}
                </Link>
              ) : (
                <span className="-ml-px flex gap-1.5 border-l-2 border-transparent py-1.5 pl-2.5 pr-1 text-ink-3">{inner}</span>
              )}
            </li>
          )
        })}
      </ol>
      <Link href={`/?place=station:${stageId}`} className="mt-4 flex items-center gap-2 rounded-lg border border-rule px-3 py-2 text-xs text-ink-2 hover:bg-paper-2">
        <span aria-hidden="true">🗺</span>
        Xem chặng này trên bản đồ làng
      </Link>
    </nav>
  )
}

/** Previous / next lesson cards at the end of an article. */
export function LessonPager({ prev, next }: { prev: { id: string; title: string } | null; next: { id: string; title: string } | null }) {
  if (!prev && !next) return null
  return (
    <nav aria-label="Bài trước và bài sau" className="mt-10 grid gap-3 font-sans sm:grid-cols-2">
      {prev ? (
        <Link href={`/lessons/${prev.id}/`} className="rounded-xl border border-rule p-4 hover:bg-paper-2">
          <span className="text-xs text-ink-3">← Bài trước</span>
          <span className="mt-1 block font-serif text-base font-semibold leading-snug">{prev.title}</span>
        </Link>
      ) : <span />}
      {next && (
        <Link href={`/lessons/${next.id}/`} className="rounded-xl border border-accent/40 bg-accent-soft p-4 text-right hover:border-accent">
          <span className="text-xs text-accent">Bài kế tiếp →</span>
          <span className="mt-1 block font-serif text-base font-semibold leading-snug">{next.title}</span>
        </Link>
      )}
    </nav>
  )
}
