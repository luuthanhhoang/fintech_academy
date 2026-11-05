import { CONCEPT_STATES } from '@/lib/mastery/state'
import { STATE_STYLE } from './state-style'

export function StateLegend() {
  return (
    <ul className="flex flex-wrap gap-3 font-sans text-xs text-ink-2" aria-label="Chú giải trạng thái">
      {CONCEPT_STATES.map((s) => (
        <li key={s.id} className="flex items-center gap-1">
          <span aria-hidden="true">{STATE_STYLE[s.id].glyph}</span>
          {s.label} <span className="text-ink-3">({s.en})</span>
        </li>
      ))}
    </ul>
  )
}
