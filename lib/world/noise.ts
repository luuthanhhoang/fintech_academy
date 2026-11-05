/** Seeded 2D gradient noise + fractal Brownian motion, for deterministic terrain. */

function hash2(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

function gradDot(seed: number, ix: number, iy: number, dx: number, dy: number): number {
  const a = hash2(seed, ix, iy) * Math.PI * 2
  return Math.cos(a) * dx + Math.sin(a) * dy
}

/** Perlin-style noise in roughly [-1, 1]. */
export function createNoise(seed: number): (x: number, y: number) => number {
  return (x, y) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const u = fade(fx)
    const v = fade(fy)
    const n00 = gradDot(seed, ix, iy, fx, fy)
    const n10 = gradDot(seed, ix + 1, iy, fx - 1, fy)
    const n01 = gradDot(seed, ix, iy + 1, fx, fy - 1)
    const n11 = gradDot(seed, ix + 1, iy + 1, fx - 1, fy - 1)
    const a = n00 + u * (n10 - n00)
    const b = n01 + u * (n11 - n01)
    return (a + v * (b - a)) * 1.4
  }
}

/** Sum of octaves; result roughly in [-1, 1]. */
export function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves = 4): number {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
