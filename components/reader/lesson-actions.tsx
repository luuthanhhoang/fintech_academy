'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import type { Concept } from '@/lib/content/schema/concept'
import { db } from '@/lib/db/dexie'
import { completeLesson, toggleMark } from '@/lib/db/repos/learning'
import { useCatalogState } from '@/components/data/catalog-provider'
import { Button } from '@/components/ui/primitives'

/** Mark concepts for review (creates FSRS cards) and complete the lesson. */
export function LessonActions({ lessonId, concepts }: { lessonId: string; concepts: Pick<Concept, 'id' | 'name'>[] }) {
  const state = useCatalogState()
  const marks = useLiveQuery(() => db().marks.where('lessonId').equals(lessonId).toArray(), [lessonId])
  const progress = useLiveQuery(() => db().progress.get(lessonId), [lessonId])
  const srs = state.status === 'ready' ? state.catalog.config.srs : null
  const marked = new Set(marks?.map((m) => m.conceptId))

  return (
    <section aria-label="Hành động với bài" className="mt-10 rounded-lg border border-rule bg-paper-2 p-4 font-sans sm:p-5">
      <p className="text-sm font-medium">Đánh dấu khái niệm để đưa vào thẻ ôn (FSRS):</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {concepts.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={!srs}
            aria-pressed={marked.has(c.id)}
            onClick={() => srs && toggleMark(srs, c.id, lessonId)}
            className="rounded-full border border-rule bg-paper px-3 py-1 text-sm aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
          >
            {marked.has(c.id) ? '★ ' : '☆ '}
            {c.name.vi}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {progress?.status === 'completed' ? (
          <p className="text-sm text-good">✓ Đã hoàn thành {progress.completedAt?.toLocaleDateString('vi-VN')}</p>
        ) : (
          <Button variant="primary" disabled={!srs} onClick={() => srs && completeLesson(srs, lessonId, concepts.map((c) => c.id))}>
            Hoàn thành bài & tạo thẻ ôn
          </Button>
        )}
        <Link href="/review/" className="text-sm text-accent underline">
          Mở phiên ôn tập →
        </Link>
      </div>
    </section>
  )
}
