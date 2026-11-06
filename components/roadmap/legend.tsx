import { CONCEPT_STATES } from '@/lib/mastery/state'
import { STATE_STYLE } from './state-style'

export function StateLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-sm text-ink-2" aria-label="Chú giải trạng thái">
      {CONCEPT_STATES.map((s) => (
        <li key={s.id} className="flex items-center gap-1">
          <span aria-hidden="true">{STATE_STYLE[s.id].glyph}</span>
          {s.label}
        </li>
      ))}
    </ul>
  )
}
