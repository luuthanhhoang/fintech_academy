/**
 * The village road (pure): a line beside the rail, its height profile with bridges where it crosses water, and
 * the bus timetable along it (ping-pong between stops, waiting at each).
 */
import type { Vec2 } from '../content/schema/world'
import { chaikin, createPolyline, type Polyline } from './polyline'
import type { Terrain } from './terrain'

export interface RoadSample { x: number; z: number; ground: number; y: number; bridge: boolean }
export interface Road { line: Polyline; samples: RoadSample[]; step: number; width: number; deckAt(t: number): number }

/** Clearance of a bridge deck above the water surface (m) and the grade of its approach ramps. */
const DECK_CLEARANCE = 1.4
const RAMP_GRADE = 0.14
/** A sample is part of a bridge when its deck stands this far above the ground. */
const BRIDGE_GAP = 0.7

/** Offsets the rail line sideways (negative normal = away from platforms) and smooths it. */
export function roadLine(rail: Polyline, offset: number, samples = 220): Vec2[] {
  const pts: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const [x, z] = rail.at(t)
    const [tx, tz] = rail.tangent(t)
    pts.push([x + tz * offset, z - tx * offset])
  }
  return chaikin(pts, 2)
}

/**
 * Heights along the road: the ground, lifted to a deck over water, with ramps on both sides so the bridge meets
 * the banks smoothly. `waterAt` returns the water surface or null on dry land.
 */
export function roadProfile(line: Polyline, step: number, heightAt: (x: number, z: number) => number, waterAt: (x: number, z: number) => number | null): RoadSample[] {
  const n = Math.max(1, Math.round(line.length / step))
  const raw = Array.from({ length: n + 1 }, (_, i) => {
    const [x, z] = line.at(i / n)
    const ground = heightAt(x, z)
    const water = waterAt(x, z)
    return { x, z, ground, want: water !== null ? Math.max(ground, water + DECK_CLEARANCE) : ground }
  })
  const ds = line.length / n
  const lifted = raw.map((r) => r.want)
  // Two sweeps spread each deck height into ramps that fall at RAMP_GRADE.
  for (let i = 1; i <= n; i++) lifted[i] = Math.max(lifted[i]!, lifted[i - 1]! - RAMP_GRADE * ds)
  for (let i = n - 1; i >= 0; i--) lifted[i] = Math.max(lifted[i]!, lifted[i + 1]! - RAMP_GRADE * ds)
  return raw.map((r, i) => ({ x: r.x, z: r.z, ground: r.ground, y: lifted[i]!, bridge: lifted[i]! - r.ground > BRIDGE_GAP }))
}

export function buildRoad(terrain: Terrain, offset: number, width: number, waterAt: (x: number, z: number) => number | null, step = 2): Road {
  const line = createPolyline(roadLine(terrain.rail, offset))
  const samples = roadProfile(line, step, terrain.height, waterAt)
  const deckAt = (t: number) => {
    const f = Math.min(1, Math.max(0, t)) * (samples.length - 1)
    const i = Math.floor(f)
    const a = samples[i]!
    const b = samples[Math.min(samples.length - 1, i + 1)]!
    return a.y + (b.y - a.y) * (f - i)
  }
  return { line, samples, step, width, deckAt }
}

/** The road as straight segments [x0, z0, x1, z1] (for rasterising into the ground mask). */
export function roadSegments(road: Road): [number, number, number, number][] {
  return road.samples.slice(1).map((s, i) => [road.samples[i]!.x, road.samples[i]!.z, s.x, s.z])
}

/** Contiguous runs of bridge samples as [first, last] index pairs. */
export function bridgeSpans(samples: readonly RoadSample[]): [number, number][] {
  const spans: [number, number][] = []
  let start = -1
  samples.forEach((s, i) => {
    if (s.bridge && start < 0) start = i
    if ((!s.bridge || i === samples.length - 1) && start >= 0) {
      spans.push([start, s.bridge ? i : i - 1])
      start = -1
    }
  })
  return spans
}

/** Deck height under (x, z) when standing on a bridge, else null (you walk on the ground). */
export function bridgeDeck(road: Road, x: number, z: number): number | null {
  const n = road.line.near(x, z, road.width / 2)
  if (!n) return null
  const i = Math.round(n.t * (road.samples.length - 1))
  return road.samples[i]?.bridge ? road.deckAt(n.t) : null
}

/**
 * Bus position (road fraction 0–1) at `seconds`: it drives stop to stop at `speed` m/s, waits `dwell` s at each,
 * and turns back at the ends. `stops` are road fractions.
 */
export function busAt(stops: readonly number[], length: number, speed: number, dwell: number, seconds: number): { t: number; forward: boolean; waiting: boolean } {
  const s = [...stops].sort((a, b) => a - b)
  if (s.length < 2) return { t: s[0] ?? 0, forward: true, waiting: true }
  const legs: { from: number; to: number }[] = []
  for (let i = 0; i < s.length - 1; i++) legs.push({ from: s[i]!, to: s[i + 1]! })
  for (let i = s.length - 1; i > 0; i--) legs.push({ from: s[i]!, to: s[i - 1]! })
  const durations = legs.map((l) => dwell + (Math.abs(l.to - l.from) * length) / speed)
  const cycle = durations.reduce((a, b) => a + b, 0)
  let left = ((seconds % cycle) + cycle) % cycle
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]!
    if (left < durations[i]!) {
      if (left < dwell) return { t: leg.from, forward: leg.to > leg.from, waiting: true }
      const f = (left - dwell) / (durations[i]! - dwell)
      const e = f * f * (3 - 2 * f)
      return { t: leg.from + (leg.to - leg.from) * e, forward: leg.to > leg.from, waiting: false }
    }
    left -= durations[i]!
  }
  return { t: s[0]!, forward: true, waiting: true }
}
