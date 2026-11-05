/** Arc-length parametrised polylines (rail line, rivers): sampling, tangents, nearest point. */
import type { Vec2 } from '../content/schema/world'

export interface Polyline {
  points: readonly Vec2[]
  length: number
  /** Point at fraction t ∈ [0, 1] of the arc length. */
  at(t: number): Vec2
  /** Unit tangent at fraction t. */
  tangent(t: number): Vec2
  /** Distance from (x, z) to the line and the fraction of the nearest point. */
  nearest(x: number, z: number): { distance: number; t: number }
  /** Like nearest, but returns null quickly when (x, z) is farther than `max` from the bounding box. */
  near(x: number, z: number, max: number): { distance: number; t: number } | null
}

/** Chaikin corner cutting: smooths a polyline while keeping its endpoints. */
export function chaikin(points: readonly Vec2[], iterations: number): Vec2[] {
  let pts = [...points]
  for (let k = 0; k < iterations; k++) {
    const out: Vec2[] = [pts[0]!]
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i]!
      const [bx, bz] = pts[i + 1]!
      out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75])
    }
    out.push(pts[pts.length - 1]!)
    pts = out
  }
  return pts
}

export function createPolyline(points: readonly Vec2[]): Polyline {
  const cum = [0]
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1]!
    const [bx, bz] = points[i]!
    cum.push(cum[i - 1]! + Math.hypot(bx - ax, bz - az))
  }
  const length = cum[cum.length - 1]!
  const xs = points.map((p) => p[0])
  const zs = points.map((p) => p[1])
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
  // Flat arrays keep the hot nearest-point loop allocation-free (terrain samples it ~10⁵ times).
  const flat = new Float64Array(points.length * 2)
  points.forEach((p, i) => flat.set(p, i * 2))
  const scan = (x: number, z: number, max: number): { distance: number; t: number } | null => {
    let bestD2 = max * max
    let bestT = -1
    for (let i = 1; i < points.length; i++) {
      const ax = flat[i * 2 - 2]!
      const az = flat[i * 2 - 1]!
      const dx = flat[i * 2]! - ax
      const dz = flat[i * 2 + 1]! - az
      // Cheap reject: segment bounding box farther than the current best.
      const bx0 = Math.min(ax, ax + dx), bx1 = Math.max(ax, ax + dx), bz0 = Math.min(az, az + dz), bz1 = Math.max(az, az + dz)
      const ox = x < bx0 ? bx0 - x : x > bx1 ? x - bx1 : 0
      const oz = z < bz0 ? bz0 - z : z > bz1 ? z - bz1 : 0
      if (ox * ox + oz * oz > bestD2) continue
      const l2 = dx * dx + dz * dz || 1
      const f = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / l2))
      const ex = x - (ax + dx * f)
      const ez = z - (az + dz * f)
      const d2 = ex * ex + ez * ez
      if (d2 <= bestD2) {
        bestD2 = d2
        bestT = length > 0 ? (cum[i - 1]! + f * Math.sqrt(l2)) / length : 0
      }
    }
    return bestT < 0 ? null : { distance: Math.sqrt(bestD2), t: bestT }
  }
  const segmentAt = (t: number) => {
    const s = Math.min(1, Math.max(0, t)) * length
    let i = 1
    while (i < cum.length - 1 && cum[i]! < s) i++
    const seg = cum[i]! - cum[i - 1]!
    return { i, f: seg > 0 ? (s - cum[i - 1]!) / seg : 0 }
  }
  return {
    points,
    length,
    at(t) {
      const { i, f } = segmentAt(t)
      const [ax, az] = points[i - 1]!
      const [bx, bz] = points[i]!
      return [ax + (bx - ax) * f, az + (bz - az) * f]
    },
    tangent(t) {
      const { i } = segmentAt(t)
      const [ax, az] = points[i - 1]!
      const [bx, bz] = points[i]!
      const d = Math.hypot(bx - ax, bz - az) || 1
      return [(bx - ax) / d, (bz - az) / d]
    },
    nearest(x, z) {
      return scan(x, z, Infinity) ?? { distance: Infinity, t: 0 }
    },
    near(x, z, max) {
      if (x < box.x0 - max || x > box.x1 + max || z < box.z0 - max || z > box.z1 + max) return null
      return scan(x, z, max)
    },
  }
}
