/**
 * Builds an interleaved practice set: quiz items mixed across concepts the learner has studied,
 * weighted toward weak concepts, with no two consecutive items from the same concept when avoidable.
 */
import type { PracticeConfig } from '../content/schema/learning'
import type { QuizItem } from '../content/schema/quiz'
import { mulberry32 } from '../finance/random'
import { hashString } from '../util/date'

export interface PracticeCandidate {
  item: QuizItem
  lessonId: string
}

export function interleave(
  pool: readonly PracticeCandidate[],
  studied: ReadonlySet<string>,
  scores: ReadonlyMap<string, number | null>,
  cfg: PracticeConfig,
  seed: string,
): PracticeCandidate[] {
  const rand = mulberry32(hashString(seed))
  const eligible = pool.filter((c) => studied.has(c.item.conceptId))
  const concepts = [...new Set(eligible.map((c) => c.item.conceptId))]
  if (concepts.length < cfg.minConcepts) return []
  const shuffled = [...eligible].sort(() => rand() - 0.5)
  const weakness = (c: PracticeCandidate) => {
    const s = scores.get(c.item.conceptId)
    return s === null || s === undefined ? 0.5 : 1 - s
  }
  const weakCount = Math.round(cfg.size * cfg.weakShare)
  const byWeak = [...shuffled].sort((a, b) => weakness(b) - weakness(a))
  const picked: PracticeCandidate[] = []
  const take = (c: PracticeCandidate | undefined) => c && !picked.includes(c) && picked.push(c)
  for (const c of byWeak.slice(0, weakCount)) take(c)
  for (const c of shuffled) {
    if (picked.length >= cfg.size) break
    take(c)
  }
  return spreadConcepts(picked.slice(0, cfg.size))
}

/** Reorders so that adjacent items come from different concepts whenever possible (greedy). */
export function spreadConcepts(items: readonly PracticeCandidate[]): PracticeCandidate[] {
  const rest = [...items]
  const out: PracticeCandidate[] = []
  while (rest.length) {
    const prev = out[out.length - 1]?.item.conceptId
    const i = rest.findIndex((c) => c.item.conceptId !== prev)
    out.push(...rest.splice(i === -1 ? 0 : i, 1))
  }
  return out
}
