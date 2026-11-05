/** Write operations for learning activity: cards, reviews, quiz attempts, lesson progress, marks. */
import type { SrsConfig } from '../../content/schema/config'
import { gradeFromScore, newCard, reviewCard, type Grade } from '../../srs/fsrs'
import { db } from '../dexie'
import type { CardKind, CardRecord, QuizAttemptRecord } from '../types'

export function cardId(kind: CardKind, refId: string): string {
  return `${kind}:${refId}`
}

export async function ensureCard(cfg: SrsConfig, kind: CardKind, refId: string, conceptId: string, now = new Date()): Promise<CardRecord> {
  const id = cardId(kind, refId)
  const existing = await db().cards.get(id)
  if (existing) return existing
  const record: CardRecord = { id, kind, refId, conceptId, createdAt: now, fsrs: await newCard(cfg, now) }
  await db().cards.put(record)
  return record
}

export async function applyReview(cfg: SrsConfig, card: CardRecord, grade: Grade, source: 'review' | 'quiz', now = new Date()) {
  const result = await reviewCard(cfg, card.fsrs, grade, now)
  await db().transaction('rw', db().cards, db().reviewLogs, async () => {
    await db().cards.put({ ...card, fsrs: result.card })
    await db().reviewLogs.add({
      cardId: card.id,
      conceptId: card.conceptId,
      grade,
      reviewedAt: now,
      source,
      scheduledDays: result.card.scheduledDays,
    })
  })
  return result.card
}

/**
 * Records a quiz attempt. A wrong answer creates a quiz card (so it comes back in review);
 * an existing quiz card is rescheduled from the attempt's score.
 */
export async function recordQuizAttempt(cfg: SrsConfig, attempt: Omit<QuizAttemptRecord, 'id'>) {
  await db().quizAttempts.add(attempt)
  const existing = await db().cards.get(cardId('quiz', attempt.itemId))
  if (existing) await applyReview(cfg, existing, gradeFromScore(attempt.score), 'quiz', attempt.answeredAt)
  else if (!attempt.correct) await ensureCard(cfg, 'quiz', attempt.itemId, attempt.conceptId, attempt.answeredAt)
}

export async function startLesson(lessonId: string, now = new Date()) {
  const existing = await db().progress.get(lessonId)
  if (!existing) await db().progress.put({ lessonId, status: 'started', startedAt: now, completedAt: null, scrollMax: 0 })
}

export async function updateScroll(lessonId: string, ratio: number) {
  const existing = await db().progress.get(lessonId)
  if (existing && ratio > existing.scrollMax) await db().progress.update(lessonId, { scrollMax: ratio })
}

/** Completing a lesson creates concept cards for every concept it teaches. */
export async function completeLesson(cfg: SrsConfig, lessonId: string, conceptIds: readonly string[], now = new Date()) {
  const existing = await db().progress.get(lessonId)
  await db().progress.put({
    lessonId,
    status: 'completed',
    startedAt: existing?.startedAt ?? now,
    completedAt: now,
    scrollMax: Math.max(existing?.scrollMax ?? 0, 1),
  })
  for (const c of conceptIds) await ensureCard(cfg, 'concept', c, c, now)
}

export async function toggleMark(cfg: SrsConfig, conceptId: string, lessonId: string, now = new Date()) {
  const existing = await db().marks.get(conceptId)
  if (existing) {
    await db().marks.delete(conceptId)
    return false
  }
  await db().marks.put({ conceptId, lessonId, markedAt: now })
  await ensureCard(cfg, 'concept', conceptId, conceptId, now)
  return true
}
