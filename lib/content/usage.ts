/** Which lessons (and so which tracks) use a simulator, lab, case or scenario — pure, for hub pages. */
import type { Lesson } from './types'

export type PracticeKind = 'simulators' | 'labs' | 'cases' | 'scenarios'

export function lessonsUsing(lessons: readonly Lesson[], kind: PracticeKind, id: string): Lesson[] {
  return lessons.filter((l) => l[kind].includes(id))
}

/** Track ids in first-use order, without repeats. */
export function tracksUsing(lessons: readonly Lesson[], kind: PracticeKind, id: string): string[] {
  return [...new Set(lessonsUsing(lessons, kind, id).map((l) => l.track))]
}
