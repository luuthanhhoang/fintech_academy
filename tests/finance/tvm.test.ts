import { describe, expect, it } from 'vitest'
import {
  annuityFutureValue, annuityPresentValue, effectiveAnnualRate, futureValue, growthSeries, irr, npv, presentValue, yearsToMultiply,
} from '@/lib/finance/tvm'

describe('tvm', () => {
  it('FV with annual, monthly and continuous compounding (closed forms)', () => {
    expect(futureValue(1000, 0.05, 10, 1)).toBeCloseTo(1628.894627, 5)
    expect(futureValue(1000, 0.05, 10, 12)).toBeCloseTo(1000 * Math.pow(1 + 0.05 / 12, 120), 8)
    expect(futureValue(1000, 0.05, 10, Infinity)).toBeCloseTo(1000 * Math.exp(0.5), 8)
  })
  it('EAR of 12% nominal compounded monthly ≈ 12.6825%', () => {
    expect(effectiveAnnualRate(0.12, 12)).toBeCloseTo(0.126825, 6)
  })
  it('PV is the inverse of FV', () => {
    expect(presentValue(futureValue(500, 0.07, 6, 4), 0.07, 6, 4)).toBeCloseTo(500, 9)
  })
  it('annuities match the series sum', () => {
    const direct = Array.from({ length: 5 }, (_, t) => 100 * Math.pow(1.08, 4 - t)).reduce((a, b) => a + b)
    expect(annuityFutureValue(100, 0.08, 5)).toBeCloseTo(direct, 9)
    const pvDirect = Array.from({ length: 5 }, (_, t) => 100 / Math.pow(1.08, t + 1)).reduce((a, b) => a + b)
    expect(annuityPresentValue(100, 0.08, 5)).toBeCloseTo(pvDirect, 9)
    expect(annuityFutureValue(100, 0, 5)).toBe(500)
  })
  it('NPV and IRR', () => {
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 10)
    expect(irr([-100, 110])).toBeCloseTo(0.1, 9)
    const cfs = [-1000, 300, 400, 500]
    const r = irr(cfs)
    expect(r).not.toBeNull()
    expect(npv(r as number, cfs)).toBeCloseTo(0, 6)
    expect(irr([100, 50])).toBeNull()
  })
  it('growth series and rule-of-72 style doubling time', () => {
    const s = growthSeries(1000, 0.1, 3, 1, 100)
    expect(s).toHaveLength(4)
    expect(s[3]?.balance).toBeCloseTo(((1000 * 1.1 + 100) * 1.1 + 100) * 1.1 + 100, 9)
    expect(yearsToMultiply(2, 0.07)).toBeCloseTo(Math.log(2) / Math.log(1.07), 9)
  })
})
