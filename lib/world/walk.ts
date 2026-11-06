/**
 * Walking the village (pure, no three.js): colliders around buildings and trunks, one movement step with
 * collision, swimming and map bounds, the nearest place you can enter, ground picking for click-to-move,
 * and where you start (the learning frontier).
 */
import type { WorldMap } from '../content/schema/world'
import type { PlotHealth } from './health'
import type { Pos, WorldLayout } from './layout'
import type { Terrain } from './terrain'

export interface Circle { x: number; z: number; r: number }

/** Footprints you cannot walk through (m). Stations stay open: you walk onto the platform. */
const FOOTPRINT = { house: 3.4, landmark: 6, feature: 2.2, trunk: 0.55, school: 6.5, stop: 1.2 } as const

export function collidersFor(layout: WorldLayout): Circle[] {
  const at = (p: Pos, r: number): Circle => ({ x: p[0], z: p[2], r })
  return [
    ...layout.lots.map((l) => at(l.house, FOOTPRINT.house)),
    ...layout.landmarks.map((l) => at(l.position, FOOTPRINT.landmark)),
    ...layout.features.filter((f) => f.kind === 'lighthouse').map((f) => at(f.position, FOOTPRINT.feature)),
    ...layout.trees.map((t) => at(t.position, FOOTPRINT.trunk * t.scale)),
    ...layout.schools.map((c) => at(c.position, FOOTPRINT.school)),
  ]
}

/** Uniform hash grid so a step only checks the colliders around you. */
export class CircleGrid {
  private cells = new Map<string, Circle[]>()
  constructor(items: readonly Circle[], private cell = 16) {
    for (const c of items) {
      for (let x = Math.floor((c.x - c.r) / cell); x <= Math.floor((c.x + c.r) / cell); x++) {
        for (let z = Math.floor((c.z - c.r) / cell); z <= Math.floor((c.z + c.r) / cell); z++) {
          const k = `${x}:${z}`
          const list = this.cells.get(k)
          if (list) list.push(c)
          else this.cells.set(k, [c])
        }
      }
    }
  }
  near(x: number, z: number): readonly Circle[] {
    return this.cells.get(`${Math.floor(x / this.cell)}:${Math.floor(z / this.cell)}`) ?? []
  }
}

/** True when (x, z) lies within `margin` of any collider. */
export function insideAny(grid: CircleGrid, x: number, z: number, margin: number): boolean {
  return grid.near(x, z).some((c) => Math.hypot(x - c.x, z - c.z) < c.r + margin)
}

/** Pushes a body of radius r out of every overlapping circle. */
export function resolveCollisions(x: number, z: number, r: number, grid: CircleGrid): [number, number] {
  let px = x
  let pz = z
  for (let pass = 0; pass < 2; pass++) {
    for (const c of grid.near(px, pz)) {
      const dx = px - c.x
      const dz = pz - c.z
      const d = Math.hypot(dx, dz)
      const min = c.r + r
      if (d >= min) continue
      const k = d > 1e-6 ? (min - d) / d : 1
      px += d > 1e-6 ? dx * k : min
      pz += d > 1e-6 ? dz * k : 0
    }
  }
  return [px, pz]
}

/** Water surface at (x, z) if the point lies in the sea, a river or a lake; null on dry land. */
export function waterSurface(terrain: Terrain, x: number, z: number): number | null {
  for (const l of terrain.lakes) if (Math.hypot(x - l.center[0], z - l.center[1]) < l.radius) return l.surface
  for (const r of terrain.rivers) {
    const n = r.line.near(x, z, r.width / 2)
    if (n) return r.surface(n.t)
  }
  return terrain.height(x, z) < 0 ? 0 : null
}

export interface WalkState { x: number; z: number; y: number; yaw: number; speed: number; swimming: boolean }
export interface WalkEnv {
  terrain: Terrain
  grid: CircleGrid
  player: WorldMap['player']
  /** Deck height when (x, z) is on a bridge, else null. */
  deck?: (x: number, z: number) => number | null
}
/** Desired direction in world space (any length; normalised here) and whether you run. */
export interface MoveIntent { x: number; z: number; run: boolean }

/** Water deeper than this (m below the surface at your feet) means you swim. */
const SWIM_DEPTH = 1.0
/** You cannot swim further out to sea than this far past the coastline. */
const SEA_REACH = 30

const angleTo = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

export function stepWalk(s: WalkState, move: MoveIntent, dt: number, env: WalkEnv): WalkState {
  const { terrain, player } = env
  const len = Math.hypot(move.x, move.z)
  const max = s.swimming ? player.swimSpeed : move.run ? player.runSpeed : player.walkSpeed
  const want = len > 0.05 ? max * Math.min(1, len) : 0
  const speed = s.speed + (want - s.speed) * Math.min(1, dt * (want > s.speed ? 6 : 9))
  let yaw = s.yaw
  if (len > 0.05) yaw += angleTo(yaw, Math.atan2(move.x, move.z)) * Math.min(1, dt * 10)
  const dirX = len > 0.05 ? move.x / len : Math.sin(yaw)
  const dirZ = len > 0.05 ? move.z / len : Math.cos(yaw)
  const half = terrain.map.size / 2 - 8
  let x = Math.max(-half, Math.min(half, s.x + dirX * speed * dt))
  let z = Math.max(-half, Math.min(half, s.z + dirZ * speed * dt))
  if (z > terrain.coastZ(x) + SEA_REACH) z = s.z
  ;[x, z] = resolveCollisions(x, z, player.radius, env.grid)
  const deck = env.deck?.(x, z) ?? null
  if (deck !== null) return { x, z, y: deck, yaw, speed, swimming: false }
  const ground = terrain.height(x, z)
  const surface = waterSurface(terrain, x, z)
  const swimming = surface !== null && ground < surface - SWIM_DEPTH
  return { x, z, y: swimming ? surface! - SWIM_DEPTH : ground, yaw, speed, swimming }
}

