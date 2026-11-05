/**
 * Deterministic height field for the village map. Layers: region blend + noise, peaks, coast, then the rail
 * embankment, river channels, lakes and flat pads under scenery features. Sea level is y = 0.
 */
import type { WorldMap } from '../content/schema/world'
import { createNoise, fbm, lerp, smoothstep } from './noise'
import { chaikin, createPolyline, type Polyline } from './polyline'

export interface WaterBody {
  id: string
  name: string
  kind: 'river' | 'lake' | 'pond'
}

export interface Terrain {
  map: WorldMap
  height(x: number, z: number): number
  /** Gradient magnitude (rise over run). */
  slope(x: number, z: number): number
  /** True for sea, rivers, lakes and their immediate banks — nothing should be built there. */
  isWet(x: number, z: number): boolean
  /** Normalised weights of each region at (x, z), in map.regions order. */
  regionWeights(x: number, z: number): number[]
  coastZ(x: number): number
  rail: Polyline
  railHeight(t: number): number
  rivers: { id: string; name: string; line: Polyline; width: number; surface(t: number): number }[]
  lakes: { id: string; name: string; kind: 'pond' | 'lake'; center: [number, number]; radius: number; surface: number }[]
}

const SAMPLES = 360

/** Moving average over a sampled profile. */
function smooth(values: number[], window: number): number[] {
  return values.map((_, i) => {
    let sum = 0
    let n = 0
    for (let k = Math.max(0, i - window); k <= Math.min(values.length - 1, i + window); k++) {
      sum += values[k]!
      n++
    }
    return sum / n
  })
}

function sampler(values: number[]): (t: number) => number {
  return (t) => {
    const x = Math.min(1, Math.max(0, t)) * (values.length - 1)
    const i = Math.floor(x)
    const f = x - i
    return lerp(values[i]!, values[Math.min(values.length - 1, i + 1)]!, f)
  }
}

export function createTerrain(map: WorldMap): Terrain {
  const noise = createNoise(map.seed)
  const ridge = createNoise(map.seed + 17)
  const coastZ = (x: number) => map.coast.z + map.coast.wobble * noise(x / 190, 7.31)

  const regionWeights = (x: number, z: number) => {
    const raw = map.regions.map((r) => Math.max(0, 1 - Math.hypot(x - r.center[0], z - r.center[1]) / r.radius) ** 2 + 1e-4)
    const sum = raw.reduce((a, b) => a + b, 0)
    return raw.map((w) => w / sum)
  }

  const raw = (x: number, z: number) => {
    const w = regionWeights(x, z)
    let h = 0
    map.regions.forEach((r, i) => {
      h += w[i]! * (r.elevation + r.roughness * fbm(noise, x / 140 + i * 31, z / 140, 5))
    })
    for (const p of map.peaks) {
      const d = Math.hypot(x - p.at[0], z - p.at[1]) / p.radius
      if (d < 2.2) h += p.height * Math.exp(-d * d * 2.2) * (0.85 + 0.3 * Math.abs(ridge(x / 45, z / 45)))
    }
    const cz = coastZ(x)
    h = lerp(h, 1.1 + 0.4 * noise(x / 30, z / 30), smoothstep(cz - map.coast.beach * 2.2, cz - map.coast.beach * 0.3, z))
    return lerp(h, -map.coast.depth, smoothstep(cz - map.coast.beach * 0.3, cz + 90, z))
  }

  const rail = createPolyline(chaikin(map.rail.points, 3))
  const railProfile = smooth(
    Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const [x, z] = rail.at(i / SAMPLES)
      return Math.max(2.4, raw(x, z))
    }),
    14,
  )
  const railHeight = sampler(railProfile.map((h) => Math.max(2.4, h) + 0.4))

  const rivers = map.rivers.map((r) => {
    const line = createPolyline(chaikin(r.points, 3))
    let low = Infinity
    const surface = Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const [x, z] = line.at(i / SAMPLES)
      low = Math.min(low, Math.max(0.05, raw(x, z) - 1.2))
      return low
    })
    return { id: r.id, name: r.name, line, width: r.width, depth: r.depth, surface: sampler(smooth(surface, 6)) }
  })

  const lakes = map.lakes.map((l) => ({ ...l, center: l.center as [number, number], surface: Math.max(0.4, raw(l.center[0], l.center[1]) - 0.8) }))

  const height = (x: number, z: number) => {
    let h = raw(x, z)
    const rw = map.rail.width
    const rn = rail.near(x, z, rw * 4)
    if (rn) h = lerp(h, railHeight(rn.t) - 0.45, 1 - smoothstep(rw * 0.9, rw * 4, rn.distance))
    for (const f of map.features) {
      const d = Math.hypot(x - f.at[0], z - f.at[1])
      if (d < 14) h = Math.max(h, lerp(2.6, h, smoothstep(6, 14, d)))
    }
    for (const r of rivers) {
      const half = r.width / 2
      const n = r.line.near(x, z, half * 3.2)
      if (!n) continue
      const s = r.surface(n.t)
      const bank = lerp(s + 0.5, h, smoothstep(half, half * 3.2, n.distance))
      h = Math.min(h, bank)
      if (n.distance < half) h = Math.min(h, s - r.depth * (1 - (n.distance / half) ** 2))
    }
    for (const l of lakes) {
      const d = Math.hypot(x - l.center[0], z - l.center[1])
      if (d > l.radius * 1.8) continue
      h = Math.min(h, lerp(l.surface + 0.4, h, smoothstep(l.radius, l.radius * 1.8, d)))
      if (d < l.radius) h = Math.min(h, l.surface - l.depth * (1 - (d / l.radius) ** 2))
    }
    return h
  }

  const slope = (x: number, z: number) => {
    const e = 1.5
    return Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e)
  }

  const isWet = (x: number, z: number) => {
    if (height(x, z) < 0.8) return true
    if (rivers.some((r) => r.line.near(x, z, r.width * 1.1))) return true
    return lakes.some((l) => Math.hypot(x - l.center[0], z - l.center[1]) < l.radius * 1.25)
  }

  return { map, height, slope, isWet, regionWeights, coastZ, rail, railHeight, rivers, lakes }
}
