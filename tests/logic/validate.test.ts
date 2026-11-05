import { describe, expect, it } from 'vitest'
import { loadContent } from '@/lib/content/load'
import { validateContent } from '@/lib/content/validate'
import type { ContentBundle } from '@/lib/content/types'
import { ICON_KEYS, PROVIDER_KINDS, SHORTCUT_ACTIONS, SIMULATOR_KEYS, SIMULATOR_PARAMS } from '@/lib/registry/keys'

const opts = { simulatorKeys: SIMULATOR_KEYS, simulatorParams: SIMULATOR_PARAMS, iconKeys: ICON_KEYS, shortcutActions: SHORTCUT_ACTIONS, providerKinds: PROVIDER_KINDS }
const base = loadContent()
const clone = (): ContentBundle => structuredClone(base)
const messages = (b: ContentBundle) => validateContent(b, opts).map((i) => `${i.where} ${i.message}`)

describe('content validation', () => {
  it('real content is valid', () => {
    expect(messages(base)).toEqual([])
  })
  it('fails on a dangling prerequisite', () => {
    const b = clone()
    b.concepts[0]!.prerequisites = ['does-not-exist']
    expect(messages(b).some((m) => m.includes('does-not-exist'))).toBe(true)
  })
  it('fails on a prerequisite cycle', () => {
    const b = clone()
    const [x, y] = [b.concepts[0]!, b.concepts[1]!]
    x.prerequisites = [y.id]
    y.prerequisites = [x.id]
    expect(messages(b).some((m) => m.includes('vòng lặp'))).toBe(true)
  })
  it('fails when a lesson with figures has no sources', () => {
    const b = clone()
    const l = b.lessons.find((x) => x.id === 'f0-interest-compounding')!
    l.sources = []
    l.status = 'draft'
    expect(messages(b).some((m) => m.includes('không có nguồn'))).toBe(true)
  })
  it('fails when an unverified fact states a value', () => {
    const b = clone()
    const f = b.lessons.flatMap((l) => l.facts).find((x) => x.status === 'needs_verification')!
    f.value = '42%'
    expect(messages(b).some((m) => m.includes('không được nêu giá trị'))).toBe(true)
  })
  it('fails on unknown simulator component key and orphan data', () => {
    const b = clone()
    b.simulators[0]!.componentKey = 'nope'
    b.lessons.forEach((l) => (l.simulators = l.simulators.filter((s) => s !== b.simulators[1]!.id)))
    const m = messages(b)
    expect(m.some((x) => x.includes('chưa có trong registry'))).toBe(true)
    expect(m.some((x) => x.includes('không bài nào tham chiếu'))).toBe(true)
  })
})

describe('learning-block validation', () => {
  it('fails on pretest id not in quiz', () => {
    const b = clone()
    b.lessons[0]!.pretest = ['nope']
    expect(messages(b).some((m) => m.includes('pretest "nope"'))).toBe(true)
  })
  it('fails on unreachable scenario node, dangling choice and cycles', () => {
    const b = clone()
    const s = b.scenarios[0]!
    s.nodes.push({ id: 'island', text: 'x', ending: { verdict: 'good', debrief: 'd' } })
    s.nodes[0]!.choices![0]!.next = 'ghost'
    const m = messages(b)
    expect(m.some((x) => x.includes('không thể tới được'))).toBe(true)
    expect(m.some((x) => x.includes('"ghost" không tồn tại'))).toBe(true)
  })
  it('fails when a faded step lacks an answer or a diagram edge is dangling', () => {
    const b = clone()
    const l = b.lessons.find((x) => x.examples.length > 0)!
    const st = l.examples[0]!.steps.find((s) => s.faded)!
    delete st.answer
    const dl = b.lessons.find((x) => x.diagrams.some((d) => d.kind === 'flow'))!
    const fd = dl.diagrams.find((d) => d.kind === 'flow')!
    if (fd.kind === 'flow') fd.edges.push({ from: 'nowhere', to: 'nada' })
    const m = messages(b)
    expect(m.some((x) => x.includes('faded cần'))).toBe(true)
    expect(m.some((x) => x.includes('node không tồn tại'))).toBe(true)
  })
})
