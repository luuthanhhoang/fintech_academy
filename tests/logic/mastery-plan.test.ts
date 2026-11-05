import { describe, expect, it } from 'vitest'
import type { Catalog } from '@/lib/content/catalog'
import { combineScore, conceptScore, decayedAccuracy } from '@/lib/mastery/score'
import { computeStates } from '@/lib/mastery/state'
import { buildDailyPlan } from '@/lib/today/plan'
import { currentStreak, longestStreak } from '@/lib/stats/streak'

const cfg = { weights: { quiz: 0.6, retention: 0.4 }, quizHalfLifeDays: 10, unlockAt: 0.6, masteredAt: 0.85, minQuizAttempts: 2, plannedPrerequisitesBlock: false }
const now = new Date('2026-11-05T10:00:00')

describe('mastery', () => {
  it('returns null without data and weights recent attempts more', () => {
    expect(conceptScore([], [], cfg, now).score).toBeNull()
    const old = { score: 0, answeredAt: new Date('2026-09-01') }
    const recent = { score: 1, answeredAt: now }
    expect(decayedAccuracy([old, recent], 10, now)).toBeGreaterThan(0.9)
    expect(combineScore(1, 0.5, cfg)).toBeCloseTo(0.8, 12)
    expect(conceptScore([recent], [], cfg, now).quiz).toBeNull()
  })
  it('computes states with planned prerequisites not blocking', () => {
    const states = computeStates(
      {
        concepts: [{ id: 'a', prerequisites: [] }, { id: 'b', prerequisites: ['a'] }, { id: 'c', prerequisites: ['p'] }, { id: 'p', prerequisites: [] }],
        learnable: new Set(['a', 'b', 'c']),
        scores: new Map(),
        active: new Set(),
      },
      cfg,
    )
    expect(Object.fromEntries(states)).toEqual({ a: 'available', b: 'locked', c: 'available', p: 'planned' })
  })
})

function lesson(id: string, order: number, concepts: string[], extra: Partial<Catalog['lessons'][number]> = {}) {
  return { id, track: 't', stage: 's', order, title: { vi: id, en: id }, summary: '', concepts, estMinutes: 10, whyQuestion: '', simulators: [], labs: [], cases: [], lastVerified: '2026-11-05', status: 'verified' as const, selfExplain: { prompt: '', rubric: [] }, quiz: [], exercises: [], ...extra }
}

describe('daily plan', () => {
  const catalog = {
    tracks: [{ id: 't', order: 0, title: { vi: 't', en: 't' }, summary: '', stages: [{ id: 's', order: 0, title: { vi: 's', en: 's' }, summary: '' }] }],
    lessons: [lesson('l1', 0, ['a'], { labs: ['lab1'], cases: ['c1'] }), lesson('l2', 1, ['b'])],
    cases: [{ id: 'c1' }, { id: 'c2' }],
  } as unknown as Catalog
  it('picks the next unlocked lesson and related practice', () => {
    const plan = buildDailyPlan(
      { catalog, states: new Map([['a', 'available'], ['b', 'locked']]), progress: new Map(), dueCardIds: ['x', 'y'], practiced: new Set(), focusTrack: null, day: '2026-11-05' },
      1,
    )
    expect(plan.reviews).toEqual(['x'])
    expect(plan.lesson?.id).toBe('l1')
    expect(plan.practice).toEqual({ kind: 'lab', id: 'lab1', lessonId: 'l1' })
    expect(plan.caseId).toBe('c1')
  })
  it('resumes a started lesson first', () => {
    const plan = buildDailyPlan(
      { catalog, states: new Map([['a', 'mastered'], ['b', 'learning']]), progress: new Map([['l1', 'completed'], ['l2', 'started']]), dueCardIds: [], practiced: new Set(['lab1', 'c1']), focusTrack: null, day: 'd' },
      5,
    )
    expect(plan.lesson?.id).toBe('l2')
    expect(plan.caseId).toBe('c2')
    expect(plan.explainLesson?.id).toBe('l1')
  })
})

describe('streak', () => {
  it('counts consecutive days', () => {
    const days = new Set(['2026-11-03', '2026-11-04', '2026-11-05', '2026-10-01'])
    expect(currentStreak(days, now)).toBe(3)
    expect(currentStreak(new Set(['2026-11-04']), now)).toBe(1)
    expect(longestStreak(days)).toBe(3)
  })
})
