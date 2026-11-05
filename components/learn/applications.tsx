'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import type { Application } from '@/lib/content/schema/learning'
import { db } from '@/lib/db/dexie'
import { logPractice } from '@/lib/db/repos/activity'
import { Button } from '@/components/ui/primitives'

/** "Apply it at work": mini-project briefs that transfer the lesson to a dev context. */
export function ApplicationsList({ conceptIds, items }: { conceptIds: string[]; items: Application[] }) {
  const done = useLiveQuery(async () => new Set((await db().practiceLogs.where('kind').equals('application').toArray()).map((p) => p.refId)), [])
  return (
    <section aria-labelledby="ap-dung" className="mt-10 font-sans">
      <h2 id="ap-dung" className="font-serif text-2xl font-semibold" style={{ scrollMarginTop: '5rem' }}>
        Áp dụng vào công việc dev
      </h2>
      <p className="mt-1 text-sm text-ink-3">Bài tập chuyển giao: làm một thứ nhỏ, thật, bằng kỹ năng bạn đã có.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <article key={a.id} className="flex flex-col rounded-lg border border-rule p-4">
            <h3 className="font-medium">{a.title}</h3>
            <p className="mt-2 text-sm text-ink-2"><span className="font-medium text-ink">Bối cảnh:</span> {a.context}</p>
            <p className="mt-2 text-sm text-ink-2"><span className="font-medium text-ink">Việc cần làm:</span> {a.task}</p>
            <p className="mt-2 text-sm text-ink-2"><span className="font-medium text-ink">Sản phẩm:</span> {a.deliverable}</p>
            <div className="mt-auto pt-3">
              <Button variant={done?.has(a.id) ? 'secondary' : 'primary'} onClick={() => logPractice({ kind: 'application', refId: a.id, conceptIds, result: 'done', detail: null })}>
                {done?.has(a.id) ? '✓ Đã làm' : 'Đánh dấu đã làm'}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
