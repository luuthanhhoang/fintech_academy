/** Time value of money. Rates are decimals (0.05 = 5%). `m` = compounding periods per year; Infinity = continuous. */

export function effectiveAnnualRate(nominal: number, m: number): number {
  return m === Infinity ? Math.exp(nominal) - 1 : Math.pow(1 + nominal / m, m) - 1
}

export function growthFactor(rate: number, years: number, m: number): number {
  return m === Infinity ? Math.exp(rate * years) : Math.pow(1 + rate / m, m * years)
}

export function futureValue(pv: number, rate: number, years: number, m = 1): number {
  return pv * growthFactor(rate, years, m)
}

export function presentValue(fv: number, rate: number, years: number, m = 1): number {
  return fv / growthFactor(rate, years, m)
}

/** Future value of an ordinary annuity (payment at end of each period). */
export function annuityFutureValue(pmt: number, ratePerPeriod: number, periods: number): number {
  if (ratePerPeriod === 0) return pmt * periods
  return pmt * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod)
}

export function annuityPresentValue(pmt: number, ratePerPeriod: number, periods: number): number {
  if (ratePerPeriod === 0) return pmt * periods
  return pmt * ((1 - Math.pow(1 + ratePerPeriod, -periods)) / ratePerPeriod)
}

/** Net present value; cashflows[0] occurs at t = 0. */
export function npv(rate: number, cashflows: readonly number[]): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0)
}

function npvDerivative(rate: number, cashflows: readonly number[]): number {
  return cashflows.reduce((acc, cf, t) => acc - (t * cf) / Math.pow(1 + rate, t + 1), 0)
}

/**
 * Internal rate of return. Newton's method with a bisection fallback over (-0.99, 10).
 * Returns null when cashflows have no sign change (IRR undefined).
 */
export function irr(cashflows: readonly number[], guess = 0.1): number | null {
  const hasPos = cashflows.some((c) => c > 0)
  const hasNeg = cashflows.some((c) => c < 0)
  if (!hasPos || !hasNeg) return null
  let r = guess
  for (let i = 0; i < 50; i++) {
    const f = npv(r, cashflows)
    const d = npvDerivative(r, cashflows)
    if (Math.abs(f) < 1e-10) return r
    if (d === 0 || !Number.isFinite(d)) break
    const next = r - f / d
    if (!Number.isFinite(next) || next <= -0.99) break
    if (Math.abs(next - r) < 1e-12) return next
    r = next
  }
  return bisect((x) => npv(x, cashflows), -0.99, 10)
}

/** Generic bisection root finder; returns null if f(lo) and f(hi) share a sign. */
export function bisect(f: (x: number) => number, lo: number, hi: number, tol = 1e-10, maxIter = 200): number | null {
  let flo = f(lo)
  const fhi = f(hi)
  if (flo === 0) return lo
  if (fhi === 0) return hi
  if (Math.sign(flo) === Math.sign(fhi)) return null
  let a = lo
  let b = hi
  for (let i = 0; i < maxIter; i++) {
    const mid = (a + b) / 2
    const fm = f(mid)
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) return mid
    if (Math.sign(fm) === Math.sign(flo)) {
      a = mid
      flo = fm
    } else b = mid
  }
  return (a + b) / 2
}

export interface GrowthPoint {
  year: number
  balance: number
  contributed: number
  interest: number
}

/** Year-by-year balance with an optional contribution at the end of each year. */
export function growthSeries(pv: number, rate: number, years: number, m: number, yearlyContribution = 0): GrowthPoint[] {
  const out: GrowthPoint[] = [{ year: 0, balance: pv, contributed: pv, interest: 0 }]
  let balance = pv
  let contributed = pv
  const yearly = growthFactor(rate, 1, m)
  for (let y = 1; y <= years; y++) {
    balance = balance * yearly + yearlyContribution
    contributed += yearlyContribution
    out.push({ year: y, balance, contributed, interest: balance - contributed })
  }
  return out
}

/** Years needed to multiply money by `multiple` at a given annual effective rate. */
export function yearsToMultiply(multiple: number, annualRate: number): number | null {
  if (annualRate <= -1 || multiple <= 0) return null
  if (annualRate === 0) return multiple === 1 ? 0 : null
  return Math.log(multiple) / Math.log(1 + annualRate)
}
