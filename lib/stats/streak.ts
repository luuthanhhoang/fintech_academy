/** Streak and study-time aggregation from real activity days. */
import { addDays, dayKey } from '../util/date'

/** Consecutive active days ending today (or yesterday if today has no activity yet). */
export function currentStreak(activeDays: ReadonlySet<string>, today: Date): number {
  let cursor = activeDays.has(dayKey(today)) ? today : addDays(today, -1)
  let n = 0
  while (activeDays.has(dayKey(cursor))) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function longestStreak(activeDays: ReadonlySet<string>): number {
  const days = [...activeDays].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    const expected = prev ? dayKey(addDays(new Date(`${prev}T12:00:00`), 1)) : null
    run = expected === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export function sumByDay<T>(rows: readonly T[], day: (r: T) => string, value: (r: T) => number): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) out.set(day(r), (out.get(day(r)) ?? 0) + value(r))
  return out
}

/** Last `n` day keys ending at `today` (oldest first). */
export function lastDays(today: Date, n: number): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(addDays(today, i - n + 1)))
}
