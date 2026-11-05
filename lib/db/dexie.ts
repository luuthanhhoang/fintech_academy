/** IndexedDB schema (Dexie). Bump the version and add an upgrade when changing indexes. */
import Dexie, { type EntityTable } from 'dexie'
import type {
  CardRecord, FocusSessionRecord, KeyValueRecord, LessonProgressRecord, MarkRecord, NoteRecord, PracticeLogRecord, QuizAttemptRecord,
  ReviewLogRecord, SelfExplainRecord, StudySessionRecord, TodaySessionRecord,
} from './types'

export class AcademyDB extends Dexie {
  cards!: EntityTable<CardRecord, 'id'>
  reviewLogs!: EntityTable<ReviewLogRecord, 'id'>
  quizAttempts!: EntityTable<QuizAttemptRecord, 'id'>
  progress!: EntityTable<LessonProgressRecord, 'lessonId'>
  notes!: EntityTable<NoteRecord, 'id'>
  marks!: EntityTable<MarkRecord, 'conceptId'>
  studySessions!: EntityTable<StudySessionRecord, 'id'>
  practiceLogs!: EntityTable<PracticeLogRecord, 'id'>
  selfExplains!: EntityTable<SelfExplainRecord, 'id'>
  todaySessions!: EntityTable<TodaySessionRecord, 'day'>
  focusSessions!: EntityTable<FocusSessionRecord, 'id'>
  settings!: EntityTable<KeyValueRecord, 'key'>
  secrets!: EntityTable<KeyValueRecord, 'key'>

  constructor(name = 'finai-academy') {
    super(name)
    this.version(1).stores({
      cards: 'id, kind, conceptId, fsrs.dueAt',
      reviewLogs: '++id, cardId, conceptId, reviewedAt',
      quizAttempts: '++id, itemId, conceptId, lessonId, answeredAt',
      progress: 'lessonId, status',
      notes: 'id, lessonId, updatedAt',
      marks: 'conceptId, lessonId',
      studySessions: '++id, day',
      practiceLogs: '++id, kind, refId, at',
      selfExplains: '++id, targetId, createdAt',
      todaySessions: 'day',
      settings: 'key',
      secrets: 'key',
    })
    // v2: focus journeys (village). Additive table, no data migration needed.
    this.version(2).stores({ focusSessions: '++id, day, status, startedAt' })
  }
}

let instance: AcademyDB | null = null

export function db(): AcademyDB {
  if (!instance) instance = new AcademyDB()
  return instance
}

/** For tests: swap the database (e.g. a fake-indexeddb instance with a unique name). */
export function setDb(next: AcademyDB) {
  instance = next
}

/** Table names included in backups, excluding secrets on purpose. */
export const BACKUP_TABLES = [
  'cards', 'reviewLogs', 'quizAttempts', 'progress', 'notes', 'marks', 'studySessions', 'practiceLogs',
  'selfExplains', 'todaySessions', 'focusSessions', 'settings',
] as const
export type BackupTable = (typeof BACKUP_TABLES)[number]
