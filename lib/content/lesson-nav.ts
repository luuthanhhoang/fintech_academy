/** Navigation around a lesson (pure): the lessons of its stage, and the previous/next written lesson in the track. */
import type { ContentBundle } from './types'

export interface RailItem {
  id: string
  title: string
  minutes: number | null
  written: boolean
}

export interface LessonNav {
  stageLessons: RailItem[]
  prev: { id: string; title: string } | null
  next: { id: string; title: string } | null
}

export function lessonNav(b: Pick<ContentBundle, 'lessons' | 'planned' | 'tracks'>, lessonId: string): LessonNav | null {
  const lesson = b.lessons.find((l) => l.id === lessonId)
  if (!lesson) return null
  const track = b.tracks.find((t) => t.id === lesson.track)
  const stageOrder = new Map((track?.stages ?? []).map((s) => [s.id, s.order]))
  const inStage = [
    ...b.lessons.filter((l) => l.track === lesson.track && l.stage === lesson.stage).map((l) => ({ order: l.order, item: { id: l.id, title: l.title.vi, minutes: l.estMinutes, written: true } })),
    ...b.planned.filter((p) => p.track === lesson.track && p.stage === lesson.stage).map((p) => ({ order: p.order, item: { id: p.id, title: p.title.vi, minutes: null, written: false } })),
  ].sort((a, c) => a.order - c.order)
  const sequence = b.lessons
    .filter((l) => l.track === lesson.track)
    .sort((a, c) => (stageOrder.get(a.stage) ?? 0) - (stageOrder.get(c.stage) ?? 0) || a.order - c.order)
  const i = sequence.findIndex((l) => l.id === lessonId)
  const pick = (l: (typeof sequence)[number] | undefined) => (l ? { id: l.id, title: l.title.vi } : null)
  return { stageLessons: inStage.map((x) => x.item), prev: pick(sequence[i - 1]), next: pick(sequence[i + 1]) }
}
