'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type ReactNode } from 'react'
import { db } from '@/lib/db/dexie'
import { logPractice } from '@/lib/db/repos/activity'
import { Button } from '@/components/ui/primitives'

export function ExerciseCard(props: {
  id: string
  conceptId: string
  index: number
  prompt: ReactNode
  hint: ReactNode | null
  solution: ReactNode
  simulatorHref: string | null
}) {
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const done = useLiveQuery(() => db().practiceLogs.where('refId').equals(props.id).count(), [props.id])
  return (
    <article className="rounded-lg border border-rule p-4 font-sans">
      <p className="text-xs uppercase tracking-wider text-ink-3">Bài tập {props.index + 1}</p>
      <div className="prose-notebook mt-1 text-base [&>p]:my-1">{props.prompt}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.hint && (
          <Button variant="ghost" onClick={() => setShowHint((s) => !s)} aria-expanded={showHint}>
            {showHint ? 'Ẩn gợi ý' : 'Gợi ý'}
          </Button>
        )}
        <Button variant="ghost" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
          {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
        </Button>
        {props.simulatorHref && (
          <Link href={props.simulatorHref} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm text-accent hover:bg-paper-2">
            Mở trong mô phỏng →
          </Link>
        )}
        <Button
          variant={done ? 'secondary' : 'primary'}
          onClick={() => logPractice({ kind: 'exercise', refId: props.id, conceptIds: [props.conceptId], result: 'done', detail: null })}
        >
          {done ? `✓ Đã làm (${done} lần)` : 'Đánh dấu đã làm'}
        </Button>
      </div>
      {showHint && props.hint && <div className="mt-3 rounded-md bg-paper-2 p-3 text-sm">{props.hint}</div>}
      {showSolution && <div className="prose-notebook mt-3 rounded-md bg-accent-soft p-3 text-base">{props.solution}</div>}
    </article>
  )
}
