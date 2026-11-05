/** Principle 3: no data nobody uses. Every entity must be reachable from the UI through some reference. */
import type { ContentBundle } from './types'

export function validateOrphans(b: ContentBundle, push: (where: string, message: string) => void) {
  const conceptUse = new Set([...b.lessons.flatMap((l) => l.concepts), ...b.planned.flatMap((p) => p.concepts)])
  for (const c of b.concepts) if (!conceptUse.has(c.id)) push(`concept:${c.id}`, 'không bài/planned nào dạy khái niệm này')

  const simUse = new Set(b.lessons.flatMap((l) => l.simulators))
  for (const s of b.simulators) if (!simUse.has(s.id)) push(`simulator:${s.id}`, 'không bài nào tham chiếu')
  const labUse = new Set(b.lessons.flatMap((l) => l.labs))
  for (const x of b.labs) if (!labUse.has(x.id)) push(`lab:${x.id}`, 'không bài nào tham chiếu')
  const caseUse = new Set(b.lessons.flatMap((l) => l.cases))
  for (const x of b.cases) if (!caseUse.has(x.id)) push(`case:${x.id}`, 'không bài nào tham chiếu')

  const sourceUse = new Set([
    ...b.lessons.flatMap((l) => l.sources),
    ...b.cases.flatMap((c) => [...c.timeline.flatMap((e) => e.sourceIds), ...c.rootCauses.flatMap((r) => r.sourceIds)]),
    ...b.scenarios.flatMap((s) => s.sourceIds),
    ...b.config.methods.methods.flatMap((m) => m.sourceIds),
  ])
  for (const s of b.sources) if (!sourceUse.has(s.id)) push(`source:${s.id}`, 'nguồn không được dùng ở đâu')

  const stageUse = new Set([...b.concepts.map((c) => c.stage)])
  for (const t of b.tracks) for (const s of t.stages) if (!stageUse.has(s.id)) push(`stage:${s.id}`, 'chặng không có khái niệm nào')
}
