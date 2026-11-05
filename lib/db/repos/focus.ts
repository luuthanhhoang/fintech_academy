/** Persistence for focus journeys: finished/abandoned segments and the journey in progress. */
import type { ActiveFocus } from '../../focus/machine'
import { db } from '../dexie'
import type { FocusSessionRecord } from '../types'

const ACTIVE_KEY = 'focus:active'

export async function saveFocusSession(record: Omit<FocusSessionRecord, 'id'>) {
  return db().focusSessions.add(record)
}

export async function loadActiveFocus(): Promise<ActiveFocus | null> {
  const row = await db().settings.get(ACTIVE_KEY)
  const v = row?.value
  return v && typeof v === 'object' && 'journeyId' in v ? (v as ActiveFocus) : null
}

export async function storeActiveFocus(active: ActiveFocus | null) {
  if (active) await db().settings.put({ key: ACTIVE_KEY, value: active })
  else await db().settings.delete(ACTIVE_KEY)
}
