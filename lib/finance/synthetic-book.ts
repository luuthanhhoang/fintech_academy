/** Deterministic synthetic order book for the simulator (always labelled "Dữ liệu tổng hợp (mô phỏng)"). */
import { OrderBook } from './orderbook'
import { mulberry32 } from './random'

export interface SyntheticBookParams {
  mid: number
  spreadTicks: number
  tick: number
  levels: number
  baseQty: number
  seed: number
}

export function syntheticBook(p: SyntheticBookParams): OrderBook {
  const book = new OrderBook()
  const rand = mulberry32(p.seed)
  const halfSpread = (p.spreadTicks * p.tick) / 2
  const round = (x: number) => Math.round(x / p.tick) * p.tick
  for (let i = 0; i < p.levels; i++) {
    const bid = round(p.mid - halfSpread - i * p.tick)
    const ask = round(p.mid + halfSpread + i * p.tick)
    const qtyB = Math.max(1, Math.round(p.baseQty * (0.5 + rand())))
    const qtyA = Math.max(1, Math.round(p.baseQty * (0.5 + rand())))
    if (bid > 0) book.submit({ id: `b${i}`, side: 'buy', type: 'limit', price: bid, qty: qtyB })
    book.submit({ id: `a${i}`, side: 'sell', type: 'limit', price: ask, qty: qtyA })
  }
  return book
}
