/** Cross-reference validation of a loaded content bundle. Returns issues; the build fails on any error. */
import { findFigures } from './figures'
import { findCycles } from './graph'
import { extractExpressions, extractProse, extractRefs, parseMdx } from './mdx-ast'
import { isMdxComponentName, MDX_COMPONENT_REFS } from './mdx-spec'
import type { ContentBundle, Lesson } from './types'
import { validateLearning } from './validate-learning'
import { validateOrphans } from './validate-orphans'
import { validateWorld } from './validate-world'

export interface Issue {
  where: string
  message: string
}

export interface ValidateOptions {
  simulatorKeys: readonly string[]
  simulatorParams: Readonly<Record<string, readonly string[]>>
  iconKeys: readonly string[]
  shortcutActions: readonly string[]
  providerKinds: readonly string[]
  worldModelKeys: readonly string[]
  ambienceKeys: readonly string[]
  musicLayerKeys: readonly string[]
}

type Push = (where: string, message: string) => void

function checkDuplicates(push: Push, kind: string, ids: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) push(`${kind}:${id}`, 'id bị trùng')
    seen.add(id)
  }
}

function checkStructure(b: ContentBundle, push: Push) {
  checkDuplicates(push, 'track', b.tracks.map((t) => t.id))
  checkDuplicates(push, 'stage', b.tracks.flatMap((t) => t.stages.map((s) => s.id)))
  checkDuplicates(push, 'concept', b.concepts.map((c) => c.id))
  checkDuplicates(push, 'lesson', [...b.lessons.map((l) => l.id), ...b.planned.map((p) => p.id)])
  checkDuplicates(push, 'quiz', b.lessons.flatMap((l) => l.quiz.map((q) => q.id)))
  checkDuplicates(push, 'exercise', b.lessons.flatMap((l) => l.exercises.map((e) => e.id)))
  checkDuplicates(push, 'simulator', b.simulators.map((s) => s.id))
  checkDuplicates(push, 'lab', b.labs.map((l) => l.id))
  checkDuplicates(push, 'case', b.cases.map((c) => c.id))
  checkDuplicates(push, 'source', b.sources.map((s) => s.id))
}

function stageOwner(b: ContentBundle): Map<string, string> {
  return new Map(b.tracks.flatMap((t) => t.stages.map((s) => [s.id, t.id] as const)))
}

function checkConcepts(b: ContentBundle, push: Push) {
  const stages = stageOwner(b)
  const ids = new Set(b.concepts.map((c) => c.id))
  for (const c of b.concepts) {
    if (stages.get(c.stage) !== c.track) push(`concept:${c.id}`, `stage "${c.stage}" không thuộc track "${c.track}"`)
    for (const p of c.prerequisites) {
      if (!ids.has(p)) push(`concept:${c.id}`, `tiền đề "${p}" không tồn tại`)
      if (p === c.id) push(`concept:${c.id}`, 'tự tham chiếu chính nó')
    }
  }
  for (const cycle of findCycles(b.concepts)) push(`concept:${cycle[0]}`, `vòng lặp tiền đề: ${cycle.join(' → ')}`)
}

function checkLessonRefs(b: ContentBundle, l: Lesson, push: Push) {
  const where = `lesson:${l.id}`
  const concepts = new Set(b.concepts.map((c) => c.id))
  const known = {
    simulators: new Set(b.simulators.map((s) => s.id)),
    labs: new Set(b.labs.map((x) => x.id)),
    cases: new Set(b.cases.map((x) => x.id)),
    sources: new Set(b.sources.map((x) => x.id)),
  }
  if (stageOwner(b).get(l.stage) !== l.track) push(where, `stage "${l.stage}" không thuộc track "${l.track}"`)
  for (const c of l.concepts) if (!concepts.has(c)) push(where, `concept "${c}" không tồn tại`)
  for (const field of ['simulators', 'labs', 'cases', 'sources'] as const) {
    for (const id of l[field]) if (!known[field].has(id)) push(where, `${field} "${id}" không tồn tại`)
  }
  for (const q of l.quiz) {
    if (!concepts.has(q.conceptId)) push(`${where}/quiz:${q.id}`, `concept "${q.conceptId}" không tồn tại`)
    if (q.type === 'mcq') {
      const opts = new Set(q.options.map((o) => o.id))
      for (const c of q.correct) if (!opts.has(c)) push(`${where}/quiz:${q.id}`, `đáp án "${c}" không có trong options`)
    }
  }
  for (const e of l.exercises) {
    if (!concepts.has(e.conceptId)) push(`${where}/exercise:${e.id}`, `concept "${e.conceptId}" không tồn tại`)
    if (!e.simulator) continue
    const sim = b.simulators.find((s) => s.id === e.simulator?.id)
    if (!sim) push(`${where}/exercise:${e.id}`, `simulator "${e.simulator.id}" không tồn tại`)
    else checkParamKeys(push, `${where}/exercise:${e.id}`, sim.params.map((p) => p.key), e.simulator.params)
  }
}

