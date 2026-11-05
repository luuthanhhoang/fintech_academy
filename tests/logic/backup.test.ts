import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { decodeDates, encodeDates, exportBackup, importBackup, validateBackup } from '@/lib/db/backup'
import { AcademyDB, db, setDb } from '@/lib/db/dexie'
import { loadActiveFocus, saveFocusSession, storeActiveFocus } from '@/lib/db/repos/focus'
import { completeLesson, recordQuizAttempt } from '@/lib/db/repos/learning'
import { startJourney, tick } from '@/lib/focus/machine'

const srs = { requestRetention: 0.9, maximumIntervalDays: 365, enableFuzz: false }
let n = 0

beforeEach(() => {
  setDb(new AcademyDB(`test-${n++}`))
})

describe('backup', () => {
  it('round-trips dates explicitly', () => {
    const d = new Date('2026-11-05T01:02:03Z')
    expect(decodeDates(JSON.parse(JSON.stringify(encodeDates({ a: d, b: [d], c: 'x' }))))).toEqual({ a: d, b: [d], c: 'x' })
  })
  it('exports and re-imports learner data (replace mode)', async () => {
    await completeLesson(srs, 'l1', ['c1', 'c2'])
    await recordQuizAttempt(srs, { itemId: 'q1', conceptId: 'c1', lessonId: 'l1', correct: false, score: 0, answeredAt: new Date(), context: 'lesson' })
    await db().secrets.put({ key: 'tutor-api-key', value: 'sk-secret' })
    const json = await exportBackup()
    expect(json).not.toContain('sk-secret')
    setDb(new AcademyDB(`test-${n++}`))
    const r = await importBackup(json, 'replace')
    expect(r.ok).toBe(true)
    expect(await db().cards.count()).toBe(3)
    const card = await db().cards.get('quiz:q1')
    expect(card?.fsrs.dueAt).toBeInstanceOf(Date)
    expect((await db().progress.get('l1'))?.status).toBe('completed')
  })
  it('rejects invalid files', async () => {
    expect((await importBackup('not json', 'merge')).ok).toBe(false)
    expect(validateBackup({ app: 'other', schemaVersion: 1, exportedAt: '', tables: {} }).ok).toBe(false)
    const bad = { app: 'finai-academy', schemaVersion: 1, exportedAt: '', tables: { cards: [{ id: 'x' }] } }
    expect(validateBackup(bad).ok).toBe(false)
  })
  it('backs up focus segments and keeps the running journey across reloads', async () => {
    const t0 = Date.UTC(2026, 10, 5, 8)
    const a = startJourney({ id: 'j', view: 'v', segments: 1, focusMinutes: 24, breakMinutes: 6 }, [], 'r', t0)
    await storeActiveFocus(a)
    expect((await loadActiveFocus())?.journeyId).toBe('j')
    const done = tick(a, t0 + 24 * 60_000).events.find((e) => e.type === 'segment-complete')
    if (done?.type === 'segment-complete') await saveFocusSession(done.record)
    await storeActiveFocus(null)
    const json = await exportBackup()
    setDb(new AcademyDB(`test-${n++}`))
    expect((await importBackup(json, 'replace')).ok).toBe(true)
    const rows = await db().focusSessions.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.startedAt).toBeInstanceOf(Date)
    expect(await loadActiveFocus()).toBeNull()
  })
})
