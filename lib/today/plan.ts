/** Builds the daily plan from catalog + learner state. Pure and deterministic for a given day. */
import type { Catalog, CatalogLesson } from '../content/catalog'
import { stageRank } from '../content/catalog'
import type { ConceptState } from '../mastery/state'
import { hashString } from '../util/date'

export interface PlanInput {
  catalog: Catalog
  states: ReadonlyMap<string, ConceptState>
  /** lessonId -> status */
  progress: ReadonlyMap<string, 'started' | 'completed'>
  dueCardIds: readonly string[]
  /** refIds of exercises/labs/cases already done or passed. */
  practiced: ReadonlySet<string>
  focusTrack: string | null
  day: string
}

export type PracticeItem =
  | { kind: 'lab'; id: string; lessonId: string }
  | { kind: 'exercise'; id: string; lessonId: string }

export interface DailyPlan {
  reviews: string[]
  lesson: CatalogLesson | null
  practice: PracticeItem | null
  caseId: string | null
  explainLesson: CatalogLesson | null
}

export function curriculumOrder(catalog: Catalog, focusTrack: string | null): CatalogLesson[] {
  const rank = stageRank(catalog.tracks)
  return catalog.lessons
    .filter((l) => !focusTrack || l.track === focusTrack)
    .sort((a, b) => (rank.get(a.stage) ?? 0) - (rank.get(b.stage) ?? 0) || a.order - b.order)
}

export function lessonUnlocked(lesson: CatalogLesson, states: ReadonlyMap<string, ConceptState>): boolean {
  return lesson.concepts.every((c) => states.get(c) !== 'locked')
}

export function nextLesson(input: PlanInput): CatalogLesson | null {
  const ordered = curriculumOrder(input.catalog, input.focusTrack)
  const started = ordered.find((l) => input.progress.get(l.id) === 'started')
  if (started) return started
  return ordered.find((l) => !input.progress.has(l.id) && lessonUnlocked(l, input.states)) ?? null
}

function rotate<T>(items: readonly T[], seed: string): T | null {
  if (items.length === 0) return null
  return items[hashString(seed) % items.length] ?? null
}

/** Lessons whose concepts the learner is working on (started or completed), most relevant first. */
function touchedLessons(input: PlanInput, fallback: CatalogLesson | null): CatalogLesson[] {
  const ordered = curriculumOrder(input.catalog, input.focusTrack)
  const touched = ordered.filter((l) => input.progress.has(l.id))
  return touched.length > 0 ? touched : fallback ? [fallback] : []
}

export function pickPractice(input: PlanInput, lessons: readonly CatalogLesson[]): PracticeItem | null {
  const labs: PracticeItem[] = lessons.flatMap((l) =>
    l.labs.filter((id) => !input.practiced.has(id)).map((id) => ({ kind: 'lab' as const, id, lessonId: l.id })),
  )
  if (labs.length > 0) return rotate(labs, `${input.day}:lab`)
  const exercises: PracticeItem[] = lessons.flatMap((l) =>
    l.exercises.filter((e) => !input.practiced.has(e.id)).map((e) => ({ kind: 'exercise' as const, id: e.id, lessonId: l.id })),
  )
  return rotate(exercises, `${input.day}:exercise`)
}

export function pickCase(input: PlanInput, lessons: readonly CatalogLesson[]): string | null {
  const related = [...new Set(lessons.flatMap((l) => l.cases))].filter((id) => !input.practiced.has(id))
  if (related.length > 0) return rotate(related, `${input.day}:case`)
  const remaining = input.catalog.cases.map((c) => c.id).filter((id) => !input.practiced.has(id))
  return rotate(remaining.length > 0 ? remaining : input.catalog.cases.map((c) => c.id), `${input.day}:case`)
}

export function buildDailyPlan(input: PlanInput, maxReviews: number): DailyPlan {
  const lesson = nextLesson(input)
  const lessons = touchedLessons(input, lesson)
  const completed = curriculumOrder(input.catalog, input.focusTrack).filter((l) => input.progress.get(l.id) === 'completed')
  return {
    reviews: input.dueCardIds.slice(0, maxReviews),
    lesson,
    practice: pickPractice(input, lessons),
    caseId: pickCase(input, lessons),
    explainLesson: rotate(completed, `${input.day}:explain`) ?? lesson,
  }
}