function checkParamKeys(push: Push, where: string, keys: string[], values: Record<string, number>) {
  for (const k of Object.keys(values)) if (!keys.includes(k)) push(where, `tham số "${k}" không tồn tại`)
}

function checkLessonSourcing(l: Lesson, conceptIds: Set<string>, push: Push) {
  const where = `lesson:${l.id}`
  const sources = new Set(l.sources)
  for (const f of l.facts) {
    if (!sources.has(f.sourceId)) push(`${where}/fact:${f.id}`, `nguồn "${f.sourceId}" phải nằm trong sources của bài`)
    if (f.status !== 'verified' && f.value) push(`${where}/fact:${f.id}`, 'fact chưa kiểm chứng không được nêu giá trị')
    const textFigures = findFigures(f.text)
    if (f.status !== 'verified' && textFigures.length > 0) push(`${where}/fact:${f.id}`, `fact chưa kiểm chứng không được chứa số liệu trong text: ${textFigures.join(', ')}`)
    if (f.status === 'verified' && !f.value) push(`${where}/fact:${f.id}`, 'fact verified phải có value')
  }
  if (l.status === 'verified' && l.sources.length === 0) push(where, 'bài verified phải có ít nhất 1 nguồn')
  const tree = parseMdx(l.body)
  checkNoExpressions(push, where, [
    l.body,
    ...l.exercises.flatMap((e) => [e.prompt, e.hint ?? '', e.solution]),
    ...l.examples.flatMap((x) => [x.problem, x.takeaway, ...x.steps.map((st) => st.text)]),
  ])
  const figures = findFigures(extractProse(tree))
  if (figures.length > 0 && l.sources.length === 0) {
    push(where, `bài chứa số liệu (${figures.join(', ')}) nhưng không có nguồn`)
  }
  const refTargets: Record<string, Set<string>> = {
    simulators: new Set(l.simulators), labs: new Set(l.labs), cases: new Set(l.cases),
    quiz: new Set(l.quiz.map((q) => q.id)), facts: new Set(l.facts.map((f) => f.id)),
    examples: new Set(l.examples.map((e) => e.id)), diagrams: new Set(l.diagrams.map((d) => d.id)),
    scenarios: new Set(l.scenarios), allConcepts: conceptIds,
  }
  for (const ref of extractRefs(tree)) {
    if (!isMdxComponentName(ref.component)) {
      push(where, `component MDX "<${ref.component}>" không được hỗ trợ`)
      continue
    }
    const field = MDX_COMPONENT_REFS[ref.component]
    if (!field) continue
    if (!ref.id || !refTargets[field]?.has(ref.id)) {
      push(where, `<${ref.component} id="${ref.id ?? ''}"> phải trỏ tới một mục trong "${field}" của bài`)
    }
  }
}

