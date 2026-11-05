/** Turns today's plan into tasks for the segments of a focus journey, in the order focus.yaml configures. */
import type { Catalog } from '../content/catalog'
import type { FocusConfig } from '../content/schema/world'
import type { FocusTask } from '../db/types'
import type { DailyPlan } from '../today/plan'

export function taskFor(block: FocusTask['block'], plan: DailyPlan, catalog: Catalog, dueCount: number): FocusTask | null {
  const lessonOf = (id: string) => catalog.lessons.find((l) => l.id === id)
  switch (block) {
    case 'reviews': {
      if (plan.reviews.length === 0) return null
      return { block, label: `Ôn ${Math.min(dueCount, plan.reviews.length)} thẻ đến hạn`, href: '/review/', conceptIds: [] }
    }
    case 'lesson':
      return plan.lesson ? { block, label: `Học bài: ${plan.lesson.title.vi}`, href: `/lessons/${plan.lesson.id}/`, conceptIds: plan.lesson.concepts } : null
    case 'practice': {
      const p = plan.practice
      if (!p) return null
      const lesson = lessonOf(p.lessonId)
      if (p.kind === 'lab') {
        const lab = catalog.labs.find((x) => x.id === p.id)
        return lab ? { block, label: `Code lab: ${lab.title.vi}`, href: `/labs/${lab.id}/`, conceptIds: lab.concepts } : null
      }
      return lesson ? { block, label: `Bài tập trong: ${lesson.title.vi}`, href: `/lessons/${lesson.id}/#bai-tap`, conceptIds: lesson.concepts } : null
    }
    case 'interleave':
      return { block, label: 'Luyện tập xen kẽ', href: '/practice/', conceptIds: [] }
    case 'case': {
      const c = catalog.cases.find((x) => x.id === plan.caseId)
      return c ? { block, label: `Case: ${c.title.vi}`, href: `/cases/${c.id}/`, conceptIds: c.concepts } : null
    }
    case 'explain': {
      const l = plan.explainLesson
      return l ? { block, label: `Tự giải thích lại: ${l.title.vi}`, href: `/lessons/${l.id}/#tu-giai-thich`, conceptIds: l.concepts } : null
    }
  }
}

/** One task per segment; segments beyond the available tasks are free study (null). */
export function journeyTasks(cfg: FocusConfig, plan: DailyPlan, catalog: Catalog, dueCount: number, segments: number): (FocusTask | null)[] {
  const tasks = cfg.taskSources.map((b) => taskFor(b, plan, catalog, dueCount)).filter((t): t is FocusTask => t !== null)
  return Array.from({ length: segments }, (_, i) => tasks[i] ?? null)
}

/** The region a journey belongs to: the track of the first task with concepts, else the learner's focus track. */
export function journeyRegion(catalog: Catalog, tasks: readonly (FocusTask | null)[], focusTrack: string | null): string | null {
  const conceptId = tasks.flatMap((t) => t?.conceptIds ?? [])[0]
  const track = catalog.concepts.find((c) => c.id === conceptId)?.track ?? focusTrack
  return catalog.world.map.regions.find((r) => r.track === track)?.id ?? null
}
