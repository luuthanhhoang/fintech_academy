/** The learner's forest: one tree per focus segment, grown or withered, planted near the station being studied. */
import type { Catalog } from '../content/catalog'
import type { FocusSessionRecord } from '../db/types'
import { hashString } from '../util/date'
import type { Pos, WorldLayout } from './layout'
import type { Terrain } from './terrain'

export interface Plant {
  id: string
  position: Pos
  kind: 'pine' | 'broadleaf'
  /** Visual scale from focused minutes. */
  scale: number
  withered: boolean
  minutes: number
  day: string
}

export function plantsFromSessions(
  sessions: readonly FocusSessionRecord[], catalog: Pick<Catalog, 'world' | 'concepts' | 'config'>, layout: WorldLayout, terrain: Terrain,
): Plant[] {
  const minMs = catalog.config.focus.minPlantMinutes * 60_000
  const regions = catalog.world.map.regions
  const taken: Pos[] = [...layout.lots.map((l) => l.house), ...layout.lots.map((l) => l.plot), ...layout.landmarks.map((l) => l.position)]
  const clear = (x: number, z: number) => taken.every((p) => Math.hypot(p[0] - x, p[2] - z) > 7)
  return sessions.flatMap((s) => {
    if (s.focusedMs < minMs || s.id === undefined) return []
    const region = regions.find((r) => r.id === s.regionId) ?? regions[0]
    if (!region) return []
    const stage = catalog.concepts.find((c) => c.id === s.task?.conceptIds[0])?.stage
    const station = layout.stations.find((st) => st.id === stage) ?? layout.stations.find((st) => st.regionId === region.id)
    const center = station?.position ?? [region.center[0], 0, region.center[1]]
    const h = hashString(`plant:${s.id}`)
    for (let k = 0; k < 24; k++) {
      const a = ((h % 3600) / 3600) * Math.PI * 2 + k * 2.399
      const r = 70 + ((h >>> 12) % 50) + k * 4
      const x = center[0] + Math.cos(a) * r
      const z = center[2] + Math.sin(a) * r
      if (terrain.isWet(x, z) || terrain.slope(x, z) > 0.8 || !clear(x, z)) continue
      const position: Pos = [x, terrain.height(x, z), z]
      taken.push(position)
      const minutes = s.focusedMs / 60_000
      return [{
        id: `plant-${s.id}`, position, kind: region.biome === 'highland' ? 'pine' : 'broadleaf',
        scale: 0.7 + Math.min(1, minutes / 50) * 0.9, withered: s.status === 'abandoned', minutes, day: s.day,
      } satisfies Plant]
    }
    return []
  })
}
