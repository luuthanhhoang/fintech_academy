import { describe, expect, it } from 'vitest'
import { averageFillPrice, OrderBook, slippage } from '@/lib/finance/orderbook'
import { syntheticBook } from '@/lib/finance/synthetic-book'

function seeded() {
  const b = new OrderBook()
  b.submit({ id: 's1', side: 'sell', type: 'limit', price: 101, qty: 5 })
  b.submit({ id: 's2', side: 'sell', type: 'limit', price: 101, qty: 5 })
  b.submit({ id: 's3', side: 'sell', type: 'limit', price: 102, qty: 10 })
  b.submit({ id: 'b1', side: 'buy', type: 'limit', price: 99, qty: 10 })
  return b
}

describe('order book matching', () => {
  it('keeps best bid/ask and spread', () => {
    const b = seeded()
    expect(b.bestBid()).toBe(99)
    expect(b.bestAsk()).toBe(101)
    expect(b.spread()).toBe(2)
  })
  it('matches by price then time priority, at the maker price', () => {
    const b = seeded()
    const r = b.submit({ id: 't', side: 'buy', type: 'limit', price: 102, qty: 7 })
    expect(r.trades.map((t) => [t.makerId, t.qty, t.price])).toEqual([['s1', 5, 101], ['s2', 2, 101]])
    expect(r.rested).toBeNull()
    expect(b.orders('sell')[0]).toMatchObject({ id: 's2', qty: 3 })
  })
  it('rests the remainder of a limit order', () => {
    const b = seeded()
    const r = b.submit({ id: 't', side: 'buy', type: 'limit', price: 101, qty: 12 })
    expect(r.trades.reduce((a, t) => a + t.qty, 0)).toBe(10)
    expect(r.rested).toMatchObject({ price: 101, qty: 2 })
    expect(b.bestBid()).toBe(101)
  })
  it('market order walks the book and reports unfilled', () => {
    const b = seeded()
    const r = b.submit({ id: 'm', side: 'buy', type: 'market', qty: 25 })
    expect(r.unfilled).toBe(5)
    expect(averageFillPrice(r.trades)).toBeCloseTo((10 * 101 + 10 * 102) / 20, 9)
    expect(slippage('buy', averageFillPrice(r.trades) as number, 101)).toBeGreaterThan(0)
    expect(b.bestAsk()).toBeNull()
  })
  it('cancel removes resting orders and rejects invalid input', () => {
    const b = seeded()
    expect(b.cancel('b1')).toBe(true)
    expect(b.bestBid()).toBeNull()
    expect(() => b.submit({ id: 'x', side: 'buy', type: 'limit', price: 0, qty: 1 })).toThrow()
    expect(() => b.submit({ id: 'x', side: 'buy', type: 'limit', price: 1, qty: 1.5 })).toThrow()
  })
  it('synthetic book is deterministic and uncrossed', () => {
    const p = { mid: 100, spreadTicks: 2, tick: 0.5, levels: 5, baseQty: 100, seed: 7 }
    const a = syntheticBook(p)
    const b = syntheticBook(p)
    expect(a.depth('buy')).toEqual(b.depth('buy'))
    expect((a.bestAsk() as number) > (a.bestBid() as number)).toBe(true)
  })
})
