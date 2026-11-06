/** What a villager says when you walk up: a line about the nearest concept plot, from its real learning state. */
import type { WorldMap } from '../content/schema/world'
import type { PlotHealth } from './health'
import type { Lot } from './layout'

export type ChatterKey = keyof WorldMap['people']['chatter']

/** Which chatter line fits a plot's state; null health means no learning data at all. */
export function chatterKey(h: PlotHealth | undefined): ChatterKey {
  if (!h) return 'seed'
  if (h.state === 'planned') return 'planned'
  if (h.state === 'locked') return 'locked'
  if (h.lit) return 'lit'
  if (h.weeds) return 'weeds'
  return h.growth > 0.1 ? 'growing' : 'seed'
}

export function villagerLine(
  lots: readonly Lot[], health: ReadonlyMap<string, PlotHealth>, names: ReadonlyMap<string, string>, templates: WorldMap['people']['chatter'], x: number, z: number,
): string | null {
  let best: Lot | null = null
  let bestD = Infinity
  for (const l of lots) {
    const d = (l.plot[0] - x) ** 2 + (l.plot[2] - z) ** 2
    if (d < bestD) {
      bestD = d
      best = l
    }
  }
  if (!best) return null
  return templates[chatterKey(health.get(best.conceptId))].replaceAll('{concept}', names.get(best.conceptId) ?? best.conceptId)
}
