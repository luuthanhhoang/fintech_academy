'use client'

import { useState, type ComponentType, type ReactNode } from 'react'
import type { QuizItem } from '@/lib/content/schema/quiz'
import { recordQuizAttempt } from '@/lib/db/repos/learning'
import type { QuizAttemptRecord } from '@/lib/db/types'
import { gradeQuiz, type GradeResult, type QuizAnswer } from '@/lib/quiz/grade'
import { useCatalogState } from '@/components/data/catalog-provider'
import { Button } from '@/components/ui/primitives'
import { canSubmit, ExplainView, initialAnswer, McqView, NumericView, OrderingView, type ViewProps } from './views'

const TYPE_LABEL: Record<QuizItem['type'], string> = {
  mcq: 'Trắc nghiệm',
  numeric: 'Điền số',
  ordering: 'Sắp xếp thứ tự',
  explain: 'Tự giải thích',
}

// Registry: quiz type → view component (no if/else on item names).
const VIEWS: { [K in QuizItem['type']]: ComponentType<ViewProps<K>> } = {
  mcq: McqView,
  numeric: NumericView,
  ordering: OrderingView,
  explain: ExplainView,
}

export interface QuizItemCardProps {
  item: QuizItem
  lessonId: string
  context: QuizAttemptRecord['context']
  index?: number
  onGraded?: (r: GradeResult) => void
  /** Extra UI for explain items (e.g. AI grading button when the tutor is enabled). */
  explainExtra?: (text: string) => ReactNode
}

export function QuizItemCard({ item, lessonId, context, index, onGraded, explainExtra }: QuizItemCardProps) {
  const state = useCatalogState()
  const [answer, setAnswer] = useState<QuizAnswer>(() => initialAnswer(item))
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const View = VIEWS[item.type] as ComponentType<ViewProps<QuizItem['type']>>

  const submit = async () => {
    if (state.status !== 'ready') return
    const r = gradeQuiz(item, answer)
    try {
      await recordQuizAttempt(state.catalog.config.srs, {
        itemId: item.id, conceptId: item.conceptId, lessonId, correct: r.correct, score: r.score, answeredAt: new Date(), context,
      })
      setResult(r)
      onGraded?.(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <article className="rounded-lg border border-rule bg-paper p-4 font-sans">
      <p className="text-xs uppercase tracking-wider text-ink-3">
        {index !== undefined && `Câu ${index + 1} · `}
        {TYPE_LABEL[item.type]}
      </p>
      <p className="mt-1 mb-3 font-medium">{item.prompt}</p>
      <View
        item={item as never}
        value={answer as never}
        onChange={(v: QuizAnswer) => setAnswer(v)}
        locked={result !== null}
        explainExtra={item.type === 'explain' && answer.type === 'explain' ? explainExtra?.(answer.text) : undefined}
      />
      {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
      {result === null ? (
        <Button variant="primary" className="mt-3" disabled={!canSubmit(answer) || state.status !== 'ready'} onClick={submit}>
          Kiểm tra
        </Button>
      ) : (
        <div role="status" className={`mt-3 rounded-md p-3 text-sm ${result.correct ? 'bg-good-soft' : 'bg-bad-soft'}`}>
          <p className={`font-medium ${result.correct ? 'text-good' : 'text-bad'}`}>
            {result.correct ? '✓ ' : '✗ '}
            {result.detail}
          </p>
          <p className="mt-1 text-ink-2">{item.explanation}</p>
          {item.type === 'explain' && <p className="mt-2 text-ink-2"><strong>Đáp án mẫu:</strong> {item.modelAnswer}</p>}
          {!result.correct && (
            <p className="mt-1 text-xs text-ink-3">
              {context === 'pretest' ? 'Đoán sai trước khi học là bình thường — đọc bài rồi gặp lại câu này ở cuối.' : 'Câu này đã được đưa vào thẻ ôn.'}
            </p>
          )}
          <button type="button" className="mt-2 text-xs underline" onClick={() => (setResult(null), setAnswer(initialAnswer(item)))}>
            Làm lại
          </button>
        </div>
      )}
    </article>
  )
}
