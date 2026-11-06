'use client'

import type { PlaceInfo } from '@/lib/world/describe'
import type { Pos } from '@/lib/world/layout'
import { CONCEPT_STATES } from '@/lib/mastery/state'
import { WhyLink } from '@/components/learn/why-link'
import { Panel } from './panel'
import { WorldLink } from './world-link'

/**
 * Details of the selected place. Its links (lessons, simulators, labs, cases, scenarios, the tutor, the roadmap)
 * open in the in-world reader, so you never leave the village; bus stops offer rides to the other regions.
 */
export function PlacePanel({ info, onClose, onRide }: { info: PlaceInfo; onClose: () => void; onRide: (at: Pos) => void }) {
  const state = info.health ? CONCEPT_STATES.find((s) => s.id === info.health?.state) : null
  return (
    <Panel title={info.title} onClose={onClose} className="w-full sm:w-80">
      <p className="text-[11px] text-ink-3">
        {info.kind}
        {info.subtitle ? ` · ${info.subtitle}` : ''}
      </p>
      {info.health && (
        <p className="mt-2 rounded-md bg-paper-2 px-2 py-1 text-xs">
          <strong>{state?.label}</strong> — {info.health.reason}
        </p>
      )}
      {info.body.map((b) => (
        <p key={b} className="mt-2 leading-relaxed text-ink-2">
          {b}
        </p>
      ))}
      {info.scenario && <p className="mt-2 text-xs text-warn">Tình huống giả định — trời chuyển giông khi bạn đứng đây.</p>}
      {info.links.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {info.links.map((l) => (
            <li key={l.href + l.label}>
              <WorldLink href={l.href} label={l.label} className="flex items-center gap-1.5 rounded-md border border-rule px-2 py-1.5 text-accent hover:bg-paper-2">
                <span aria-hidden="true">📖</span>
                {l.label}
              </WorldLink>
            </li>
          ))}
        </ul>
      )}
      {info.trips && info.trips.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {info.trips.map((t) => (
            <li key={t.label}>
              <button type="button" onClick={() => onRide(t.at)} className="w-full rounded-md bg-lantern/15 px-2 py-1.5 text-left text-sm hover:bg-lantern/25">
                🚌 Đi xe tới {t.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <WhyLink method="method-of-loci" label="Vì sao gắn kiến thức với nơi chốn?" />
      </div>
    </Panel>
  )
}
