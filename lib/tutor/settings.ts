/** Tutor settings (IndexedDB) and API key storage: persisted (IndexedDB) or session-only (memory). */
import { z } from 'zod'
import { db } from '../db/dexie'

export const TutorSettingsSchema = z.object({
  enabled: z.boolean(),
  providerId: z.string(),
  model: z.string(),
  baseURL: z.string(),
  keyStorage: z.enum(['indexeddb', 'session']),
})
export type TutorSettings = z.infer<typeof TutorSettingsSchema>

const SETTINGS_KEY = 'tutor'
const SECRET_KEY = 'tutor-api-key'
let sessionKey: string | null = null
const listeners = new Set<() => void>()

export function onKeyChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export async function loadTutorSettings(): Promise<TutorSettings | null> {
  const row = await db().settings.get(SETTINGS_KEY)
  const parsed = TutorSettingsSchema.safeParse(row?.value)
  return parsed.success ? parsed.data : null
}

export async function saveTutorSettings(s: TutorSettings) {
  await db().settings.put({ key: SETTINGS_KEY, value: TutorSettingsSchema.parse(s) })
}

export async function getApiKey(storage: TutorSettings['keyStorage']): Promise<string | null> {
  if (storage === 'session') return sessionKey
  const row = await db().secrets.get(SECRET_KEY)
  return typeof row?.value === 'string' ? row.value : null
}

export async function setApiKey(storage: TutorSettings['keyStorage'], key: string | null) {
  sessionKey = storage === 'session' ? key : null
  if (storage === 'indexeddb' && key) await db().secrets.put({ key: SECRET_KEY, value: key })
  else await db().secrets.delete(SECRET_KEY)
  listeners.forEach((l) => l())
}

export async function forgetApiKey() {
  sessionKey = null
  await db().secrets.delete(SECRET_KEY)
  listeners.forEach((l) => l())
}
