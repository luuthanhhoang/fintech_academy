/** Thin wrapper over ts-fsrs so the rest of the app depends on a small, stable surface. */
import { DefaultScheduler, Rating } from 'ts-fsrs'
import type { SrsConfig } from '../content/schema/config'

export type Grade = 1 | 2 | 3 | 4
export const GRADES: { grade: Grade; label: string; en: string }[] = [
  { grade: Rating.Again as Grade, label: 'Quên', en: 'Again' },
  { grade: Rating.Hard as Grade, label: 'Khó', en: 'Hard' },
  { grade: Rating.Good as Grade, label: 'Nhớ', en: 'Good' },
  { grade: Rating.Easy as Grade, label: 'Dễ', en: 'Easy' },
]

const createScheduler = (cfg: SrsConfig) =>
  DefaultScheduler({
    version: 'FSRS-7',
    desiredRetention: cfg.requestRetention,
    maximumInterval: cfg.maximumIntervalDays,
    enableFuzz: cfg.enableFuzz,
  })
type Scheduler = Awaited<ReturnType<typeof createScheduler>>
export type FsrsCard = ReturnType<Scheduler['review']>['card']
export type FsrsRevlog = ReturnType<Scheduler['review']>['revlog']

let cached: { key: string; scheduler: Promise<Scheduler> } | null = null

export function getScheduler(cfg: SrsConfig): Promise<Scheduler> {
  const key = JSON.stringify(cfg)
  if (!cached || cached.key !== key) {
    cached = {
      key,
      scheduler: createScheduler(cfg),
    }
  }
  return cached.scheduler
}

const DATE_FIELDS = ['dueAt', 'lastReviewAt', 'reviewTime'] as const

/** Revives Date fields after JSON round-trips (backup import). */
export function reviveDates<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = { ...obj }
  for (const f of DATE_FIELDS) {
    const v = out[f]
    if (typeof v === 'string') out[f] = new Date(v)
  }
  return out as T
}

export async function newCard(cfg: SrsConfig, now: Date): Promise<FsrsCard> {
  return (await getScheduler(cfg)).newCard({ now })
}

export async function reviewCard(cfg: SrsConfig, card: FsrsCard, grade: Grade, now: Date) {
  const s = await getScheduler(cfg)
  return s.review({ card: reviveDates(card), grade, now })
}

/** Predicted next interval (days) per grade, for showing on review buttons. */
export async function previewIntervals(cfg: SrsConfig, card: FsrsCard, now: Date): Promise<Record<Grade, number>> {
  const s = await getScheduler(cfg)
  const out = {} as Record<Grade, number>
  for (const item of s.preview({ card: reviveDates(card), now })) {
    out[item.grade as Grade] = s.chrono.difference(now, item.card.dueAt)
  }
  return out
}

/** Probability of recall now (0..1), or null for a card never reviewed. */
export async function retrievability(cfg: SrsConfig, card: FsrsCard, now: Date): Promise<number | null> {
  const c = reviveDates(card)
  if (!c.lastReviewAt) return null
  const s = await getScheduler(cfg)
  return s.model.forgettingCurve(c, s.chrono.difference(c.lastReviewAt, now))
}

/** Maps an auto-graded quiz score to an FSRS grade. */
export function gradeFromScore(score: number): Grade {
  if (score >= 1) return 3
  if (score >= 0.5) return 2
  return 1
}
