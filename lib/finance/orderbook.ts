/** Limit order book with price-time priority matching. Quantities are integers (shares/lots). */

export type Side = 'buy' | 'sell'

export interface OrderInput {
  id: string
  side: Side
  type: 'limit' | 'market'
  price?: number
  qty: number
}

export interface RestingOrder {
  id: string
  side: Side
  price: number
  qty: number
  seq: number
}

export interface Trade {
  takerId: string
  makerId: string
  price: number
  qty: number
  seq: number
}

export interface SubmitResult {
  trades: Trade[]
  rested: RestingOrder | null
  /** Quantity that could not be filled and was not rested (market orders, or IOC-like leftovers). */
  unfilled: number
}

export interface DepthLevel {
  price: number
  qty: number
  orders: number
}

export class OrderBook {
  private bids: RestingOrder[] = []
  private asks: RestingOrder[] = []
  private seq = 0

  /** Best bid = highest price; best ask = lowest price. Ties resolved by arrival order (seq). */
  private sortBooks() {
    this.bids.sort((a, b) => b.price - a.price || a.seq - b.seq)
    this.asks.sort((a, b) => a.price - b.price || a.seq - b.seq)
  }

  bestBid(): number | null {
    return this.bids[0]?.price ?? null
  }

  bestAsk(): number | null {
    return this.asks[0]?.price ?? null
  }

  spread(): number | null {
    const b = this.bestBid()
    const a = this.bestAsk()
    return b === null || a === null ? null : a - b
  }

  submit(order: OrderInput): SubmitResult {
    if (!Number.isInteger(order.qty) || order.qty <= 0) throw new Error('Khối lượng phải là số nguyên dương')
    if (order.type === 'limit' && (order.price === undefined || !(order.price > 0))) throw new Error('Lệnh giới hạn cần giá > 0')
    const opposite = order.side === 'buy' ? this.asks : this.bids
    const crosses = (p: number) =>
      order.type === 'market' || (order.side === 'buy' ? p <= (order.price as number) : p >= (order.price as number))
    const trades: Trade[] = []
    let remaining = order.qty
    while (remaining > 0 && opposite.length > 0 && crosses((opposite[0] as RestingOrder).price)) {
      const maker = opposite[0] as RestingOrder
      const qty = Math.min(remaining, maker.qty)
      trades.push({ takerId: order.id, makerId: maker.id, price: maker.price, qty, seq: ++this.seq })
      maker.qty -= qty
      remaining -= qty
      if (maker.qty === 0) opposite.shift()
    }
    if (remaining > 0 && order.type === 'limit') {
      const rested: RestingOrder = { id: order.id, side: order.side, price: order.price as number, qty: remaining, seq: ++this.seq }
      ;(order.side === 'buy' ? this.bids : this.asks).push(rested)
      this.sortBooks()
      return { trades, rested: { ...rested }, unfilled: 0 }
    }
    return { trades, rested: null, unfilled: remaining }
  }

  cancel(id: string): boolean {
    for (const side of [this.bids, this.asks]) {
      const i = side.findIndex((o) => o.id === id)
      if (i !== -1) {
        side.splice(i, 1)
        return true
      }
    }
    return false
  }

  depth(side: Side): DepthLevel[] {
    const levels = new Map<number, DepthLevel>()
    for (const o of side === 'buy' ? this.bids : this.asks) {
      const l = levels.get(o.price) ?? { price: o.price, qty: 0, orders: 0 }
      l.qty += o.qty
      l.orders += 1
      levels.set(o.price, l)
    }
    return [...levels.values()]
  }

  orders(side: Side): RestingOrder[] {
    return (side === 'buy' ? this.bids : this.asks).map((o) => ({ ...o }))
  }
}

/** Volume-weighted average fill price, or null when nothing traded. */
export function averageFillPrice(trades: readonly Trade[]): number | null {
  const qty = trades.reduce((a, t) => a + t.qty, 0)
  return qty === 0 ? null : trades.reduce((a, t) => a + t.price * t.qty, 0) / qty
}

/** Slippage of a fill versus a reference price, as a signed fraction (positive = worse for the taker). */
export function slippage(side: Side, avgPrice: number, reference: number): number {
  return side === 'buy' ? (avgPrice - reference) / reference : (reference - avgPrice) / reference
}
