/** Notes, practice logs, self-explanations, today session, study time and settings. */
import { dayKey } from '../../util/date'
import { db } from '../dexie'
import type { PracticeLogRecord, SelfExplainRecord, TodaySessionRecord } from '../types'

export async function saveNote(lessonId: string, anchor: string | null, text: string, id?: string) {
  const now = new Date()
  const noteId = id ?? `${lessonId}:${now.getTime()}`
  const existing = id ? await db().notes.get(id) : undefined
  await db().notes.put({ id: noteId, lessonId, anchor, text, createdAt: existing?.createdAt ?? now, updatedAt: now })
  return noteId
}

export async function deleteNote(id: string) {
  await db().notes.delete(id)
}

export async function logPractice(entry: Omit<PracticeLogRecord, 'id' | 'at'>, at = new Date()) {
  await db().practiceLogs.add({ ...entry, at })
}

export async function saveSelfExplain(entry: Omit<SelfExplainRecord, 'id' | 'createdAt'>, at = new Date()) {
  return db().selfExplains.add({ ...entry, createdAt: at })
}

export async function getTodaySession(day: string): Promise<TodaySessionRecord> {
  return (await db().todaySessions.get(day)) ?? { day, completed: [], drafts: {}, updatedAt: new Date() }
}

export async function markTodayBlock(day: string, blockId: string, done: boolean) {
  const s = await getTodaySession(day)
  const completed = done ? [...new Set([...s.completed, blockId])] : s.completed.filter((b) => b !== blockId)
  await db().todaySessions.put({ ...s, completed, updatedAt: new Date() })
}

export async function saveTodayDraft(day: string, key: string, text: string) {
  const s = await getTodaySession(day)
  await db().todaySessions.put({ ...s, drafts: { ...s.drafts, [key]: text }, updatedAt: new Date() })
}

/** Appends active study time; consecutive flushes on the same page/day merge into one session row. */
export async function addStudyTime(path: string, activeMs: number, end = new Date()) {
  if (activeMs <= 0) return
  const day = dayKey(end)
  const last = await db().studySessions.where('day').equals(day).last()
  if (last && last.path === path && end.getTime() - last.endedAt.getTime() < 5 * 60_000) {
    await db().studySessions.update(last.id as number, { endedAt: end, activeMs: last.activeMs + activeMs })
  } else {
    await db().studySessions.add({ day, startedAt: new Date(end.getTime() - activeMs), endedAt: end, activeMs, path })
  }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db().settings.get(key)
  return row ? (row.value as T) : fallback
}

export async function setSetting(key: string, value: unknown) {
  await db().settings.put({ key, value })
}
