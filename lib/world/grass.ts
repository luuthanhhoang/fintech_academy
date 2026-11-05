/** Dense ground cover (grass blades, flowers) concentrated around the village, avoiding water, rail and buildings. */
import { mulberry32 } from '../finance/random'
import type { HeightGrid } from './grid'
import type { WorldLayout } from './layout'
import type { Terrain } from './terrain'

export interface GroundCover {
  /** x, y, z per instance. */
  positions: Float32Array
  /** Per-instance random in [0, 1) (size, hue, phase). */
  seeds: Float32Array
  count: number
}

function blockedSet(layout: WorldLayout, cell: number) {
  const set = new Set<string>()
  const add = (x: number, z: number, r: number) => {
    for (let dx = -r; dx <= r; dx += cell) for (let dz = -r; dz <= r; dz += cell) set.add(`${Math.floor((x + dx) / cell)}:${Math.floor((z + dz) / cell)}`)
  }
  for (const l of layout.lots) {
    add(l.house[0], l.house[2], 7)
    add(l.plot[0], l.plot[2], 7)
  }
  for (const l of layout.landmarks) add(l.position[0], l.position[2], 12)
  for (const s of layout.stations) add(s.position[0], s.position[2], 10)
  for (const f of layout.features) add(f.position[0], f.position[2], 14)
  return (x: number, z: number) => set.has(`${Math.floor(x / cell)}:${Math.floor(z / cell)}`)
}

export function scatterGroundCover(terrain: Terrain, grid: HeightGrid, layout: WorldLayout, count: number, patchRadius: number, seed: number): GroundCover {
  const m = terrain.map
  const rand = mulberry32(seed)
  const blocked = blockedSet(layout, 3)
  const centers = [...layout.stations.map((s) => s.position), ...layout.landmarks.map((l) => l.position)]
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const half = m.size / 2
  let n = 0
  for (let tries = 0; n < count && tries < count * 4; tries++) {
    let x: number
    let z: number
    if (rand() < 0.75 && centers.length) {
      const c = centers[Math.floor(rand() * centers.length)]!
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * patchRadius
      x = c[0] + Math.cos(a) * r
      z = c[2] + Math.sin(a) * r
    } else {
      x = (rand() * 2 - 1) * half
      z = (rand() * 2 - 1) * half
    }
    const h = grid.at(x, z)
    if (h < 1.6 || h > m.snowline - 20 || blocked(x, z)) continue
    const slope = Math.abs(grid.at(x + 2, z) - grid.at(x - 2, z)) / 4 + Math.abs(grid.at(x, z + 2) - grid.at(x, z - 2)) / 4
    if (slope > 0.55) continue
    if (terrain.rail.near(x, z, m.rail.width * 1.6)) continue
    if (terrain.rivers.some((r) => r.line.near(x, z, r.width * 1.25))) continue
    if (terrain.lakes.some((l) => Math.hypot(x - l.center[0], z - l.center[1]) < l.radius * 1.2)) continue
    positions.set([x, h, z], n * 3)
    seeds[n] = rand()
    n++
  }
  return { positions: positions.subarray(0, n * 3), seeds: seeds.subarray(0, n), count: n }
}

/**
 * Where grass may grow, as a coarse mask over the whole map (row-major by z, 0 or 255): dry, gentle, below the
 * snow, off the rail, away from rivers, lakes and buildings. The camera-following grass field samples it.
 */
export function grassMask(terrain: Terrain, grid: HeightGrid, layout: WorldLayout, res: number): Uint8Array {
  const m = terrain.map
  const out = new Uint8Array(res * res)
  const blocked = blockedSet(layout, 3)
  const px = m.size / res
  for (let j = 0; j < res; j++) {
    const z = -m.size / 2 + (j + 0.5) * px
    for (let i = 0; i < res; i++) {
      const x = -m.size / 2 + (i + 0.5) * px
      const h = grid.at(x, z)
      if (h < 1.6 || h > m.snowline - 20 || blocked(x, z)) continue
      const slope = Math.abs(grid.at(x + 2, z) - grid.at(x - 2, z)) / 4 + Math.abs(grid.at(x, z + 2) - grid.at(x, z - 2)) / 4
      if (slope > 0.55 || terrain.rail.near(x, z, m.rail.width * 1.4)) continue
      if (terrain.rivers.some((r) => r.line.near(x, z, r.width * 1.1))) continue
      if (terrain.lakes.some((l) => Math.hypot(x - l.center[0], z - l.center[1]) < l.radius * 1.15)) continue
      out[j * res + i] = 255
    }
  }
  return out
}
