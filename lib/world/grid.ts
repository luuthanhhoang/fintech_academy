/** Height grid sampled once from the terrain: shared by the mesh, the water shader (depth) and the path mask. */
import type { Terrain } from './terrain'

export interface HeightGrid {
  /** Vertices per side. */
  n: number
  size: number
  heights: Float32Array
  /** Bilinear height lookup (cheap; used instead of terrain.height for dense scatter). */
  at(x: number, z: number): number
}

export function sampleGrid(terrain: Terrain): HeightGrid {
  const { size, resolution } = terrain.map
  const n = resolution + 1
  const step = size / resolution
  const heights = new Float32Array(n * n)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) heights[j * n + i] = terrain.height(-size / 2 + i * step, -size / 2 + j * step)
  const at = (x: number, z: number) => {
    const fx = Math.min(n - 1.001, Math.max(0, (x + size / 2) / step))
    const fz = Math.min(n - 1.001, Math.max(0, (z + size / 2) / step))
    const i = Math.floor(fx)
    const j = Math.floor(fz)
    const u = fx - i
    const v = fz - j
    const h = (a: number, b: number) => heights[b * n + a]!
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v
  }
  return { n, size, heights, at }
}
