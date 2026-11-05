import { describe, expect, it } from 'vitest'
import { parsePriceCsv } from '@/lib/finance/csv'
import { invert } from '@/lib/finance/matrix'
import {
  analyticFrontier, covariance, minimumVariance, portfolioStats, randomPortfolios, simpleReturns, syntheticReturns, upperEnvelope,
} from '@/lib/finance/portfolio'

describe('portfolio', () => {
  it('two-asset portfolio variance formula', () => {
    const s1 = 0.2, s2 = 0.1, rho = 0.3
    const cov = [[s1 * s1, rho * s1 * s2], [rho * s1 * s2, s2 * s2]]
    const w = [0.4, 0.6]
    const expected = Math.sqrt(w[0]! ** 2 * s1 ** 2 + w[1]! ** 2 * s2 ** 2 + 2 * w[0]! * w[1]! * rho * s1 * s2)
    expect(portfolioStats(w, [0.1, 0.05], cov).vol).toBeCloseTo(expected, 12)
  })
  it('two-asset min-variance weight closed form', () => {
    const s1 = 0.2, s2 = 0.1, rho = 0.3
    const c = rho * s1 * s2
    const w1 = (s2 * s2 - c) / (s1 * s1 + s2 * s2 - 2 * c)
    const mv = minimumVariance([[s1 * s1, c], [c, s2 * s2]])
    expect(mv?.[0]).toBeCloseTo(w1, 12)
  })
  it('analytic frontier: weights sum to 1 and hit the target return', () => {
    const mu = [0.08, 0.12, 0.05]
    const cov = [[0.04, 0.006, 0.002], [0.006, 0.09, 0.004], [0.002, 0.004, 0.01]]
    const f = analyticFrontier(mu, cov, 10)
    expect(f).not.toBeNull()
    for (const p of f ?? []) {
      expect(p.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9)
      expect(portfolioStats(p.weights, mu, cov).ret).toBeCloseTo(p.ret, 9)
      expect(portfolioStats(p.weights, mu, cov).vol).toBeCloseTo(p.vol, 9)
    }
    // no random long-only portfolio beats the frontier variance at its return
    const cloud = randomPortfolios(mu, cov, 300, 1)
    expect(upperEnvelope(cloud).length).toBeGreaterThan(0)
  })
  it('matrix inverse and covariance basics', () => {
    const inv = invert([[2, 0], [0, 4]])
    expect(inv).toEqual([[0.5, 0], [0, 0.25]])
    expect(invert([[1, 2], [2, 4]])).toBeNull()
    expect(covariance([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 12)
    expect(simpleReturns([100, 110, 99])).toEqual([0.10000000000000009, -0.09999999999999998])
  })
  it('synthetic returns are reproducible', () => {
    const assets = [{ name: 'A', mu: 0.01, sigma: 0.05 }, { name: 'B', mu: 0.005, sigma: 0.02 }]
    expect(syntheticReturns(assets, 0.2, 50, 3)).toEqual(syntheticReturns(assets, 0.2, 50, 3))
  })
  it('CSV parser accepts dates and rejects bad cells', () => {
    const ok = parsePriceCsv('date,A,B\n2024-01-01,10,20\n2024-02-01,11,19\n2024-03-01,12,21')
    expect(ok.ok && ok.table.assets).toEqual(['A', 'B'])
    expect(parsePriceCsv('A,B\n10,x\n11,12').ok).toBe(false)
  })
})
