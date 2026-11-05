/** Ground colours from height, slope and region palette (pure; returns linear-ish sRGB 0–1 triples). */
import type { WorldMap } from '../content/schema/world'

export type Rgb = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

const SAND: Rgb = [0.83, 0.76, 0.58]
const WET_SAND: Rgb = [0.55, 0.5, 0.38]
const ROCK: Rgb = [0.45, 0.43, 0.4]
const SNOW: Rgb = [0.95, 0.96, 0.98]
const MUD: Rgb = [0.36, 0.3, 0.22]

export function groundPalette(map: WorldMap): Rgb[] {
  return map.regions.map((r) => hexToRgb(r.palette.ground))
}

/**
 * @param weights region weights at the point (terrain.regionWeights)
 * @param jitter small per-vertex noise in [-1, 1] for variation
 */
export function groundColor(map: WorldMap, palette: readonly Rgb[], h: number, slope: number, weights: readonly number[], jitter: number): Rgb {
  let base: Rgb = [0, 0, 0]
  weights.forEach((w, i) => {
    const c = palette[i]!
    base = [base[0] + c[0] * w, base[1] + c[1] * w, base[2] + c[2] * w]
  })
  base = mix(base, [base[0] * 0.8, base[1] * 0.9, base[2] * 0.7], clamp01(0.5 + jitter * 0.5))
  if (h < 0.2) return WET_SAND
  if (h < 1.9) return mix(SAND, base, clamp01((h - 1.2) / 0.7))
  let c = mix(base, MUD, clamp01((slope - 0.35) * 2) * 0.6)
  c = mix(c, ROCK, clamp01((slope - 0.6) * 2.5))
  c = mix(c, ROCK, clamp01((h - (map.snowline - 35)) / 30) * 0.7)
  return mix(c, SNOW, clamp01((h - map.snowline + jitter * 8) / 10) * clamp01(1.4 - slope))
}
