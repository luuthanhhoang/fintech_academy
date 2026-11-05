import { describe, expect, it } from 'vitest'
import { giveUp, journeyProgress, onHidden, onRestore, onVisible, remainingMs, skipBreak, startJourney, tick } from '@/lib/focus/machine'
import { focusStats } from '@/lib/stats/focus'
import { chordForBar, degreeToMidi, melodyStep } from '@/lib/audio/music'
import { mulberry32 } from '@/lib/finance/random'

const MIN = 60_000
const j = { id: 'j', view: 'v', segments: 2, focusMinutes: 24, breakMinutes: 6 }
const t0 = Date.UTC(2026, 10, 5, 8)

describe('focus machine', () => {
  it('runs focus → break → focus → done with records', () => {
    const a = startJourney(j, [], 'r', t0)
    expect(remainingMs(a, t0 + MIN)).toBe(23 * MIN)
    const s1 = tick(a, t0 + 24 * MIN)
    expect(s1.events.map((e) => e.type)).toEqual(['segment-complete'])
    expect(s1.next?.phase).toBe('break')
    const s2 = tick(s1.next!, t0 + 30 * MIN)
    expect(s2.events.map((e) => e.type)).toEqual(['break-over'])
    expect(journeyProgress(s2.next!, t0 + 42 * MIN)).toBeCloseTo(0.75)
    const s3 = tick(s2.next!, t0 + 54 * MIN)
    expect(s3.next).toBeNull()
    expect(s3.events.map((e) => e.type)).toEqual(['segment-complete', 'journey-complete'])
  })
  it('catches up several phases after a long sleep', () => {
    const s = tick(startJourney(j, [], null, t0), t0 + 60 * MIN)
    expect(s.events.filter((e) => e.type === 'segment-complete')).toHaveLength(2)
    expect(s.next).toBeNull()
  })
  it('within grace nothing happens; past grace the segment withers at the moment you left', () => {
    const a = onHidden(startJourney(j, [], null, t0), t0 + 5 * MIN)
    expect(onVisible(a, t0 + 5 * MIN + 5_000, 10_000).next).not.toBeNull()
    const lost = onVisible(a, t0 + 5 * MIN + 60_000, 10_000)
    expect(lost.next).toBeNull()
    const e = lost.events[0]!
    expect(e.type === 'abandoned' && e.record.focusedMs).toBe(5 * MIN)
  })
  it('a closed tab is detected on restore from the heartbeat', () => {
    const a = tick(startJourney(j, [], null, t0), t0 + 3 * MIN).next!
    expect(onRestore(a, t0 + 20 * MIN, 10_000).events[0]?.type).toBe('abandoned')
  })
  it('give up abandons; skip break starts the next segment now', () => {
    expect(giveUp(startJourney(j, [], null, t0), t0 + MIN).events[0]?.type).toBe('abandoned')
    const brk = tick(startJourney(j, [], null, t0), t0 + 25 * MIN).next!
    const next = skipBreak(brk, t0 + 26 * MIN)
    expect(next.phase).toBe('focus')
    expect(next.segment).toBe(1)
  })
})

describe('focus stats', () => {
  it('sums minutes, counts and streak from real records', () => {
    const rec = (day: string, min: number, status: 'completed' | 'abandoned') => ({
      day, journeyId: 'j', viewId: 'v', segment: 0, segments: 1, startedAt: new Date(), endedAt: new Date(), plannedMs: min * MIN,
      focusedMs: min * MIN, status, reason: 'finished' as const, regionId: null, task: null,
    })
    const s = focusStats([rec('2026-11-05', 24, 'completed'), rec('2026-11-04', 12, 'completed'), rec('2026-11-04', 3, 'abandoned')], new Date(2026, 10, 5, 12))
    expect(s.todayMinutes).toBe(24)
    expect(s.totalMinutes).toBe(39)
    expect(s.streakDays).toBe(2)
    expect(s.abandoned).toBe(1)
  })
})

describe('generative music', () => {
  const piece = { root: 60, scale: [0, 2, 4, 7, 9], progression: [0, 3], density: 1 }
  it('maps degrees across octaves and stacks triads', () => {
    expect(degreeToMidi(piece, 5)).toBe(72)
    expect(chordForBar(piece, 1)).toEqual([67, 72, 76])
  })
  it('melody stays in the scale', () => {
    const rand = mulberry32(1)
    let prev: number | null = null
    for (let s = 0; s < 32; s++) {
      const n = melodyStep(piece, Math.floor(s / 8), s % 8, prev, rand)
      if (n !== null) {
        expect(piece.scale).toContain((n - 60 + 120) % 12)
        prev = n
      }
    }
  })
})
