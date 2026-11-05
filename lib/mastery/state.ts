/** Concept states for roadmap/graph: planned, locked, available, learning, mastered. */
import type { MasteryConfig } from '../content/schema/config'
import type { ConceptScore } from './score'

export type ConceptState = 'planned' | 'locked' | 'available' | 'learning' | 'mastered'

export const CONCEPT_STATES: { id: ConceptState; label: string; en: string }[] = [
  { id: 'planned', label: 'Dự kiến', en: 'Planned' },
  { id: 'locked', label: 'Khoá', en: 'Locked' },
  { id: 'available', label: 'Mở', en: 'Available' },
  { id: 'learning', label: 'Đang học', en: 'Learning' },
  { id: 'mastered', label: 'Thành thạo', en: 'Mastered' },
]

export interface StateInput {
  concepts: readonly { id: string; prerequisites: readonly string[] }[]
  /** Concepts taught by at least one written (non-planned) lesson. */
  learnable: ReadonlySet<string>
  scores: ReadonlyMap<string, ConceptScore>
  /** Concepts with any activity (lesson started, quiz attempt, card, mark). */
  active: ReadonlySet<string>
}

export function blockingPrerequisites(id: string, input: StateInput, cfg: MasteryConfig): string[] {
  const concept = input.concepts.find((c) => c.id === id)
  if (!concept) return []
  return concept.prerequisites.filter((p) => {
    if (!input.learnable.has(p) && !cfg.plannedPrerequisitesBlock) return false
    const s = input.scores.get(p)?.score
    return s === null || s === undefined || s < cfg.unlockAt
  })
}

export function computeStates(input: StateInput, cfg: MasteryConfig): Map<string, ConceptState> {
  const out = new Map<string, ConceptState>()
  for (const c of input.concepts) {
    const score = input.scores.get(c.id)?.score ?? null
    if (!input.learnable.has(c.id)) out.set(c.id, 'planned')
    else if (score !== null && score >= cfg.masteredAt) out.set(c.id, 'mastered')
    else if (input.active.has(c.id)) out.set(c.id, 'learning')
    else if (blockingPrerequisites(c.id, input, cfg).length > 0) out.set(c.id, 'locked')
    else out.set(c.id, 'available')
  }
  return out
}
