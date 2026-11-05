import { describe, expect, it } from 'vitest'
import { dcf, gordonTerminalValue, sensitivity, wacc } from '@/lib/finance/dcf'
import { nominalFromReal, purchasingPower, realRateApprox, realRateExact } from '@/lib/finance/inflation'

describe('inflation', () => {
  it('Fisher exact vs approximation', () => {
    expect(realRateExact(0.08, 0.03)).toBeCloseTo(1.08 / 1.03 - 1, 12)
    expect(realRateApprox(0.08, 0.03)).toBeCloseTo(0.05, 12)
    expect(nominalFromReal(realRateExact(0.08, 0.03), 0.03)).toBeCloseTo(0.08, 12)
    expect(purchasingPower(100, 0.1, 1)).toBeCloseTo(100 / 1.1, 12)
  })
})

describe('dcf', () => {
  it('Gordon growth and WACC', () => {
    expect(gordonTerminalValue(100, 0.1, 0.03)).toBeCloseTo(1428.5714, 4)
    expect(gordonTerminalValue(100, 0.03, 0.03)).toBeNull()
    expect(wacc(60, 40, 0.12, 0.06, 0.2)).toBeCloseTo(0.6 * 0.12 + 0.4 * 0.06 * 0.8, 12)
  })
  it('enterprise value = PV explicit + PV terminal', () => {
    const r = dcf({ baseFcf: 100, growth: 0.05, years: 5, discount: 0.1, terminalGrowth: 0.02, netDebt: 200, shares: 10 })
    expect(r).not.toBeNull()
    const manual = Array.from({ length: 5 }, (_, i) => (100 * 1.05 ** (i + 1)) / 1.1 ** (i + 1)).reduce((a, b) => a + b)
    expect(r?.pvExplicit).toBeCloseTo(manual, 9)
    const tv = (100 * 1.05 ** 5 * 1.02) / 0.08
    expect(r?.pvTerminal).toBeCloseTo(tv / 1.1 ** 5, 9)
    expect(r?.perShare).toBeCloseTo(((r?.enterpriseValue ?? 0) - 200) / 10, 9)
  })
  it('sensitivity marks undefined cells', () => {
    const base = { baseFcf: 100, growth: 0.05, years: 5, discount: 0.1, terminalGrowth: 0.02, netDebt: 0, shares: 1 }
    const grid = sensitivity(base, [0.02, 0.1], [0.03])
    expect(grid[0]?.[0]).toBeNull()
    expect(grid[1]?.[0]).toBeGreaterThan(0)
  })
})
