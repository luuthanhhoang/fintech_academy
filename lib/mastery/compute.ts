/** Composes learner records into per-concept scores and states. Pure: retrievability is precomputed. */
import type { Catalog } from '../content/catalog'
import type { CardRecord, LessonProgressRecord, MarkRecord, QuizAttemptRecord } from '../db/types'
import { conceptScore, type ConceptScore } from './score'
import { computeStates, type ConceptState } from './state'

export interface LearnerSnapshot {
  attempts: readonly QuizAttemptRecord[]
  cards: readonly CardRecord[]
  /** cardId → retrievability now (only reviewed cards). */
  retrievability: ReadonlyMap<string, number>
  progress: readonly LessonProgressRecord[]
  marks: readonly MarkRecord[]
}

export interface MasteryView {
  scores: Map<string, ConceptScore>
  states: Map<string, ConceptState>
  learnable: Set<string>
}

function groupBy<T>(rows: readonly T[], key: (r: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const r of rows) out.set(key(r), [...(out.get(key(r)) ?? []), r])
  return out
}

export function computeMastery(catalog: Catalog, snap: LearnerSnapshot, now: Date): MasteryView {
  const cfg = catalog.config.mastery
  const learnable = new Set(catalog.lessons.flatMap((l) => l.concepts))
  const scored = snap.attempts.filter((a) => a.context !== 'pretest')
  const attemptsBy = groupBy(scored, (a) => a.conceptId)
  const cardsBy = groupBy(snap.cards, (c) => c.conceptId)
  const scores = new Map<string, ConceptScore>()
  for (const c of catalog.concepts) {
    const rs = (cardsBy.get(c.id) ?? []).map((card) => snap.retrievability.get(card.id)).filter((r): r is number => r !== undefined)
    scores.set(c.id, conceptScore(attemptsBy.get(c.id) ?? [], rs, cfg, now))
  }
  const lessonConcepts = new Map(catalog.lessons.map((l) => [l.id, l.concepts]))
  const active = new Set<string>([
    ...scored.map((a) => a.conceptId),
    ...snap.cards.map((c) => c.conceptId),
    ...snap.marks.map((m) => m.conceptId),
    ...snap.progress.flatMap((p) => lessonConcepts.get(p.lessonId) ?? []),
  ])
  const states = computeStates({ concepts: catalog.concepts, learnable, scores, active }, cfg)
  return { scores, states, learnable }
}

/** Mean score per stage over concepts that have data; null when no concept in the stage has data. */
export function stageMastery(catalog: Catalog, scores: ReadonlyMap<string, ConceptScore>) {
  return catalog.tracks.flatMap((t) =>
    t.stages.map((s) => {
      const concepts = catalog.concepts.filter((c) => c.stage === s.id)
      const withData = concepts.map((c) => scores.get(c.id)?.score).filter((x): x is number => x !== null && x !== undefined)
      return {
        trackId: t.id,
        stageId: s.id,
        title: s.title,
        total: concepts.length,
        measured: withData.length,
        mean: withData.length ? withData.reduce((a, b) => a + b, 0) / withData.length : null,
      }
    }),
  )
}
