/** Export / import of all learner data as JSON (API keys are never exported). */
import { z } from 'zod'
import { BACKUP_TABLES, db, type BackupTable } from './dexie'

export const BACKUP_APP = 'finai-academy'
export const BACKUP_SCHEMA_VERSION = 1

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

/** Dates are tagged explicitly so they survive JSON without guessing from strings. */
export function encodeDates(value: unknown): Json {
  if (value instanceof Date) return { $date: value.toISOString() }
  if (Array.isArray(value)) return value.map(encodeDates)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeDates(v)]))
  }
  return value as Json
}

export function decodeDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeDates)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    if (keys.length === 1 && keys[0] === '$date' && typeof obj.$date === 'string') return new Date(obj.$date)
    return Object.fromEntries(keys.map((k) => [k, decodeDates(obj[k])]))
  }
  return value
}

const row = z.record(z.string(), z.unknown())
const REQUIRED_KEYS: Record<BackupTable, string[]> = {
  cards: ['id', 'kind', 'refId', 'conceptId', 'fsrs'],
  reviewLogs: ['cardId', 'grade', 'reviewedAt'],
  quizAttempts: ['itemId', 'conceptId', 'score', 'answeredAt'],
  progress: ['lessonId', 'status'],
  notes: ['id', 'lessonId', 'text'],
  marks: ['conceptId', 'lessonId'],
  studySessions: ['day', 'activeMs'],
  practiceLogs: ['kind', 'refId', 'result'],
  selfExplains: ['targetId', 'text', 'score'],
  todaySessions: ['day', 'completed'],
  settings: ['key'],
}

export const BackupSchema = z.object({
  app: z.literal(BACKUP_APP),
  schemaVersion: z.number().int().min(1).max(BACKUP_SCHEMA_VERSION),
  exportedAt: z.union([z.string(), z.date()]),
  tables: z.object(Object.fromEntries(BACKUP_TABLES.map((t) => [t, z.array(row).default([])])) as Record<BackupTable, z.ZodDefault<z.ZodArray<typeof row>>>),
})
export type Backup = z.infer<typeof BackupSchema>

export function validateBackup(data: unknown): { ok: true; backup: Backup } | { ok: false; error: string } {
  const parsed = BackupSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
  for (const t of BACKUP_TABLES) {
    const missing = parsed.data.tables[t].findIndex((r) => REQUIRED_KEYS[t].some((k) => !(k in r)))
    if (missing !== -1) return { ok: false, error: `Bảng ${t}, dòng ${missing + 1} thiếu trường bắt buộc (${REQUIRED_KEYS[t].join(', ')})` }
  }
  return { ok: true, backup: parsed.data }
}

export async function exportBackup(now = new Date()): Promise<string> {
  const tables: Record<string, unknown[]> = {}
  for (const t of BACKUP_TABLES) tables[t] = await db().table(t).toArray()
  return JSON.stringify(encodeDates({ app: BACKUP_APP, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: now, tables }), null, 1)
}

export type ImportMode = 'replace' | 'merge'

/** Imports a validated backup. "replace" clears tables first; "merge" upserts by primary key. */
export async function importBackup(text: string, mode: ImportMode): Promise<{ ok: true; counts: Record<string, number> } | { ok: false; error: string }> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ.' }
  }
  const decoded = decodeDates(raw)
  const check = validateBackup(decoded)
  if (!check.ok) return check
  const counts: Record<string, number> = {}
  const tables = BACKUP_TABLES.map((t) => db().table(t))
  await db().transaction('rw', tables, async () => {
    for (const t of BACKUP_TABLES) {
      const table = db().table(t)
      if (mode === 'replace') await table.clear()
      await table.bulkPut(check.backup.tables[t])
      counts[t] = check.backup.tables[t].length
    }
  })
  return { ok: true, counts }
}

export async function clearAllData() {
  await db().transaction('rw', [...BACKUP_TABLES.map((t) => db().table(t)), db().secrets], async () => {
    for (const t of BACKUP_TABLES) await db().table(t).clear()
    await db().secrets.clear()
  })
}
