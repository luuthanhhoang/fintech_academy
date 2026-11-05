import { describe, expect, it } from 'vitest'
import { findCycles, topoSort } from '@/lib/content/graph'
import { findFigures } from '@/lib/content/figures'
import { extractProse, extractRefs, parseMdx } from '@/lib/content/mdx-ast'
import { gradeQuiz, orderingScore, seededShuffle, withinTolerance } from '@/lib/quiz/grade'

describe('graph', () => {
  it('detects cycles and sorts DAGs', () => {
    expect(findCycles([{ id: 'a', prerequisites: ['b'] }, { id: 'b', prerequisites: ['a'] }])).toHaveLength(1)
    const order = topoSort(
      [{ id: 'c', prerequisites: ['a', 'b'] }, { id: 'a', prerequisites: [] }, { id: 'b', prerequisites: ['a'] }],
      () => 0,
    ).map((n) => n.id)
    expect(order).toEqual(['a', 'b', 'c'])
    expect(() => topoSort([{ id: 'x', prerequisites: ['x'] }], () => 0)).toThrow()
  })
})

describe('mdx analysis', () => {
  it('extracts component refs and prose without math/code', () => {
    const tree = parseMdx('Lãi $r=5\\%$ mỗi năm.\n\n<Simulator id="tvm" />\n\n```py\nx = 2020\n```\n')
    expect(extractRefs(tree)).toEqual([{ component: 'Simulator', id: 'tvm' }])
    expect(findFigures(extractProse(tree))).toEqual([])
    expect(findFigures('Năm 2012 lỗ 440 triệu USD').length).toBeGreaterThan(0)
  })
})

describe('quiz grading', () => {
  it('handles every item type', () => {
    const base = { id: 'q', conceptId: 'c', prompt: 'p', explanation: 'e' }
    expect(gradeQuiz({ ...base, type: 'mcq', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: ['b'] }, { type: 'mcq', selected: ['b'] }).correct).toBe(true)
    expect(gradeQuiz({ ...base, type: 'numeric', answer: 100, tolerance: { kind: 'rel', value: 0.01 } }, { type: 'numeric', value: 100.5 }).correct).toBe(true)
    expect(withinTolerance(Number.NaN, 1, 'abs', 1)).toBe(false)
    const ord = { ...base, type: 'ordering' as const, items: [{ id: 'x', text: 'x' }, { id: 'y', text: 'y' }, { id: 'z', text: 'z' }] }
    expect(gradeQuiz(ord, { type: 'ordering', order: ['x', 'y', 'z'] }).correct).toBe(true)
    expect(orderingScore(['y', 'x', 'z'], ['x', 'y', 'z'])).toBe(0.5)
    const ex = { ...base, type: 'explain' as const, rubric: [{ id: 'r1', criterion: 'a' }, { id: 'r2', criterion: 'b' }], modelAnswer: 'm' }
    expect(gradeQuiz(ex, { type: 'explain', text: 't', checked: ['r1'] }).score).toBe(0.5)
  })
  it('seeded shuffle is deterministic and never the identity for n>1', () => {
    expect(seededShuffle([1, 2, 3], 'a')).toEqual(seededShuffle([1, 2, 3], 'a'))
    expect(seededShuffle([1, 2], 'z')).not.toEqual([1, 2])
  })
})
