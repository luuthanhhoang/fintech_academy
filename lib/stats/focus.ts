/** Focus statistics from recorded segments (real data only). */
import type { FocusSessionRecord } from '../db/types'
import { addDays, dayKey } from '../util/date'

export interface FocusStats {
  todayMinutes: number
  totalMinutes: number
  completed: number
  abandoned: number
  /** Consecutive days (ending today or yesterday) with at least one completed segment. */
  streakDays: number
  /** Minutes per day for the last `days` days, oldest first. */
  daily: { day: string; minutes: number }[]
}

export function focusStats(sessions: readonly FocusSessionRecord[], now: Date, days = 14): FocusStats {
  const byDay = new Map<string, number>()
  for (const s of sessions) byDay.set(s.day, (byDay.get(s.day) ?? 0) + s.focusedMs / 60_000)
  const completedDays = new Set(sessions.filter((s) => s.status === 'completed').map((s) => s.day))
  let streakDays = 0
  let cursor = completedDays.has(dayKey(now)) ? now : addDays(now, -1)
  while (completedDays.has(dayKey(cursor))) {
    streakDays++
    cursor = addDays(cursor, -1)
  }
  return {
    todayMinutes: byDay.get(dayKey(now)) ?? 0,
    totalMinutes: sessions.reduce((a, s) => a + s.focusedMs / 60_000, 0),
    completed: sessions.filter((s) => s.status === 'completed').length,
    abandoned: sessions.filter((s) => s.status === 'abandoned').length,
    streakDays,
    daily: Array.from({ length: days }, (_, i) => {
      const day = dayKey(addDays(now, i - days + 1))
      return { day, minutes: byDay.get(day) ?? 0 }
    }),
  }
}
