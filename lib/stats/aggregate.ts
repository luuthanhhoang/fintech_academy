/** Aggregations for the stats page, from raw IndexedDB rows. Pure. */
import type { ReviewLogRecord, StudySessionRecord, QuizAttemptRecord, PracticeLogRecord, SelfExplainRecord, LessonProgressRecord } from '../db/types'
import { dayKey } from '../util/date'
import { currentStreak, lastDays, longestStreak, sumByDay } from './streak'

export interface StatsInput {
  sessions: readonly StudySessionRecord[]
  reviews: readonly ReviewLogRecord[]
  attempts: readonly QuizAttemptRecord[]
  practice: readonly PracticeLogRecord[]
  explains: readonly SelfExplainRecord[]
  progress: readonly LessonProgressRecord[]
}

export function activeDays(i: StatsInput): Set<string> {
  return new Set([
    ...i.sessions.filter((s) => s.activeMs > 0).map((s) => s.day),
    ...i.reviews.map((r) => dayKey(r.reviewedAt)),
    ...i.attempts.map((a) => dayKey(a.answeredAt)),
    ...i.practice.map((p) => dayKey(p.at)),
    ...i.explains.map((e) => dayKey(e.createdAt)),
  ])
}

export function summarizeStats(i: StatsInput, today: Date, windowDays: number) {
  const days = activeDays(i)
  const minutes = sumByDay(i.sessions, (s) => s.day, (s) => s.activeMs / 60000)
  const reviewsByDay = sumByDay(i.reviews, (r) => dayKey(r.reviewedAt), () => 1)
  const window = lastDays(today, windowDays)
  const gradeCounts = [1, 2, 3, 4].map((g) => i.reviews.filter((r) => r.grade === g).length)
  const correct = i.attempts.filter((a) => a.correct).length
  return {
    streak: currentStreak(days, today),
    longest: longestStreak(days),
    activeDayCount: days.size,
    totalMs: i.sessions.reduce((a, s) => a + s.activeMs, 0),
    daily: window.map((d) => ({ day: d, minutes: minutes.get(d) ?? 0, reviews: reviewsByDay.get(d) ?? 0, active: days.has(d) })),
    gradeCounts,
    reviewsTotal: i.reviews.length,
    quizTotal: i.attempts.length,
    quizAccuracy: i.attempts.length ? correct / i.attempts.length : null,
    lessonsCompleted: i.progress.filter((p) => p.status === 'completed').length,
    labsPassed: new Set(i.practice.filter((p) => p.kind === 'lab' && p.result === 'passed').map((p) => p.refId)).size,
  }
}
