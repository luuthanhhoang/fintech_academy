/** Footpaths: from each house to its station and from each landmark to its station, rasterised to a mask. */
import type { WorldLayout } from './layout'

export type Segment = [number, number, number, number]

/**
 * Organic footpaths: around each station, every house/landmark (nearest first) links to the closest point already
 * on the network — a small spanning tree instead of spokes.
 */
export function pathSegments(layout: WorldLayout): Segment[] {
  const segs: Segment[] = []
  for (const st of layout.stations) {
    const network: [number, number][] = [[st.position[0], st.position[2]]]
    const stops = [
      ...layout.lots.filter((l) => l.stageId === st.id).map((l) => [l.house[0], l.house[2]] as [number, number]),
      ...layout.landmarks.filter((l) => l.stationId === st.id).map((l) => [l.position[0], l.position[2]] as [number, number]),
    ].sort((a, b) => Math.hypot(a[0] - st.position[0], a[1] - st.position[2]) - Math.hypot(b[0] - st.position[0], b[1] - st.position[2]))
    for (const p of stops) {
      let best = network[0]!
      for (const n of network) if (Math.hypot(n[0] - p[0], n[1] - p[1]) < Math.hypot(best[0] - p[0], best[1] - p[1])) best = n
      segs.push([p[0], p[1], best[0], best[1]])
      network.push(p)
    }
  }
  return segs
}

function distToSegment(px: number, pz: number, s: Segment) {
  const dx = s[2] - s[0]
  const dz = s[3] - s[1]
  const l2 = dx * dx + dz * dz || 1
  const t = Math.min(1, Math.max(0, ((px - s[0]) * dx + (pz - s[1]) * dz) / l2))
  return Math.hypot(px - (s[0] + dx * t), pz - (s[1] + dz * t))
}

/**
 * Path mask over the whole map (row-major, z rows), 0–255. Segments are bucketed in a coarse grid so each
 * pixel only tests nearby segments.
 */
export function rasterisePaths(segs: readonly Segment[], size: number, res: number, width: number): Uint8Array {
  const out = new Uint8Array(res * res)
  const cell = 32
  const cells = Math.ceil(size / cell)
  const buckets = new Map<number, Segment[]>()
  const key = (cx: number, cz: number) => cz * cells + cx
  const reach = width * 1.6
  for (const s of segs) {
    const x0 = Math.floor((Math.min(s[0], s[2]) - reach + size / 2) / cell)
    const x1 = Math.floor((Math.max(s[0], s[2]) + reach + size / 2) / cell)
    const z0 = Math.floor((Math.min(s[1], s[3]) - reach + size / 2) / cell)
    const z1 = Math.floor((Math.max(s[1], s[3]) + reach + size / 2) / cell)
    for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) buckets.set(key(cx, cz), [...(buckets.get(key(cx, cz)) ?? []), s])
  }
  const px = size / res
  for (let j = 0; j < res; j++) {
    const z = -size / 2 + (j + 0.5) * px
    for (let i = 0; i < res; i++) {
      const x = -size / 2 + (i + 0.5) * px
      const list = buckets.get(key(Math.floor((x + size / 2) / cell), Math.floor((z + size / 2) / cell)))
      if (!list) continue
      let d = Infinity
      for (const s of list) d = Math.min(d, distToSegment(x, z, s))
      if (d < reach) out[j * res + i] = Math.round(255 * Math.min(1, Math.max(0, (reach - d) / (reach - width * 0.5))))
    }
  }
  return out
}
