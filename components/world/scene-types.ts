/** Selection ids and shared prop types for the village scene. */
import type { PlotHealth } from '@/lib/world/health'

/** `${kind}:${id}` — kinds: station, lot, landmark, guide, feature, lake, peak. */
export type SelectionId = string

export const selectionId = (kind: 'station' | 'lot' | 'landmark' | 'guide' | 'feature' | 'lake' | 'peak', id: string): SelectionId => `${kind}:${id}`

export function parseSelection(sel: SelectionId | null): { kind: string; id: string } | null {
  if (!sel) return null
  const i = sel.indexOf(':')
  return i > 0 ? { kind: sel.slice(0, i), id: sel.slice(i + 1) } : null
}

export type HealthMap = ReadonlyMap<string, PlotHealth>
