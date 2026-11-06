'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { CardRecord } from '@/lib/db/types'
import { applyReview } from '@/lib/db/repos/learning'
import { GRADES, previewIntervals, type Grade } from '@/lib/srs/fsrs'
import { fmtNum } from '@/lib/util/format'
import { QuizItemCard } from '@/components/quiz/quiz-item'
import { Button } from '@/components/ui/primitives'

function intervalLabel(days: number | undefined) {
  if (days === undefined) return ''
  if (days < 1) return `${fmtNum(days * 24 * 60, 0)} phút`
  return `${fmtNum(days, days < 10 ? 1 : 0)} ngày`
}

/** One due card. Concept cards are self-graded recall; quiz cards re-ask the item and grade automatically. */
export function ReviewCard({ catalog, card, onDone }: { catalog: Catalog; card: CardRecord; onDone: () => void }) {
  const [revealed, setRevealed] = useState(false)
  const [intervals, setIntervals] = useState<Record<Grade, number> | null>(null)
  const concept = catalog.concepts.find((c) => c.id === card.conceptId)
  const lesson = catalog.lessons.find((l) => l.concepts.includes(card.conceptId))
  const quiz = card.kind === 'quiz' ? catalog.lessons.flatMap((l) => l.quiz.map((q) => ({ q, lessonId: l.id }))).find((x) => x.q.id === card.refId) : undefined

  useEffect(() => {
    void previewIntervals(catalog.config.srs, card.fsrs, new Date()).then(setIntervals)
  }, [catalog, card])

  const grade = async (g: Grade) => {
    await applyReview(catalog.config.srs, card, g, 'review')
    onDone()
  }

  if (card.kind === 'quiz') {
    if (!quiz) return <p className="text-sm text-ink-3">Câu hỏi của thẻ này không còn trong nội dung (đã bị xoá). <Button onClick={() => grade(3)}>Bỏ qua</Button></p>
    // Grading the quiz attempt reschedules the card (recordQuizAttempt), so we only advance afterwards.
    return <QuizItemCard key={card.id} item={quiz.q} lessonId={quiz.lessonId} context="review" onGraded={() => setTimeout(onDone, 1200)} />
  }

  return (
    <article className="rounded-lg border border-rule p-5 font-sans">
      <p className="text-xs text-ink-3">Thẻ khái niệm</p>
      <h2 className="mt-1 font-serif text-2xl font-semibold">{concept?.name.vi ?? card.conceptId}</h2>
      <p className="text-sm text-ink-3">{concept?.name.en}</p>
      <p className="mt-4 text-sm">Tự nhớ lại: định nghĩa, vì sao nó quan trọng, và một ví dụ/ánh xạ sang dev. Rồi lật thẻ để so.</p>
      {revealed ? (
        <div className="mt-4 rounded-md bg-paper-2 p-4">
          <p>{concept?.short}</p>
          {lesson && (
            <Link href={`/lessons/${lesson.id}/`} className="mt-2 inline-block text-sm text-accent underline">
              Xem lại bài: {lesson.title.vi}
            </Link>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g) => (
              <Button key={g.grade} variant={g.grade === 3 ? 'primary' : 'secondary'} onClick={() => grade(g.grade)} className="flex-col !py-2">
                <span>{g.label} ({g.en})</span>
                <span className="num text-[0.7rem] opacity-80">{intervalLabel(intervals?.[g.grade])}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Button variant="primary" className="mt-4" onClick={() => setRevealed(true)}>
          Lật thẻ
        </Button>
      )}
    </article>
  )
}
