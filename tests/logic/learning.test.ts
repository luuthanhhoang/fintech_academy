import { describe, expect, it } from 'vitest'
import type { FlowDiagram, Scenario, SequenceDiagram } from '@/lib/content/schema/learning'
import type { QuizItem } from '@/lib/content/schema/quiz'
import type { QuizAttemptRecord } from '@/lib/db/types'
import { layoutFlow, layoutSequence, wrapLabel } from '@/lib/diagram/layout'
import { interleave, spreadConcepts } from '@/lib/practice/interleave'
import { choose, current, isFinished, qualitySummary, startScenario } from '@/lib/scenario/engine'
import { pretestProgress } from '@/lib/stats/aggregate'

describe('diagram layout', () => {
  it('lays out sequence diagrams on lifelines', () => {
    const d: SequenceDiagram = { id: 'd', kind: 'sequence', title: 't', caption: 'c', actors: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], steps: [{ from: 'a', to: 'b', label: 'x' }, { from: 'b', to: 'b', label: 'self' }] }
    const l = layoutSequence(d)
    expect(l.actors.map((a) => a.x)).toEqual([109, 279])
    expect(l.messages[0]).toMatchObject({ x1: 109, x2: 279, self: false })
    expect(l.messages[1]?.self).toBe(true)
    expect(l.messages[1]!.y).toBeGreaterThan(l.messages[0]!.y)
  })
  it('lays out flow diagrams left-to-right', () => {
    const d: FlowDiagram = { id: 'f', kind: 'flow', title: 't', caption: 'c', direction: 'LR', nodes: [{ id: 'a', label: 'A', tone: 'default' }, { id: 'b', label: 'B', tone: 'accent' }], edges: [{ from: 'a', to: 'b', label: 'go' }] }
    const l = layoutFlow(d)
    expect(l.nodes[1]!.x).toBeGreaterThan(l.nodes[0]!.x)
    expect(l.edges[0]!.points.length).toBeGreaterThan(1)
  })
  it('wraps labels on word boundaries', () => {
    expect(wrapLabel('một hai ba bốn năm', 7)).toEqual(['một hai', 'ba bốn', 'năm'])
  })
})

const scenario: Scenario = {
  id: 's', title: { vi: 's', en: 's' }, role: 'r', summary: 's', concepts: ['c'], hypotheticalNote: 'h', sourceIds: [], start: 'n1',
  nodes: [
    { id: 'n1', text: 'start', choices: [{ id: 'a', label: 'A', next: 'end-good', feedback: 'f', quality: 'good' }, { id: 'b', label: 'B', next: 'n2', feedback: 'f', quality: 'risky' }] },
    { id: 'n2', text: 'mid', choices: [{ id: 'c', label: 'C', next: 'end-bad', feedback: 'f', quality: 'bad' }, { id: 'd', label: 'D', next: 'end-good', feedback: 'f', quality: 'good' }] },
    { id: 'end-good', text: 'ok', ending: { verdict: 'good', debrief: 'd' } },
    { id: 'end-bad', text: 'ko', ending: { verdict: 'bad', debrief: 'd' } },
  ],
}

describe('scenario engine', () => {
  it('walks a branch and summarises choice quality', () => {
    let st = startScenario(scenario)
    expect(current(st).id).toBe('n1')
    st = choose(scenario, st, 'b')
    st = choose(scenario, st, 'c')
    expect(isFinished(st)).toBe(true)
    expect(current(st).ending?.verdict).toBe('bad')
    expect(qualitySummary(st)).toEqual({ good: 0, risky: 1, bad: 1 })
    expect(() => choose(scenario, startScenario(scenario), 'zzz')).toThrow()
  })
})

const q = (id: string, conceptId: string): QuizItem => ({ id, conceptId, type: 'mcq', prompt: 'p', explanation: 'e', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }], correct: ['a'] })

describe('interleaved practice', () => {
  const pool = ['x', 'y', 'z'].flatMap((c) => [1, 2, 3].map((i) => ({ item: q(`${c}${i}`, c), lessonId: 'l' })))
  const cfg = { size: 6, weakShare: 0.5, minConcepts: 2 }
  it('mixes concepts, is deterministic, and respects studied set', () => {
    const a = interleave(pool, new Set(['x', 'y', 'z']), new Map([['x', 0.1], ['y', 0.9], ['z', null]]), cfg, 'day')
    expect(a).toHaveLength(6)
    expect(a).toEqual(interleave(pool, new Set(['x', 'y', 'z']), new Map([['x', 0.1], ['y', 0.9], ['z', null]]), cfg, 'day'))
    for (let i = 1; i < a.length; i++) expect(a[i]!.item.conceptId).not.toBe(a[i - 1]!.item.conceptId)
    expect(interleave(pool, new Set(['x']), new Map(), cfg, 'day')).toEqual([])
  })
  it('spreads same-concept items apart', () => {
    const out = spreadConcepts([pool[0]!, pool[1]!, pool[3]!])
    expect(out.map((c) => c.item.conceptId)).toEqual(['x', 'y', 'x'])
  })
})

describe('pretest progress', () => {
  const at = (itemId: string, context: QuizAttemptRecord['context'], correct: boolean, t: number): QuizAttemptRecord => ({ itemId, conceptId: 'c', lessonId: 'l', correct, score: correct ? 1 : 0, answeredAt: new Date(t), context })
  it('measures learning gain from pretest to later attempts', () => {
    const p = pretestProgress([
      at('a', 'pretest', false, 1), at('a', 'lesson', true, 2),
      at('b', 'pretest', true, 1), at('b', 'lesson', true, 2),
      at('c', 'pretest', false, 1), at('c', 'lesson', false, 2),
      at('d', 'pretest', false, 1),
      at('e', 'lesson', true, 1),
    ])
    expect(p).toEqual({ items: 4, wrongThenRight: 1, rightThenRight: 1, stillWrong: 1, notRetested: 1 })
  })
})
