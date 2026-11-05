/** Maps real learning state to what the village shows: crop growth, weeds, lit windows. */
import type { ConceptScore } from '../mastery/score'
import type { ConceptState } from '../mastery/state'

export interface PlotHealth {
  /** 0 = bare soil, 1 = full green crop. */
  growth: number
  /** True when memory has decayed (retention measured and below the unlock threshold). */
  weeds: boolean
  /** Window light: the concept is mastered. */
  lit: boolean
  state: ConceptState
  /** Short explanation shown in the plot panel. */
  reason: string
}

export function plotHealth(state: ConceptState, score: ConceptScore | undefined, unlockAt: number): PlotHealth {
  const retention = score?.retention ?? null
  const value = score?.score ?? null
  if (state === 'planned') return { growth: 0, weeds: false, lit: false, state, reason: 'Khái niệm thuộc bài chưa viết — đất còn để trống.' }
  if (state === 'locked') return { growth: 0, weeds: false, lit: false, state, reason: 'Chưa đủ tiền đề — học khái niệm nền trước.' }
  if (value === null) return { growth: 0.08, weeds: false, lit: false, state, reason: 'Chưa có dữ liệu học — mới gieo hạt.' }
  const weeds = retention !== null && retention < unlockAt
  const reason = weeds
    ? `Khả năng nhớ ước tính ${Math.round(retention * 100)}% — cỏ dại mọc, nên ôn lại.`
    : `Điểm thành thạo ${Math.round(value * 100)}%${retention !== null ? `, khả năng nhớ ${Math.round(retention * 100)}%` : ''}.`
  return { growth: Math.max(0.12, value), weeds, lit: state === 'mastered', state, reason }
}
