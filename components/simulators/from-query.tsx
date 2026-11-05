'use client'

import { useSearchParams } from 'next/navigation'
import type { Simulator } from '@/lib/content/schema/simulator'
import { SimulatorFrame } from './frame'

/** Reads parameter presets from the URL (?key=value) so exercises can deep-link into a simulator state. */
export function SimulatorFromQuery({ meta, syntheticLabel }: { meta: Simulator; syntheticLabel: string }) {
  const params = useSearchParams()
  const initial: Record<string, number> = {}
  for (const p of meta.params) {
    const raw = params.get(p.key)
    if (raw !== null && Number.isFinite(Number(raw))) initial[p.key] = Math.min(p.max, Math.max(p.min, Number(raw)))
  }
  return <SimulatorFrame key={params.toString()} meta={meta} syntheticLabel={syntheticLabel} initial={initial} />
}
