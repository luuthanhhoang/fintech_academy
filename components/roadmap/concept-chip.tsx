import Link from 'next/link'
import type { Concept } from '@/lib/content/schema/concept'
import type { ConceptScore } from '@/lib/mastery/score'
import { CONCEPT_STATES, type ConceptState } from '@/lib/mastery/state'
import { fmtPct } from '@/lib/util/format'
import { STATE_STYLE } from './state-style'

export function ConceptChip({ concept, state, score }: { concept: Concept; state: ConceptState; score: ConceptScore | undefined }) {
  const label = CONCEPT_STATES.find((s) => s.id === state)?.label
  return (
    <Link
      href={`/concepts/${concept.id}/`}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm ${STATE_STYLE[state].cls}`}
      style={{ borderColor: STATE_STYLE[state].border }}
      title={`${label}${score?.score !== null && score?.score !== undefined ? ` · thành thạo ${fmtPct(score.score, 0)}` : ' · chưa có dữ liệu'}`}
    >
      <span aria-hidden="true">{STATE_STYLE[state].glyph}</span>
      {concept.name.vi}
      {score?.score !== null && score?.score !== undefined && <span className="num text-xs">{fmtPct(score.score, 0)}</span>}
      <span className="sr-only">({label})</span>
    </Link>
  )
}
