'use client'

import Link from 'next/link'
import type { Catalog } from '@/lib/content/catalog'
import { dependentsOf } from '@/lib/content/graph'
import { blockingPrerequisites, CONCEPT_STATES } from '@/lib/mastery/state'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { useMastery } from '@/components/data/use-learner'
import { StatusBadge } from '@/components/ui/badges'
import { Card } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'
import { ConceptChip } from './concept-chip'

export function ConceptDetail({ catalog, id }: { catalog: Catalog; id: string }) {
  const m = useMastery(catalog)
  const concept = catalog.concepts.find((c) => c.id === id)
  if (!concept) return null
  if (m.status === 'loading') return <Skeleton lines={6} />
  const state = m.states.get(id) ?? 'planned'
  const score = m.scores.get(id)
  const byId = new Map(catalog.concepts.map((c) => [c.id, c]))
  const blocking = new Set(blockingPrerequisites(id, { concepts: catalog.concepts, learnable: m.learnable, scores: m.scores, active: new Set() }, catalog.config.mastery))
  const lessons = catalog.lessons.filter((l) => l.concepts.includes(id))
  const planned = catalog.planned.filter((p) => p.concepts.includes(id))
  const dependents = dependentsOf(catalog.concepts, id)
  const label = CONCEPT_STATES.find((s) => s.id === state)

  return (
    <div className="grid gap-4 font-sans md:grid-cols-2">
      <Card>
        <h2 className="font-display text-lg font-semibold">Trạng thái: {label?.label} <span className="text-sm font-normal text-ink-3">({label?.en})</span></h2>
        <dl className="num mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ink-3">Điểm thành thạo</dt>
          <dd>{score?.score === null || !score ? 'chưa có dữ liệu' : fmtPct(score.score, 0)}</dd>
          <dt className="text-ink-3">Quiz (suy giảm theo thời gian)</dt>
          <dd>{score?.quiz === null || !score ? `chưa đủ (${score?.attempts ?? 0}/${catalog.config.mastery.minQuizAttempts} lượt)` : fmtPct(score.quiz, 0)}</dd>
          <dt className="text-ink-3">Ghi nhớ (FSRS retrievability)</dt>
          <dd>{score?.retention === null || !score ? 'chưa ôn thẻ nào' : fmtPct(score.retention, 0)}</dd>
          <dt className="text-ink-3">Số lượt quiz / thẻ đã ôn</dt>
          <dd>{fmtNum(score?.attempts ?? 0, 0)} / {fmtNum(score?.reviewedCards ?? 0, 0)}</dd>
        </dl>
        <p className="mt-3 text-xs text-ink-3">
          Công thức: {catalog.config.mastery.weights.quiz} × quiz + {catalog.config.mastery.weights.retention} × ghi nhớ (chuẩn hoá theo thành phần có dữ liệu). Mở khoá khi tiền đề ≥ {fmtPct(catalog.config.mastery.unlockAt, 0)}, thành thạo khi ≥ {fmtPct(catalog.config.mastery.masteredAt, 0)}.
        </p>
      </Card>
      <Card>
        <h2 className="font-display text-lg font-semibold">Tiền đề (prerequisites)</h2>
        {concept.prerequisites.length === 0 ? (
          <p className="mt-2 text-sm text-ink-3">Không có — có thể học ngay.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {concept.prerequisites.map((p) => {
              const c = byId.get(p)
              return c ? (
                <li key={p} className="flex items-center gap-2">
                  <ConceptChip concept={c} state={m.states.get(p) ?? 'planned'} score={m.scores.get(p)} />
                  {blocking.has(p) && <span className="text-xs text-warn">đang chặn</span>}
                </li>
              ) : null
            })}
          </ul>
        )}
        {dependents.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-medium">Mở đường cho</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {dependents.map((d) => {
                const c = byId.get(d)
                return c ? <ConceptChip key={d} concept={c} state={m.states.get(d) ?? 'planned'} score={m.scores.get(d)} /> : null
              })}
            </div>
          </>
        )}
      </Card>
      <Card className="md:col-span-2">
        <h2 className="font-display text-lg font-semibold">Học ở đâu</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link href={`/lessons/${l.id}/`} className="text-accent underline">{l.title.vi}</Link> <StatusBadge status={l.status} />
            </li>
          ))}
          {planned.map((p) => (
            <li key={p.id} className="text-ink-3">
              {p.title.vi} <StatusBadge status="planned" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
