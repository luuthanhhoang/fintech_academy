'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { interleave } from '@/lib/practice/interleave'
import { dayKey } from '@/lib/util/date'
import { useMastery } from '@/components/data/use-learner'
import { WhyLink } from '@/components/learn/why-link'
import { QuizItemCard } from '@/components/quiz/quiz-item'
import { LinkButton } from '@/components/ui/primitives'
import { EmptyState, Skeleton } from '@/components/ui/states'

/** Today's interleaved set: quiz items mixed across studied concepts, weighted toward weak ones. */
export function PracticeSession({ catalog, limit }: { catalog: Catalog; limit?: number }) {
  const mastery = useMastery(catalog)
  const day = dayKey(new Date())
  const doneToday = useLiveQuery(
    async () => (await db().quizAttempts.where('answeredAt').aboveOrEqual(new Date(`${day}T00:00:00`)).toArray()).filter((a) => a.context === 'practice').map((a) => a.itemId),
    [day],
  )
  const set = useMemo(() => {
    if (mastery.status !== 'ready') return null
    const studied = new Set([...mastery.states].filter(([, s]) => s === 'learning' || s === 'mastered').map(([id]) => id))
    const pool = catalog.lessons.flatMap((l) => l.quiz.filter((q) => q.type !== 'explain').map((item) => ({ item, lessonId: l.id })))
    const scores = new Map([...mastery.scores].map(([id, s]) => [id, s.score]))
    const cfg = limit ? { ...catalog.config.practice, size: limit } : catalog.config.practice
    return interleave(pool, studied, scores, cfg, day)
  }, [catalog, mastery, day, limit])

  if (!set || !doneToday) return <Skeleton lines={5} />
  if (set.length === 0)
    return (
      <EmptyState title="Chưa đủ khái niệm để luyện xen kẽ" action={<LinkButton href="/tracks/">Học thêm bài</LinkButton>}>
        Cần ít nhất {catalog.config.practice.minConcepts} khái niệm đang học hoặc đã thành thạo.
      </EmptyState>
    )
  const answered = set.filter((c) => doneToday.includes(c.item.id)).length
  const concept = (id: string) => catalog.concepts.find((c) => c.id === id)?.name.vi ?? id
  return (
    <div className="font-sans">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="num text-ink-3">Đã làm hôm nay {answered}/{set.length} · {new Set(set.map((c) => c.item.conceptId)).size} khái niệm được trộn</span>
        <WhyLink method="interleaving" />
      </div>
      <ol className="space-y-4">
        {set.map((c, i) => (
          <li key={c.item.id}>
            <p className="mb-1 text-xs text-ink-3">Khái niệm: {concept(c.item.conceptId)}</p>
            <QuizItemCard item={c.item} lessonId={c.lessonId} context="practice" index={i} />
          </li>
        ))}
      </ol>
    </div>
  )
}
