import { describe, expect, it } from 'vitest'
import { breakevens, legPayoff, profitRange, strategyProfit, type Leg } from '@/lib/finance/options'

const longCall: Leg = { kind: 'call', position: 1, strike: 100, premium: 5, qty: 1 }
const longPut: Leg = { kind: 'put', position: 1, strike: 100, premium: 4, qty: 1 }

describe('options', () => {
  it('call and put payoffs at expiry', () => {
    expect(legPayoff(longCall, 120)).toBe(20)
    expect(legPayoff(longCall, 80)).toBe(0)
    expect(legPayoff(longPut, 80)).toBe(20)
  })
  it('long call break-even = K + premium', () => {
    expect(breakevens([longCall], 50, 150)).toEqual([105])
    expect(strategyProfit([longCall], 50)).toBe(-5)
  })
  it('long straddle has two break-evens K ± total premium', () => {
    expect(breakevens([longCall, longPut], 50, 150)).toEqual([91, 109])
  })
  it('put-call parity at expiry: long call − long put = long forward (strike K)', () => {
    const shortPut: Leg = { ...longPut, position: -1, premium: 0 }
    const call: Leg = { ...longCall, premium: 0 }
    for (const s of [60, 100, 140]) expect(strategyProfit([call, shortPut], s)).toBeCloseTo(s - 100, 12)
  })
  it('short call has unbounded downside', () => {
    expect(profitRange([{ ...longCall, position: -1 }], 50, 150).unboundedDown).toBe(true)
  })
})
