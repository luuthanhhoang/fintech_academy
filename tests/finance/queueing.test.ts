import { describe, expect, it } from 'vitest'
import { erlangC, mm1ResponsePercentile, mmc, utilisationCurve } from '@/lib/systems/queueing'

describe('queueing', () => {
  it('M/M/1 matches the textbook formulas and Little\'s law', () => {
    const s = mmc(80, 100)
    expect(s.rho).toBeCloseTo(0.8)
    expect(s.pWait).toBeCloseTo(0.8)
    expect(s.w).toBeCloseTo(1 / (100 - 80))
    expect(s.l).toBeCloseTo(0.8 / (1 - 0.8))
    expect(mm1ResponsePercentile(80, 100, 0.99)).toBeCloseTo(Math.log(100) / 20)
  })
  it('Erlang C: known value for c = 2, a = 1 is 1/3', () => {
    expect(erlangC(2, 1)).toBeCloseTo(1 / 3)
  })
  it('waiting explodes as utilisation approaches 1 and is unstable beyond', () => {
    const curve = utilisationCurve(100, 1)
    expect(curve[curve.length - 1]!.w).toBeGreaterThan(curve[0]!.w * 20)
    expect(mmc(120, 100).stable).toBe(false)
    expect(mmc(120, 100, 2).stable).toBe(true)
  })
})
