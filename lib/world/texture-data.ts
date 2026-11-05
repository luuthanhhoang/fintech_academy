/** Procedural RGBA textures (pure pixel generators): plaster, roof tiles, bricks, wood, thatch. */
import { hexToRgb } from './colors'
import { createNoise, fbm } from './noise'

export interface Pixels { width: number; height: number; data: Uint8Array }

function make(size: number, seed: number, shade: (x: number, y: number, n: (a: number, b: number) => number) => [number, number, number]): Pixels {
  const noise = createNoise(seed)
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = shade(x, y, noise)
      const o = (y * size + x) * 4
      data[o] = Math.max(0, Math.min(255, r * 255))
      data[o + 1] = Math.max(0, Math.min(255, g * 255))
      data[o + 2] = Math.max(0, Math.min(255, b * 255))
      data[o + 3] = 255
    }
  }
  return { width: size, height: size, data }
}

/** Tileable-ish lime plaster with water stains near the bottom (texture v=0 at the bottom). Grey-scale: tinted by material colour. */
export function plaster(size = 256, seed = 1): Pixels {
  return make(size, seed, (x, y, n) => {
    const f = fbm(n, x / 40, y / 40, 4)
    const grain = n(x / 3, y / 3) * 0.04
    const stain = Math.max(0, 1 - y / (size * 0.35)) * (0.5 + 0.5 * fbm(n, x / 18, 9, 3)) * 0.18
    const v = 0.9 + f * 0.08 + grain - stain
    return [v, v * 0.98, v * 0.95]
  })
}

/** Curved clay roof tiles in rows (u across, v up the slope). Grey-scale shading to multiply with tile colour. */
export function roofTiles(size = 256, seed = 2, rows = 12, cols = 10): Pixels {
  return make(size, seed, (x, y, n) => {
    const u = (x / size) * cols
    const v = (y / size) * rows
    const row = Math.floor(v)
    const fu = (u + (row % 2) * 0.5) % 1
    const fv = v % 1
    const curve = Math.sin(fu * Math.PI)
    const overlap = fv < 0.18 ? 0.55 + fv * 2 : 1
    const age = 0.85 + fbm(n, x / 30, y / 30, 3) * 0.15 + n(Math.floor(u + row * 7.3), row) * 0.08
    const v2 = (0.72 + curve * 0.33) * (0.82 + overlap * 0.18) * age
    return [v2, v2, v2]
  })
}

export function bricks(size = 256, seed = 3, rows = 16, cols = 8, mortar = '#cbbfa8'): Pixels {
  const m = hexToRgb(mortar)
  return make(size, seed, (x, y, n) => {
    const v = (y / size) * rows
    const row = Math.floor(v)
    const u = (x / size) * cols + (row % 2) * 0.5
    const fu = u % 1
    const fv = v % 1
    if (fu < 0.05 || fv < 0.08) return m
    const tone = 0.75 + n(Math.floor(u), row) * 0.2 + fbm(n, x / 12, y / 12, 2) * 0.06
    return [tone, tone, tone]
  })
}

export function wood(size = 256, seed = 4, planks = 6): Pixels {
  return make(size, seed, (x, y, n) => {
    const p = Math.floor((x / size) * planks)
    const grain = Math.sin((y / size) * 60 + fbm(n, x / 8 + p * 13, y / 70, 3) * 6) * 0.06
    const gap = (x / size) * planks % 1 < 0.03 ? 0.55 : 1
    const v = (0.8 + n(p, 3) * 0.12 + grain) * gap
    return [v, v, v]
  })
}

/** Straw / thatch strands for granary roofs and haystacks. */
export function thatch(size = 256, seed = 5): Pixels {
  return make(size, seed, (x, y, n) => {
    const strand = fbm(n, x / 1.6, y / 22, 3)
    const v = 0.78 + strand * 0.22
    return [v, v * 0.97, v * 0.9]
  })
}
