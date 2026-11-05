/** Option payoff and P/L at expiry for single legs and multi-leg strategies. */

export type LegKind = 'call' | 'put' | 'stock'

export interface Leg {
  kind: LegKind
  /** +1 long, -1 short */
  position: 1 | -1
  /** Strike for options; entry price for stock. */
  strike: number
  /** Premium paid/received per unit (0 for stock). */
  premium: number
  qty: number
}

export function legPayoff(leg: Leg, spot: number): number {
  const intrinsic =
    leg.kind === 'call' ? Math.max(spot - leg.strike, 0) : leg.kind === 'put' ? Math.max(leg.strike - spot, 0) : spot - leg.strike
  return leg.position * leg.qty * intrinsic
}

export function legProfit(leg: Leg, spot: number): number {
  return legPayoff(leg, spot) - leg.position * leg.qty * leg.premium
}

export function strategyProfit(legs: readonly Leg[], spot: number): number {
  return legs.reduce((acc, l) => acc + legProfit(l, spot), 0)
}

export function payoffCurve(legs: readonly Leg[], from: number, to: number, steps: number) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const spot = from + ((to - from) * i) / steps
    return { spot, profit: strategyProfit(legs, spot), payoff: legs.reduce((a, l) => a + legPayoff(l, spot), 0) }
  })
}

/** Break-even spots found by sign changes on a fine grid, refined linearly. */
export function breakevens(legs: readonly Leg[], from: number, to: number, steps = 2000): number[] {
  const out: number[] = []
  let prevS = from
  let prevP = strategyProfit(legs, from)
  for (let i = 1; i <= steps; i++) {
    const s = from + ((to - from) * i) / steps
    const p = strategyProfit(legs, s)
    if (prevP === 0) out.push(prevS)
    else if (Math.sign(p) !== Math.sign(prevP) && p !== 0) out.push(prevS + ((s - prevS) * -prevP) / (p - prevP))
    prevS = s
    prevP = p
  }
  return out.map((x) => Math.round(x * 1e6) / 1e6).filter((x, i, a) => a.indexOf(x) === i)
}

/** Max profit / loss over the grid; `unbounded` flags slopes that keep growing at the edges. */
export function profitRange(legs: readonly Leg[], from: number, to: number) {
  const curve = payoffCurve(legs, from, to, 400)
  const profits = curve.map((c) => c.profit)
  const slopeRight = strategyProfit(legs, to * 2) - strategyProfit(legs, to)
  return {
    maxProfit: Math.max(...profits),
    maxLoss: Math.min(...profits),
    unboundedUp: slopeRight > 1e-9,
    unboundedDown: slopeRight < -1e-9,
  }
}
