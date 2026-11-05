/** Pure grading for every quiz item type. Score is in [0, 1]. */
import type { QuizItem } from '../content/schema/quiz'

export type QuizAnswer =
  | { type: 'mcq'; selected: string[] }
  | { type: 'numeric'; value: number }
  | { type: 'ordering'; order: string[] }
  | { type: 'explain'; text: string; checked: string[] }

export interface GradeResult {
  correct: boolean
  score: number
  detail: string
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}

export function withinTolerance(answer: number, expected: number, kind: 'abs' | 'rel', tol: number): boolean {
  if (!Number.isFinite(answer)) return false
  const diff = Math.abs(answer - expected)
  return kind === 'abs' ? diff <= tol : diff <= tol * Math.abs(expected)
}

/** Fraction of adjacent pairs in the right relative order (partial credit for ordering). */
export function orderingScore(order: readonly string[], correct: readonly string[]): number {
  if (correct.length < 2) return order[0] === correct[0] ? 1 : 0
  let good = 0
  for (let i = 0; i < correct.length - 1; i++) {
    const a = order.indexOf(correct[i] as string)
    const b = order.indexOf(correct[i + 1] as string)
    if (a !== -1 && b !== -1 && a < b) good++
  }
  return good / (correct.length - 1)
}

/** Threshold at which a self-graded explanation counts as correct. */
export const EXPLAIN_PASS_RATIO = 1

export function gradeQuiz(item: QuizItem, answer: QuizAnswer): GradeResult {
  if (item.type !== answer.type) throw new Error(`Kiểu đáp án ${answer.type} không khớp câu ${item.type}`)
  switch (item.type) {
    case 'mcq': {
      const a = answer as Extract<QuizAnswer, { type: 'mcq' }>
      const ok = sameSet(a.selected, item.correct)
      return { correct: ok, score: ok ? 1 : 0, detail: ok ? 'Đúng' : 'Chưa đúng' }
    }
    case 'numeric': {
      const a = answer as Extract<QuizAnswer, { type: 'numeric' }>
      const ok = withinTolerance(a.value, item.answer, item.tolerance.kind, item.tolerance.value)
      return { correct: ok, score: ok ? 1 : 0, detail: ok ? 'Trong dung sai' : `Đáp án: ${item.answer}${item.unit ? ' ' + item.unit : ''}` }
    }
    case 'ordering': {
      const a = answer as Extract<QuizAnswer, { type: 'ordering' }>
      const correctOrder = item.items.map((x) => x.id)
      const score = orderingScore(a.order, correctOrder)
      const ok = a.order.join() === correctOrder.join()
      return { correct: ok, score, detail: ok ? 'Đúng thứ tự' : `Đúng ${Math.round(score * 100)}% cặp liền kề` }
    }
    case 'explain': {
      const a = answer as Extract<QuizAnswer, { type: 'explain' }>
      const met = item.rubric.filter((r) => a.checked.includes(r.id)).length
      const score = met / item.rubric.length
      return { correct: score >= EXPLAIN_PASS_RATIO, score, detail: `Đạt ${met}/${item.rubric.length} tiêu chí` }
    }
  }
}

/** Deterministic shuffle (seeded by item id) so the same item renders identically across renders. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift() as T)
  return out
}
