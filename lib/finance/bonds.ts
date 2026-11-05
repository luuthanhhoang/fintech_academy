/** Plain fixed-coupon bond math. Rates are annual decimals; `freq` = coupons per year. */
import { bisect } from './tvm'

export interface BondSpec {
  face: number
  couponRate: number
  years: number
  freq: number
}

export function bondCashflows(b: BondSpec): { t: number; amount: number }[] {
  const n = Math.round(b.years * b.freq)
  const coupon = (b.face * b.couponRate) / b.freq
  return Array.from({ length: n }, (_, i) => ({ t: (i + 1) / b.freq, amount: coupon + (i === n - 1 ? b.face : 0) }))
}

export function bondPrice(b: BondSpec, ytm: number): number {
  const y = ytm / b.freq
  return bondCashflows(b).reduce((acc, cf, i) => acc + cf.amount / Math.pow(1 + y, i + 1), 0)
}

export function yieldToMaturity(b: BondSpec, price: number): number | null {
  return bisect((y) => bondPrice(b, y) - price, -0.5 * b.freq + 1e-6, 2)
}

/** Macaulay duration in years. */
export function macaulayDuration(b: BondSpec, ytm: number): number {
  const y = ytm / b.freq
  const price = bondPrice(b, ytm)
  const weighted = bondCashflows(b).reduce((acc, cf, i) => acc + (cf.t * cf.amount) / Math.pow(1 + y, i + 1), 0)
  return weighted / price
}

export function modifiedDuration(b: BondSpec, ytm: number): number {
  return macaulayDuration(b, ytm) / (1 + ytm / b.freq)
}

/** Convexity in years^2 (periodic-compounding form). */
export function convexity(b: BondSpec, ytm: number): number {
  const y = ytm / b.freq
  const price = bondPrice(b, ytm)
  const sum = bondCashflows(b).reduce((acc, cf, i) => {
    const k = i + 1
    return acc + (cf.amount * k * (k + 1)) / Math.pow(1 + y, k + 2)
  }, 0)
  return sum / (price * b.freq * b.freq)
}

/** Second-order estimate of the % price change for a yield shift `dy`. */
export function priceChangeEstimate(b: BondSpec, ytm: number, dy: number): { duration: number; withConvexity: number } {
  const md = modifiedDuration(b, ytm)
  const cx = convexity(b, ytm)
  return { duration: -md * dy, withConvexity: -md * dy + 0.5 * cx * dy * dy }
}

export function priceYieldCurve(b: BondSpec, from: number, to: number, steps: number): { ytm: number; price: number }[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const ytm = from + ((to - from) * i) / steps
    return { ytm, price: bondPrice(b, ytm) }
  })
}
