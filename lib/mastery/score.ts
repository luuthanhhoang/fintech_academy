/** Mastery score per concept from real activity only. Returns null components when there is no data. */
import type { MasteryConfig } from '../content/schema/config'
import { daysBetween } from '../util/date'

export interface AttemptLike {
  score: number
  answeredAt: Date
}

export interface ConceptScore {
  score: number | null
  quiz: number | null
  retention: number | null
  attempts: number
  reviewedCards: number
}

/** Exponentially time-decayed mean: recent attempts weigh more (half-life in days). */
export function decayedAccuracy(attempts: readonly AttemptLike[], halfLifeDays: number, now: Date): number | null {
  if (attempts.length === 0) return null
  let wSum = 0
  let sum = 0
  for (const a of attempts) {
    const w = Math.pow(0.5, Math.max(0, daysBetween(a.answeredAt, now)) / halfLifeDays)
    wSum += w
    sum += w * a.score
  }
  return wSum > 0 ? sum / wSum : null
}

export function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length
}

export function combineScore(quiz: number | null, retention: number | null, cfg: MasteryConfig): number | null {
  if (quiz === null && retention === null) return null
  if (quiz === null) return retention
  if (retention === null) return quiz
  const total = cfg.weights.quiz + cfg.weights.retention
  if (total === 0) return (quiz + retention) / 2
  return (cfg.weights.quiz * quiz + cfg.weights.retention * retention) / total
}

export function conceptScore(
  attempts: readonly AttemptLike[],
  retrievabilities: readonly number[],
  cfg: MasteryConfig,
  now: Date,
): ConceptScore {
  const quiz = attempts.length >= cfg.minQuizAttempts ? decayedAccuracy(attempts, cfg.quizHalfLifeDays, now) : null
  const retention = mean(retrievabilities)
  return {
    score: combineScore(quiz, retention, cfg),
    quiz,
    retention,
    attempts: attempts.length,
    reviewedCards: retrievabilities.length,
  }
}
