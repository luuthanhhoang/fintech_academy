'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { getTodaySession } from '@/lib/db/repos/activity'
import { buildDailyPlan, type DailyPlan } from '@/lib/today/plan'
import { dayKey } from '@/lib/util/date'
import { useMastery } from '@/components/data/use-learner'

export interface TodayData {
  day: string
  plan: DailyPlan
  dueCount: number
  completed: Set<string>
  drafts: Record<string, string>
}

/** Everything the Today page needs, derived live from IndexedDB + catalog. */
export function useToday(catalog: Catalog): TodayData | null {
  const mastery = useMastery(catalog)
  const day = dayKey(new Date())
  const live = useLiveQuery(async () => {
    const start = new Date(`${day}T00:00:00`)
    const [session, due, practice, explains, focus] = await Promise.all([
      getTodaySession(day),
      db().cards.where('fsrs.dueAt').belowOrEqual(new Date()).sortBy('fsrs.dueAt'),
      db().practiceLogs.toArray(),
      db().selfExplains.where('createdAt').aboveOrEqual(start).count(),
      db().settings.get('focusTrack'),
    ])
    return { session, due, practice, explains, focus: typeof focus?.value === 'string' ? focus.value : null, start }
  }, [day])

  return useMemo(() => {
    if (!live || mastery.status !== 'ready') return null
    const progress = new Map(mastery.records.progress.map((p) => [p.lessonId, p.status]))
    const practiced = new Set(live.practice.filter((p) => p.result !== 'failed').map((p) => p.refId))
    const plan = buildDailyPlan(
      { catalog, states: mastery.states, progress, dueCardIds: live.due.map((c) => c.id), practiced, focusTrack: live.focus, day },
      catalog.config.today.maxReviews,
    )
    const todayPractice = live.practice.filter((p) => p.at >= live.start)
    const auto = new Set<string>()
    if (plan.reviews.length === 0) auto.add('reviews')
    if (mastery.records.progress.some((p) => p.completedAt && p.completedAt >= live.start)) auto.add('lesson')
    if (todayPractice.some((p) => p.kind !== 'case')) auto.add('practice')
    if (todayPractice.some((p) => p.kind === 'case')) auto.add('case')
    if (live.explains > 0) auto.add('explain')
    return { day, plan, dueCount: live.due.length, completed: new Set([...live.session.completed, ...auto]), drafts: live.session.drafts }
  }, [live, mastery, catalog, day])
}
