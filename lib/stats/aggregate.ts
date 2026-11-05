/** Aggregations for the stats page, from raw IndexedDB rows. Pure. */
import type { LessonProgressRecord, PracticeLogRecord, QuizAttemptRecord, ReviewLogRecord, SelfExplainRecord, StudySessionRecord } from '../db/types'
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

export interface PretestProgress {
  items: number
  wrongThenRight: number
  rightThenRight: number
  stillWrong: number
  notRetested: number
}

/** Compares each item's first pretest guess with the latest later scored attempt (real learning gain). */
export function pretestProgress(attempts: readonly QuizAttemptRecord[]): PretestProgress {
  const out: PretestProgress = { items: 0, wrongThenRight: 0, rightThenRight: 0, stillWrong: 0, notRetested: 0 }
  const byItem = new Map<string, QuizAttemptRecord[]>()
  for (const a of attempts) byItem.set(a.itemId, [...(byItem.get(a.itemId) ?? []), a])
  for (const rows of byItem.values()) {
    const sorted = [...rows].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime())
    const pre = sorted.find((a) => a.context === 'pretest')
    if (!pre) continue
    out.items++
    const post = sorted.filter((a) => a.context !== 'pretest' && a.answeredAt >= pre.answeredAt).at(-1)
    if (!post) out.notRetested++
    else if (post.correct) out[pre.correct ? 'rightThenRight' : 'wrongThenRight']++
    else out.stillWrong++
  }
  return out
}
