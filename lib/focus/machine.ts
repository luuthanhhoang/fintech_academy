/**
 * Focus journey state machine (pure). A journey is N focus segments separated by breaks. Leaving the tab
 * for longer than the grace period during a focus segment abandons it (the sapling withers). Navigating
 * inside the site does not count as leaving — learning pages are where the focus happens.
 */
import type { FocusSessionRecord, FocusTask } from '../db/types'
import { dayKey } from '../util/date'

export type FocusPhase = 'focus' | 'break'

export interface ActiveFocus {
  journeyId: string
  viewId: string
  regionId: string | null
  segments: number
  focusMs: number
  breakMs: number
  tasks: (FocusTask | null)[]
  /** When the journey began (identifies it). */
  startedAt: number
  segment: number
  phase: FocusPhase
  phaseStartedAt: number
  /** Last time the page was seen running (heartbeat), to detect a closed tab on restore. */
  seenAt: number
  hiddenAt: number | null
}

export type FocusEvent =
  | { type: 'segment-complete'; record: Omit<FocusSessionRecord, 'id'> }
  | { type: 'abandoned'; record: Omit<FocusSessionRecord, 'id'> }
  | { type: 'journey-complete' }
  | { type: 'break-over' }

export interface Step {
  next: ActiveFocus | null
  events: FocusEvent[]
}

export interface JourneySpec {
  id: string
  view: string
  segments: number
  focusMinutes: number
  breakMinutes: number
}

const MIN = 60_000

export function startJourney(j: JourneySpec, tasks: (FocusTask | null)[], regionId: string | null, now: number): ActiveFocus {
  return {
    journeyId: j.id, viewId: j.view, regionId, segments: j.segments, focusMs: j.focusMinutes * MIN, breakMs: j.breakMinutes * MIN,
    tasks: Array.from({ length: j.segments }, (_, i) => tasks[i] ?? null), startedAt: now, segment: 0, phase: 'focus', phaseStartedAt: now, seenAt: now, hiddenAt: null,
  }
}

export function phaseDuration(a: ActiveFocus): number {
  return a.phase === 'focus' ? a.focusMs : a.breakMs
}

export function remainingMs(a: ActiveFocus, now: number): number {
  return Math.max(0, a.phaseStartedAt + phaseDuration(a) - now)
}

/** Fraction of the current phase elapsed. */
export function phaseProgress(a: ActiveFocus, now: number): number {
  const d = phaseDuration(a)
  return d > 0 ? Math.min(1, (now - a.phaseStartedAt) / d) : 1
}

/** Fraction of all focus time elapsed (breaks do not move the train). */
export function journeyProgress(a: ActiveFocus, now: number): number {
  const done = a.segment + (a.phase === 'focus' ? phaseProgress(a, now) : 1)
  return Math.min(1, done / a.segments)
}

export function currentTask(a: ActiveFocus): FocusTask | null {
  return a.tasks[a.segment] ?? null
}

function record(a: ActiveFocus, end: number, status: FocusSessionRecord['status'], reason: FocusSessionRecord['reason']): Omit<FocusSessionRecord, 'id'> {
  const focusedMs = Math.max(0, Math.min(end, a.phaseStartedAt + a.focusMs) - a.phaseStartedAt)
  return {
    day: dayKey(new Date(a.phaseStartedAt)), journeyId: a.journeyId, viewId: a.viewId, segment: a.segment, segments: a.segments,
    startedAt: new Date(a.phaseStartedAt), endedAt: new Date(end), plannedMs: a.focusMs, focusedMs, status, reason,
    regionId: a.regionId, task: currentTask(a),
  }
}

function abandon(a: ActiveFocus, end: number, reason: 'hidden' | 'gave-up'): Step {
  if (a.phase !== 'focus') return { next: null, events: [] }
  return { next: null, events: [{ type: 'abandoned', record: record(a, end, 'abandoned', reason) }] }
}

/** Advance time. Handles several phase ends at once (e.g. after the device slept through a break). */
export function tick(a: ActiveFocus, now: number): Step {
  let cur: ActiveFocus = { ...a, seenAt: now }
  const events: FocusEvent[] = []
  while (cur.phaseStartedAt + phaseDuration(cur) <= now) {
    const end = cur.phaseStartedAt + phaseDuration(cur)
    if (cur.phase === 'focus') {
      events.push({ type: 'segment-complete', record: record(cur, end, 'completed', 'finished') })
      if (cur.segment + 1 >= cur.segments) {
        events.push({ type: 'journey-complete' })
        return { next: null, events }
      }
      cur = cur.breakMs > 0 ? { ...cur, phase: 'break', phaseStartedAt: end } : { ...cur, segment: cur.segment + 1, phaseStartedAt: end }
    } else {
      events.push({ type: 'break-over' })
      cur = { ...cur, phase: 'focus', segment: cur.segment + 1, phaseStartedAt: end }
    }
  }
  return { next: cur, events }
}

export function onHidden(a: ActiveFocus, now: number): ActiveFocus {
  return a.phase === 'focus' && a.hiddenAt === null ? { ...a, hiddenAt: now } : a
}

/** Coming back: within the grace period nothing happens; past it the segment is abandoned at the moment you left. */
export function onVisible(a: ActiveFocus, now: number, graceMs: number): Step {
  if (a.hiddenAt === null) return tick(a, now)
  if (a.phase === 'focus' && now - a.hiddenAt > graceMs && a.hiddenAt < a.phaseStartedAt + a.focusMs) return abandon(a, a.hiddenAt, 'hidden')
  return tick({ ...a, hiddenAt: null }, now)
}

/** After a reload: if the page stopped running for longer than the grace period mid-focus, treat it as leaving. */
export function onRestore(a: ActiveFocus, now: number, graceMs: number): Step {
  const left = a.hiddenAt ?? a.seenAt
  if (a.phase === 'focus' && now - left > graceMs && left < a.phaseStartedAt + a.focusMs) return abandon(a, left, 'hidden')
  return tick({ ...a, hiddenAt: null }, now)
}

export function giveUp(a: ActiveFocus, now: number): Step {
  return abandon(a, now, 'gave-up')
}

/** End a break early and start the next segment now. */
export function skipBreak(a: ActiveFocus, now: number): ActiveFocus {
  return a.phase === 'break' ? { ...a, phase: 'focus', segment: a.segment + 1, phaseStartedAt: now, seenAt: now } : a
}
