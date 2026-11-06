/** Resolves view anchors and the train's route for a focus journey (pure). */
import type { WorldView } from '../content/schema/world'
import type { Pos, Station, WorldLayout } from './layout'
import type { PlotHealth } from './health'
import type { Terrain } from './terrain'
import { spawnPoint } from './walk'

/** World position of a view's anchor; 'train' when the camera rides the train. */
export function resolveAnchor(view: WorldView, layout: WorldLayout, terrain: Terrain, health: ReadonlyMap<string, PlotHealth>): Pos | 'train' {
  const a = view.anchor
  switch (a.kind) {
    case 'train':
      return 'train'
    case 'overview':
      return [0, 0, 0]
    case 'feature':
      return layout.features.find((f) => f.id === a.id)?.position ?? [0, 0, 0]
    case 'landmark':
      return layout.landmarks.find((l) => l.landmark.id === a.id)?.position ?? [0, 0, 0]
    case 'lake': {
      const l = terrain.lakes.find((x) => x.id === a.id)
      return l ? [l.center[0], l.surface, l.center[1]] : [0, 0, 0]
    }
    case 'frontier':
      return spawnPoint(layout, health, terrain)
    case 'peak': {
      const p = terrain.map.peaks.find((x) => x.id === a.id)
      return p ? [p.at[0], terrain.height(p.at[0], p.at[1]), p.at[1]] : [0, 0, 0]
    }
  }
}

/** Station sequence for a journey of `segments` legs starting at `startId`, bouncing back at the line ends. */
export function journeyRoute(stations: readonly Station[], startId: string | null, segments: number): Station[] {
  const line = [...stations].sort((a, b) => a.t - b.t)
  if (line.length < 2) return line
  let i = Math.max(0, line.findIndex((s) => s.id === startId))
  let dir = i >= line.length - 1 ? -1 : 1
  const route = [line[i]!]
  for (let k = 0; k < segments; k++) {
    if (i + dir < 0 || i + dir >= line.length) dir = -dir
    i += dir
    route.push(line[i]!)
  }
  return route
}

/** Rail position (0–1) for journey progress (0–1) along a route: linear between consecutive stations. */
export function routeT(route: readonly Station[], progress: number): number {
  if (route.length === 0) return 0
  if (route.length === 1) return route[0]!.t
  const x = Math.min(1, Math.max(0, progress)) * (route.length - 1)
  const i = Math.min(route.length - 2, Math.floor(x))
  const f = x - i
  return route[i]!.t + (route[i + 1]!.t - route[i]!.t) * f
}

/** Idle train: a slow back-and-forth over the whole line (period in seconds). */
export function idleT(seconds: number, period = 900): number {
  const p = (seconds % period) / period
  return 0.02 + 0.96 * (p < 0.5 ? p * 2 : 2 - p * 2)
}
