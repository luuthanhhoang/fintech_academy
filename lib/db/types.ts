import type { FsrsCard } from '../srs/fsrs'

export type CardKind = 'concept' | 'quiz'

export interface CardRecord {
  id: string
  kind: CardKind
  refId: string
  conceptId: string
  createdAt: Date
  fsrs: FsrsCard
}

export interface ReviewLogRecord {
  id?: number
  cardId: string
  conceptId: string
  grade: number
  reviewedAt: Date
  source: 'review' | 'quiz'
  scheduledDays: number
}

export interface QuizAttemptRecord {
  id?: number
  itemId: string
  conceptId: string
  lessonId: string
  correct: boolean
  score: number
  answeredAt: Date
  context: 'lesson' | 'today' | 'review'
}

export interface LessonProgressRecord {
  lessonId: string
  status: 'started' | 'completed'
  startedAt: Date
  completedAt: Date | null
  scrollMax: number
}

export interface NoteRecord {
  id: string
  lessonId: string
  anchor: string | null
  text: string
  createdAt: Date
  updatedAt: Date
}

export interface MarkRecord {
  conceptId: string
  lessonId: string
  markedAt: Date
}

export interface StudySessionRecord {
  id?: number
  day: string
  startedAt: Date
  endedAt: Date
  activeMs: number
  path: string
}

export interface PracticeLogRecord {
  id?: number
  kind: 'exercise' | 'lab' | 'case'
  refId: string
  conceptIds: string[]
  result: 'done' | 'passed' | 'failed'
  detail: string | null
  at: Date
}

export interface SelfExplainRecord {
  id?: number
  targetId: string
  conceptIds: string[]
  text: string
  checked: string[]
  score: number
  aiFeedback: string | null
  createdAt: Date
}

export interface TodaySessionRecord {
  day: string
  completed: string[]
  drafts: Record<string, string>
  updatedAt: Date
}

export interface KeyValueRecord {
  key: string
  value: unknown
}
