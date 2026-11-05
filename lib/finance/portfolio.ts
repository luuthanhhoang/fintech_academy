/** Portfolio statistics, Markowitz frontier and random long-only portfolios. Returns are per-period decimals. */
import { cholesky, dot, invert, matVec, type Matrix, type Vector } from './matrix'
import { mulberry32, normalSampler } from './random'

export function simpleReturns(prices: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i++) out.push((prices[i] as number) / (prices[i - 1] as number) - 1)
  return out
}

export function meanOf(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Sample covariance (n − 1). */
export function covariance(a: readonly number[], b: readonly number[]): number {
  const ma = meanOf(a)
  const mb = meanOf(b)
  let s = 0
  for (let i = 0; i < a.length; i++) s += ((a[i] as number) - ma) * ((b[i] as number) - mb)
  return s / (a.length - 1)
}

export function covarianceMatrix(series: readonly (readonly number[])[]): Matrix {
  return series.map((a) => series.map((b) => covariance(a, b)))
}

export function correlationMatrix(cov: Matrix): Matrix {
  return cov.map((row, i) => row.map((c, j) => c / Math.sqrt(cov[i]![i]! * cov[j]![j]!)))
}

export interface PortfolioPoint {
  ret: number
  vol: number
  weights: Vector
}

export function portfolioStats(weights: Vector, mu: Vector, cov: Matrix): { ret: number; vol: number } {
  return { ret: dot(weights, mu), vol: Math.sqrt(Math.max(0, dot(weights, matVec(cov, weights)))) }
}

export function sharpe(ret: number, vol: number, riskFree: number): number | null {
  return vol === 0 ? null : (ret - riskFree) / vol
}

/** Annualise per-period mean and covariance assuming i.i.d. returns. */
export function annualize(mu: Vector, cov: Matrix, periodsPerYear: number): { mu: Vector; cov: Matrix } {
  return { mu: mu.map((m) => m * periodsPerYear), cov: cov.map((r) => r.map((c) => c * periodsPerYear)) }
}

/**
 * Closed-form mean–variance frontier (short sales allowed): σ²(r) = (A r² − 2 B r + C) / D.
 * Returns null when the covariance matrix is singular.
 */
export function analyticFrontier(mu: Vector, cov: Matrix, steps: number, span = 1.5): PortfolioPoint[] | null {
  const inv = invert(cov)
  if (!inv) return null
  const ones = mu.map(() => 1)
  const invOnes = matVec(inv, ones)
  const invMu = matVec(inv, mu)
  const A = dot(ones, invOnes)
  const B = dot(ones, invMu)
  const C = dot(mu, invMu)
  const D = A * C - B * B
  if (Math.abs(D) < 1e-18) return null
  const rMin = B / A
  const lo = Math.min(...mu)
  const hi = Math.max(...mu)
  const top = rMin + span * Math.max(hi - rMin, rMin - lo, 1e-6)
  return Array.from({ length: steps + 1 }, (_, i) => {
    const r = rMin + ((top - rMin) * i) / steps
    const lambda = (C - B * r) / D
    const gamma = (A * r - B) / D
    const weights = invOnes.map((x, k) => lambda * x + gamma * (invMu[k] as number))
    return { ret: r, vol: Math.sqrt(Math.max(0, (A * r * r - 2 * B * r + C) / D)), weights }
  })
}

export function minimumVariance(cov: Matrix): Vector | null {
  const inv = invert(cov)
  if (!inv) return null
  const w = matVec(inv, cov.map(() => 1))
  const s = w.reduce((a, b) => a + b, 0)
  return w.map((x) => x / s)
}

/** Random long-only portfolios (uniform on the simplex via normalised exponentials). */
export function randomPortfolios(mu: Vector, cov: Matrix, count: number, seed: number): PortfolioPoint[] {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, () => {
    const raw = mu.map(() => -Math.log(Math.max(rand(), 1e-12)))
    const s = raw.reduce((a, b) => a + b, 0)
    const weights = raw.map((x) => x / s)
    return { ...portfolioStats(weights, mu, cov), weights }
  })
}

/** Long-only efficient set: upper-left envelope of a point cloud. */
export function upperEnvelope(points: readonly PortfolioPoint[]): PortfolioPoint[] {
  const sorted = [...points].sort((a, b) => a.vol - b.vol)
  const out: PortfolioPoint[] = []
  let best = -Infinity
  for (const p of sorted) {
    if (p.ret > best) {
      out.push(p)
      best = p.ret
    }
  }
  return out
}

export interface SyntheticAsset {
  name: string
  mu: number
  sigma: number
}

/** Multivariate-normal synthetic returns with a single pairwise correlation `rho`. */
export function syntheticReturns(assets: readonly SyntheticAsset[], rho: number, periods: number, seed: number): number[][] | null {
  const cov = assets.map((a, i) => assets.map((b, j) => (i === j ? a.sigma * a.sigma : rho * a.sigma * b.sigma)))
  const L = cholesky(cov)
  if (!L) return null
  const z = normalSampler(mulberry32(seed))
  const series = assets.map(() => [] as number[])
  for (let t = 0; t < periods; t++) {
    const e = assets.map(() => z())
    const shock = matVec(L, e)
    assets.forEach((a, i) => series[i]!.push(a.mu + (shock[i] as number)))
  }
  return series
}
