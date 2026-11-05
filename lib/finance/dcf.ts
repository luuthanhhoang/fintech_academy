/** Discounted cash flow valuation. Rates are annual decimals. */

export function wacc(equity: number, debt: number, costEquity: number, costDebt: number, taxRate: number): number {
  const v = equity + debt
  return (equity / v) * costEquity + (debt / v) * costDebt * (1 - taxRate)
}

/** Gordon growth terminal value at year N from FCF_{N+1}; null when discount ≤ growth (undefined). */
export function gordonTerminalValue(nextFcf: number, discount: number, growth: number): number | null {
  return discount <= growth ? null : nextFcf / (discount - growth)
}

export interface DcfInput {
  baseFcf: number
  growth: number
  years: number
  discount: number
  terminalGrowth: number
  netDebt: number
  shares: number
}

export interface DcfResult {
  projections: { year: number; fcf: number; pv: number }[]
  pvExplicit: number
  terminalValue: number
  pvTerminal: number
  enterpriseValue: number
  equityValue: number
  perShare: number | null
  terminalShare: number
}

export function dcf(input: DcfInput): DcfResult | null {
  const projections = Array.from({ length: input.years }, (_, i) => {
    const year = i + 1
    const fcf = input.baseFcf * Math.pow(1 + input.growth, year)
    return { year, fcf, pv: fcf / Math.pow(1 + input.discount, year) }
  })
  const last = projections[projections.length - 1]
  if (!last) return null
  const tv = gordonTerminalValue(last.fcf * (1 + input.terminalGrowth), input.discount, input.terminalGrowth)
  if (tv === null) return null
  const pvExplicit = projections.reduce((a, p) => a + p.pv, 0)
  const pvTerminal = tv / Math.pow(1 + input.discount, input.years)
  const enterpriseValue = pvExplicit + pvTerminal
  const equityValue = enterpriseValue - input.netDebt
  return {
    projections,
    pvExplicit,
    terminalValue: tv,
    pvTerminal,
    enterpriseValue,
    equityValue,
    perShare: input.shares > 0 ? equityValue / input.shares : null,
    terminalShare: pvTerminal / enterpriseValue,
  }
}

/** Enterprise value grid over discount × terminal growth (null cells where undefined). */
export function sensitivity(input: DcfInput, discounts: readonly number[], growths: readonly number[]): (number | null)[][] {
  return discounts.map((d) => growths.map((g) => dcf({ ...input, discount: d, terminalGrowth: g })?.enterpriseValue ?? null))
}
