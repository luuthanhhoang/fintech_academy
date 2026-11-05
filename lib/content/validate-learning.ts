/** Validation for v2 learning blocks: pretest, worked examples, diagrams, scenarios, applications, methods. */
import { findCycles } from './graph'
import { extractRefs, parseMdx } from './mdx-ast'
import type { Scenario } from './schema/learning'
import type { ContentBundle, Lesson } from './types'
import { LEARNING_METHOD_KEYS } from '../registry/keys'

type Push = (where: string, message: string) => void

function dupes(push: Push, kind: string, ids: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) push(`${kind}:${id}`, 'id bị trùng')
    seen.add(id)
  }
}

function checkLesson(l: Lesson, b: ContentBundle, push: Push) {
  const where = `lesson:${l.id}`
  const quizIds = new Set(l.quiz.map((q) => q.id))
  const concepts = new Set(b.concepts.map((c) => c.id))
  for (const id of l.pretest) if (!quizIds.has(id)) push(where, `pretest "${id}" không có trong quiz của bài`)
  for (const id of l.scenarios) if (!b.scenarios.some((s) => s.id === id)) push(where, `scenario "${id}" không tồn tại`)
  for (const ex of l.examples) {
    const w = `${where}/example:${ex.id}`
    if (!concepts.has(ex.conceptId)) push(w, `concept "${ex.conceptId}" không tồn tại`)
    ex.steps.forEach((st, i) => {
      if (st.faded && (st.answer === undefined || !st.tolerance || !st.prompt)) push(w, `bước ${i + 1} faded cần prompt, answer và tolerance`)
      if (!st.faded && st.answer !== undefined) push(w, `bước ${i + 1} không faded thì không có answer`)
    })
    if (!ex.steps.some((st) => st.faded)) push(w, 'cần ít nhất một bước faded (người học tự làm)')
  }
  for (const d of l.diagrams) {
    const w = `${where}/diagram:${d.id}`
    if (d.kind === 'sequence') {
      const actors = new Set(d.actors.map((a) => a.id))
      for (const st of d.steps) if (!actors.has(st.from) || !actors.has(st.to)) push(w, `bước "${st.label}" trỏ tới actor không tồn tại`)
    } else {
      const nodes = new Set(d.nodes.map((n) => n.id))
      for (const e of d.edges) if (!nodes.has(e.from) || !nodes.has(e.to)) push(w, `cạnh ${e.from}→${e.to} trỏ tới node không tồn tại`)
    }
  }
  const embedded = new Set(extractRefs(parseMdx(l.body)).map((r) => `${r.component}:${r.id}`))
  for (const ex of l.examples) if (!embedded.has(`WorkedExample:${ex.id}`)) push(`${where}/example:${ex.id}`, 'chưa được nhúng trong bài (<WorkedExample>)')
  for (const d of l.diagrams) if (!embedded.has(`Diagram:${d.id}`)) push(`${where}/diagram:${d.id}`, 'chưa được nhúng trong bài (<Diagram>)')
  for (const s of l.scenarios) if (!embedded.has(`Scenario:${s}`)) push(`${where}/scenario:${s}`, 'chưa được nhúng trong bài (<Scenario>)')
}

export function checkScenario(s: Scenario, b: ContentBundle, push: Push) {
  const where = `scenario:${s.id}`
  const ids = new Set(s.nodes.map((n) => n.id))
  const concepts = new Set(b.concepts.map((c) => c.id))
  const sources = new Set(b.sources.map((x) => x.id))
  dupes(push, `${where}/node`, s.nodes.map((n) => n.id))
  for (const c of s.concepts) if (!concepts.has(c)) push(where, `concept "${c}" không tồn tại`)
  for (const id of s.sourceIds) if (!sources.has(id)) push(where, `nguồn "${id}" không tồn tại`)
  if (s.relatedCase && !b.cases.some((c) => c.id === s.relatedCase)) push(where, `case "${s.relatedCase}" không tồn tại`)
  if (!ids.has(s.start)) push(where, `start "${s.start}" không tồn tại`)
  for (const n of s.nodes) for (const ch of n.choices ?? []) if (!ids.has(ch.next)) push(where, `lựa chọn "${ch.id}" trỏ tới nút "${ch.next}" không tồn tại`)
  if (!s.nodes.some((n) => n.ending)) push(where, 'cần ít nhất một kết thúc')
  const graph = s.nodes.map((n) => ({ id: n.id, prerequisites: (n.choices ?? []).map((c) => c.next) }))
  if (findCycles(graph).length > 0) push(where, 'đồ thị tình huống có vòng lặp')
  const reach = new Set<string>()
  const stack = [s.start]
  while (stack.length) {
    const id = stack.pop() as string
    if (reach.has(id)) continue
    reach.add(id)
    for (const c of s.nodes.find((n) => n.id === id)?.choices ?? []) stack.push(c.next)
  }
  for (const n of s.nodes) if (!reach.has(n.id)) push(where, `nút "${n.id}" không thể tới được từ start`)
}

export function validateLearning(b: ContentBundle, push: Push) {
  dupes(push, 'example', b.lessons.flatMap((l) => l.examples.map((e) => e.id)))
  dupes(push, 'diagram', b.lessons.flatMap((l) => l.diagrams.map((d) => d.id)))
  dupes(push, 'application', b.lessons.flatMap((l) => l.applications.map((a) => a.id)))
  dupes(push, 'scenario', b.scenarios.map((s) => s.id))
  for (const l of b.lessons) checkLesson(l, b, push)
  for (const s of b.scenarios) checkScenario(s, b, push)
  const sources = new Set(b.sources.map((x) => x.id))
  const methodIds = new Set(b.config.methods.methods.map((m) => m.id))
  for (const m of b.config.methods.methods) for (const id of m.sourceIds) if (!sources.has(id)) push(`method:${m.id}`, `nguồn "${id}" không tồn tại`)
  for (const k of LEARNING_METHOD_KEYS) if (!methodIds.has(k)) push(`method:${k}`, 'phương pháp mà UI liên kết tới chưa có trong methods.yaml')
  for (const m of methodIds) if (!(LEARNING_METHOD_KEYS as readonly string[]).includes(m)) push(`method:${m}`, 'không khối UI nào liên kết tới phương pháp này')
  const used = new Set(b.lessons.flatMap((l) => l.scenarios))
  for (const s of b.scenarios) if (!used.has(s.id)) push(`scenario:${s.id}`, 'không bài nào tham chiếu')
}
