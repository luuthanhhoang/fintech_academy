'use client'

import { useState } from 'react'
import { averageFillPrice, slippage, type Side, type SubmitResult } from '@/lib/finance/orderbook'
import { syntheticBook } from '@/lib/finance/synthetic-book'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { Button } from '@/components/ui/primitives'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

function Ladder({ levels, side, maxQty }: { levels: { price: number; qty: number; orders: number }[]; side: Side; maxQty: number }) {
  return (
    <table className="w-full text-sm">
      <caption className="mb-1 text-left text-xs text-ink-3">{side === 'buy' ? 'Bên mua (bid) — giá cao ưu tiên' : 'Bên bán (ask) — giá thấp ưu tiên'}</caption>
      <tbody>
        {levels.map((l) => (
          <tr key={l.price} className="relative">
            <td className="num relative px-2 py-0.5">
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 ${side === 'buy' ? 'bg-good-soft' : 'bg-bad-soft'}`} style={{ width: `${(l.qty / maxQty) * 100}%` }} />
              <span className="relative">{fmtNum(l.price, 2)}</span>
            </td>
            <td className="num px-2 py-0.5 text-right">{fmtNum(l.qty, 0)}</td>
            <td className="num px-2 py-0.5 text-right text-ink-3">{l.orders} lệnh</td>
          </tr>
        ))}
        {levels.length === 0 && (
          <tr>
            <td className="px-2 py-1 text-ink-3">Trống — không còn thanh khoản phía này</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export function OrderBookSim({ values }: SimBodyProps) {
  const p = { mid: values.mid ?? 100, spreadTicks: Math.max(1, Math.round(values.spreadTicks ?? 1)), tick: values.tick ?? 0.1, levels: Math.max(1, Math.round(values.levels ?? 5)), baseQty: Math.max(1, Math.round(values.baseQty ?? 100)), seed: Math.round(values.seed ?? 1) }
  // A new synthetic book whenever the generator parameters change.
  return <OrderBookPlayground key={JSON.stringify(p)} params={p} qty={Math.max(1, Math.round(values.orderQty ?? 1))} />
}

interface LogEntry {
  side: Side
  r: SubmitResult
  ref: number
}

function OrderBookPlayground({ params: p, qty }: { params: Parameters<typeof syntheticBook>[0]; qty: number }) {
  const [book] = useState(() => syntheticBook(p))
  const [log, setLog] = useState<LogEntry[]>([])
  const [side, setSide] = useState<Side>('buy')
  const [type, setType] = useState<'market' | 'limit'>('market')
  const [price, setPrice] = useState(p.mid)
  const [error, setError] = useState<string | null>(null)
  const bids = book.depth('buy')
  const asks = book.depth('sell')
  const maxQty = Math.max(1, ...bids.map((b) => b.qty), ...asks.map((a) => a.qty))
  const last = log[log.length - 1]
  const avg = last ? averageFillPrice(last.r.trades) : null
  const bb = book.bestBid()
  const ba = book.bestAsk()
  const mid = bb !== null && ba !== null ? (ba + bb) / 2 : null

  const submit = () => {
    setError(null)
    try {
      const ref = side === 'buy' ? (ba ?? p.mid) : (bb ?? p.mid)
      const r = book.submit({ id: `u${log.length + 1}`, side, type, price: type === 'limit' ? price : undefined, qty })
      setLog((l) => [...l, { side, r, ref }])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2 text-sm">
        <div role="radiogroup" aria-label="Chiều lệnh" className="flex gap-1">
          {(['buy', 'sell'] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={side === s} onClick={() => setSide(s)} className="rounded-md border border-rule px-2.5 py-1 aria-checked:border-accent aria-checked:bg-accent-soft">
              {s === 'buy' ? 'Mua' : 'Bán'}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Loại lệnh" className="flex gap-1">
          {(['market', 'limit'] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className="rounded-md border border-rule px-2.5 py-1 aria-checked:border-accent aria-checked:bg-accent-soft">
              {t === 'market' ? 'Thị trường (MP)' : 'Giới hạn (LO)'}
            </button>
          ))}
        </div>
        {type === 'limit' && (
          <label className="flex items-center gap-1">
            Giá
            <input type="number" step={p.tick} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="num w-24 rounded border border-rule bg-paper px-1.5 py-0.5" />
          </label>
        )}
        <Button variant="primary" onClick={submit}>
          Gửi lệnh {fmtNum(qty, 0)} cp
        </Button>
      </div>
      {error && <Warning>{error}</Warning>}
      {last && last.r.unfilled > 0 && <Warning>Lệnh thị trường chỉ khớp được một phần: còn {fmtNum(last.r.unfilled, 0)} cp không có đối ứng và bị huỷ.</Warning>}
      <StatGrid>
        <Stat label="Bid / Ask tốt nhất" value={`${fmtNum(bb, 2)} / ${fmtNum(ba, 2)}`} />
        <Stat label="Spread" value={fmtNum(book.spread(), 2)} hint={mid ? fmtPct((book.spread() ?? 0) / mid, 3) + ' so với giá giữa' : undefined} />
        <Stat label="Lệnh vừa gửi: giá khớp bình quân" value={fmtNum(avg, 3)} hint={last ? `${last.r.trades.length} giao dịch` : 'chưa gửi lệnh'} />
        <Stat label="Trượt giá so với giá tốt nhất" value={avg !== null && last ? fmtPct(slippage(last.side, avg, last.ref), 3) : '—'} />
      </StatGrid>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ladder levels={asks.slice().reverse()} side="sell" maxQty={maxQty} />
        <Ladder levels={bids} side="buy" maxQty={maxQty} />
      </div>
      {log.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-ink-2">Nhật ký khớp lệnh ({log.reduce((a, l) => a + l.r.trades.length, 0)} giao dịch)</summary>
          <ol className="num mt-2 space-y-0.5 text-xs">
            {log.flatMap((l) => l.r.trades.map((t) => <li key={`${t.takerId}-${t.seq}`}>#{t.seq}: {t.takerId} khớp {fmtNum(t.qty, 0)} @ {fmtNum(t.price, 2)} với {t.makerId}</li>))}
          </ol>
        </details>
      )}
    </div>
  )
}