function checkNoExpressions(push: Push, where: string, sources: string[]) {
  for (const src of sources) {
    let exprs: string[]
    try {
      exprs = extractExpressions(parseMdx(src))
    } catch (e) {
      push(where, `MDX không parse được: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    for (const x of exprs) push(where, `không được dùng biểu thức MDX {${x}} — bọc trong \`code\` hoặc escape \\{`)
  }
}

function checkPlanned(b: ContentBundle, push: Push) {
  const stages = stageOwner(b)
  const concepts = new Set(b.concepts.map((c) => c.id))
  for (const p of b.planned) {
    if (stages.get(p.stage) !== p.track) push(`planned:${p.id}`, `stage "${p.stage}" không thuộc track "${p.track}"`)
    for (const c of p.concepts) if (!concepts.has(c)) push(`planned:${p.id}`, `concept "${c}" không tồn tại`)
  }
}

function checkSimulators(b: ContentBundle, opts: ValidateOptions, push: Push) {
  const concepts = new Set(b.concepts.map((c) => c.id))
  for (const s of b.simulators) {
    const where = `simulator:${s.id}`
    if (!opts.simulatorKeys.includes(s.componentKey)) push(where, `componentKey "${s.componentKey}" chưa có trong registry`)
    const expected = opts.simulatorParams[s.componentKey] ?? []
    const declared = s.params.map((p) => p.key)
    const missing = expected.filter((k) => !declared.includes(k))
    const extra = declared.filter((k) => !expected.includes(k))
    if (missing.length) push(where, `thiếu tham số mà component cần: ${missing.join(', ')}`)
    if (extra.length) push(where, `tham số không component nào dùng: ${extra.join(', ')}`)
    if (s.dataKind !== 'formula' && !s.syntheticNote) push(where, 'dữ liệu tổng hợp phải có syntheticNote')
    for (const c of s.concepts) if (!concepts.has(c)) push(where, `concept "${c}" không tồn tại`)
    for (const p of s.params) {
      if (!(p.min <= p.default && p.default <= p.max)) push(where, `tham số "${p.key}": default ngoài [min,max]`)
    }
    const keys = s.params.map((p) => p.key)
    for (const br of s.breakIt) {
      checkParamKeys(push, `${where}/breakIt:${br.id}`, keys, br.params)
      for (const p of s.params) {
        const v = br.params[p.key]
        if (v !== undefined && (v < p.min || v > p.max)) push(`${where}/breakIt:${br.id}`, `"${p.key}" ngoài [min,max]`)
      }
    }
  }
}

function checkLabsAndCases(b: ContentBundle, push: Push) {
  const concepts = new Set(b.concepts.map((c) => c.id))
  const sources = new Set(b.sources.map((s) => s.id))
  for (const lab of b.labs) {
    for (const c of lab.concepts) if (!concepts.has(c)) push(`lab:${lab.id}`, `concept "${c}" không tồn tại`)
    if (!/def test_/.test(lab.tests)) push(`lab:${lab.id}`, 'tests.py phải có ít nhất một hàm test_*')
  }
  for (const cs of b.cases) {
    const where = `case:${cs.id}`
    for (const c of cs.concepts) if (!concepts.has(c)) push(where, `concept "${c}" không tồn tại`)
    const refs = [...cs.timeline.flatMap((e) => e.sourceIds), ...cs.rootCauses.flatMap((r) => r.sourceIds)]
    for (const id of refs) if (!sources.has(id)) push(where, `nguồn "${id}" không tồn tại`)
    for (const e of cs.timeline) {
      const figures = findFigures(e.event.replace(e.date, ''))
      if (e.status !== 'verified' && figures.length > 0) push(where, `sự kiện chưa kiểm chứng (${e.date}) không được nêu số liệu: ${figures.join(', ')}`)
    }
  }
}

export function validateContent(b: ContentBundle, opts: ValidateOptions): Issue[] {
  const issues: Issue[] = []
  const push: Push = (where, message) => issues.push({ where, message })
  checkStructure(b, push)
  checkConcepts(b, push)
  for (const l of b.lessons) {
    checkLessonRefs(b, l, push)
    checkLessonSourcing(l, new Set(b.concepts.map((c) => c.id)), push)
  }
  checkPlanned(b, push)
  for (const n of b.config.site.nav) if (!opts.iconKeys.includes(n.icon)) push(`nav:${n.href}`, `icon "${n.icon}" chưa có`)
  for (const sc of b.config.shortcuts) {
    if (!opts.shortcutActions.includes(sc.action)) push(`shortcut:${sc.keys}`, `action "${sc.action}" chưa có`)
    if (sc.action === 'go' && !sc.href) push(`shortcut:${sc.keys}`, 'action "go" cần href')
  }
  for (const p of b.config.tutor.providers) if (!opts.providerKinds.includes(p.kind)) push(`tutor:${p.id}`, `provider kind "${p.kind}" chưa có`)
  checkSimulators(b, opts, push)
  checkLabsAndCases(b, push)
  validateLearning(b, push)
  validateWorld(b, opts, push)
  validateOrphans(b, push)
  return issues
}
