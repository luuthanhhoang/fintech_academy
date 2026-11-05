'use client'

import Link from 'next/link'
import type { PlaceInfo } from '@/lib/world/describe'
import { CONCEPT_STATES } from '@/lib/mastery/state'
import { WhyLink } from '@/components/learn/why-link'
import { Panel } from './panel'

/** Details of the selected place, with links into lessons, simulators, labs, cases, scenarios and the tutor. */
export function PlacePanel({ info, onClose }: { info: PlaceInfo; onClose: () => void }) {
  const state = info.health ? CONCEPT_STATES.find((s) => s.id === info.health?.state) : null
  return (
    <Panel title={info.title} onClose={onClose} className="w-full sm:w-80">
      <p className="text-[11px] uppercase tracking-wide text-ink-3">
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
              <Link href={l.href} className="text-accent underline">
                {l.label}
              </Link>
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
