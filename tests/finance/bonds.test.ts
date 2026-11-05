import { describe, expect, it } from 'vitest'
import { bondPrice, convexity, macaulayDuration, modifiedDuration, priceChangeEstimate, yieldToMaturity } from '@/lib/finance/bonds'

const par = { face: 1000, couponRate: 0.05, years: 10, freq: 2 }

describe('bonds', () => {
  it('prices at par when coupon equals yield', () => {
    expect(bondPrice(par, 0.05)).toBeCloseTo(1000, 8)
  })
  it('discount when yield > coupon, premium when yield < coupon', () => {
    expect(bondPrice(par, 0.06)).toBeLessThan(1000)
    expect(bondPrice(par, 0.04)).toBeGreaterThan(1000)
    // closed form: C * annuity factor + F * discount factor
    const y = 0.03
    const closed = 25 * ((1 - Math.pow(1 + y, -20)) / y) + 1000 * Math.pow(1 + y, -20)
    expect(bondPrice(par, 0.06)).toBeCloseTo(closed, 8)
  })
  it('YTM inverts price', () => {
    const p = bondPrice(par, 0.0725)
    expect(yieldToMaturity(par, p)).toBeCloseTo(0.0725, 8)
  })
  it('Macaulay duration of a 3-year 10% annual bond at 10% yield', () => {
    const b = { face: 100, couponRate: 0.1, years: 3, freq: 1 }
    const expected = (1 * 10 / 1.1 + 2 * 10 / 1.21 + 3 * 110 / 1.331) / 100
    expect(macaulayDuration(b, 0.1)).toBeCloseTo(expected, 9)
    expect(modifiedDuration(b, 0.1)).toBeCloseTo(expected / 1.1, 9)
  })
  it('zero-coupon duration equals maturity', () => {
    const z = { face: 100, couponRate: 0, years: 7, freq: 1 }
    expect(macaulayDuration(z, 0.04)).toBeCloseTo(7, 9)
  })
  it('duration+convexity approximates repricing better than duration alone', () => {
    const dy = 0.01
    const actual = bondPrice(par, 0.05 + dy) / bondPrice(par, 0.05) - 1
    const est = priceChangeEstimate(par, 0.05, dy)
    expect(Math.abs(est.withConvexity - actual)).toBeLessThan(Math.abs(est.duration - actual))
    expect(convexity(par, 0.05)).toBeGreaterThan(0)
  })
})