export interface Reachable { kind: 'station' | 'lot' | 'landmark' | 'guide' | 'feature' | 'school' | 'bus'; id: string; label: string; x: number; z: number; r: number }

/** Everything you can walk up to and enter, with a reach radius matching its size. */
export function reachablesFor(layout: WorldLayout, conceptNames: ReadonlyMap<string, string>): Reachable[] {
  return [
    ...layout.stations.map((s) => ({ kind: 'station' as const, id: s.id, label: `Ga ${s.id.toUpperCase()} · ${s.title}`, x: s.position[0], z: s.position[2], r: 6 })),
    ...layout.lots.map((l) => ({ kind: 'lot' as const, id: l.conceptId, label: conceptNames.get(l.conceptId) ?? l.conceptId, x: l.house[0], z: l.house[2], r: FOOTPRINT.house + 1 })),
    ...layout.landmarks.map((l) => ({ kind: 'landmark' as const, id: l.landmark.id, label: l.landmark.title, x: l.position[0], z: l.position[2], r: FOOTPRINT.landmark + 1.5 })),
    ...layout.guides.map((g) => ({ kind: 'guide' as const, id: g.guide.id, label: g.guide.name, x: g.position[0], z: g.position[2], r: 1 })),
    ...layout.features.map((f) => ({ kind: 'feature' as const, id: f.id, label: f.name, x: f.position[0], z: f.position[2], r: 3 })),
    ...layout.schools.map((c) => ({ kind: 'school' as const, id: c.regionId, label: c.title, x: c.position[0], z: c.position[2], r: FOOTPRINT.school + 1 })),
    ...layout.busStops.map((c) => ({ kind: 'bus' as const, id: c.regionId, label: c.title, x: c.position[0], z: c.position[2], r: 2.5 })),
  ]
}

/** The closest place whose edge is within `reach` metres of (x, z). */
export function nearestReachable(items: readonly Reachable[], x: number, z: number, reach: number): Reachable | null {
  let best: Reachable | null = null
  let bestGap = reach
  for (const it of items) {
    const gap = Math.hypot(it.x - x, it.z - z) - it.r
    if (gap < bestGap) {
      bestGap = gap
      best = it
    }
  }
  return best
}

/**
 * First point where a ray dips below the ground (ray-march then bisection). Cheap enough per click and needs no
 * triangle raycast against the terrain mesh. Returns null when the ray never meets the ground within maxDist.
 */
export function rayGround(origin: readonly number[], dir: readonly number[], heightAt: (x: number, z: number) => number, maxDist = 900): [number, number, number] | null {
  const p = (t: number) => [origin[0]! + dir[0]! * t, origin[1]! + dir[1]! * t, origin[2]! + dir[2]! * t] as const
  const below = (t: number) => {
    const q = p(t)
    return q[1] < heightAt(q[0], q[2])
  }
  let prev = 0
  for (let t = 0.5; t <= maxDist; t += Math.max(0.5, t * 0.02)) {
    if (below(t)) {
      let lo = prev
      let hi = t
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2
        if (below(mid)) hi = mid
        else lo = mid
      }
      const q = p(hi)
      return [q[0], q[1], q[2]]
    }
    prev = t
  }
  return null
}

/**
 * Where a walk starts: beside the first station (in line order) that still has a concept you have not mastered
 * and can work on — your learning frontier. Falls back to the first station.
 */
export function frontierStation(layout: WorldLayout, health: ReadonlyMap<string, PlotHealth>) {
  const line = [...layout.stations].sort((a, b) => a.t - b.t)
  const open = (id: string) => {
    const h = health.get(id)
    return h ? !h.lit && h.state !== 'locked' && h.state !== 'planned' : false
  }
  return line.find((s) => layout.lots.some((l) => l.stageId === s.id && open(l.conceptId))) ?? line[0] ?? null
}

/** A spot a few metres off the platform, facing along the line. */
export function spawnPoint(layout: WorldLayout, health: ReadonlyMap<string, PlotHealth>, terrain: Terrain): Pos {
  const st = frontierStation(layout, health)
  if (!st) return [0, terrain.height(0, 0), 0]
  const [tx, tz] = st.tangent
  const x = st.position[0] - tz * 6
  const z = st.position[2] + tx * 6
  return [x, terrain.height(x, z), z]
}

/**
 * Where you arrive when you travel to a place: the first dry spot on a ring around it, just outside its
 * footprint, so you land in front of the building rather than inside it or in the river.
 */
export function arrivalPoint(terrain: Terrain, x: number, z: number, clearance: number): [number, number] {
  for (let ring = 0; ring < 4; ring++) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + ring * 0.26
      const d = clearance + ring * 3
      const px = x + Math.sin(a) * d
      const pz = z + Math.cos(a) * d
      if (!terrain.isWet(px, pz)) return [px, pz]
    }
  }
  return [x, z]
}
