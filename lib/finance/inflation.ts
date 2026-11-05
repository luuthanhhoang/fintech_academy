/** Inflation and real returns (Fisher relation). Rates are decimals. */

export function realRateExact(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1
}

export function realRateApprox(nominal: number, inflation: number): number {
  return nominal - inflation
}

export function nominalFromReal(real: number, inflation: number): number {
  return (1 + real) * (1 + inflation) - 1
}

/** Purchasing power of `amount` after `years` of constant inflation. */
export function purchasingPower(amount: number, inflation: number, years: number): number {
  return amount / Math.pow(1 + inflation, years)
}

export interface RealSeriesPoint {
  year: number
  nominal: number
  real: number
  priceLevel: number
}

export function nominalVsReal(amount: number, nominal: number, inflation: number, years: number): RealSeriesPoint[] {
  return Array.from({ length: years + 1 }, (_, t) => {
    const nominalValue = amount * Math.pow(1 + nominal, t)
    const priceLevel = Math.pow(1 + inflation, t)
    return { year: t, nominal: nominalValue, real: nominalValue / priceLevel, priceLevel }
  })
}
