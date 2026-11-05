'use client'

import { useState } from 'react'
import { z } from 'zod'
import { breakevens, payoffCurve, profitRange, type Leg } from '@/lib/finance/options'
import { fmtNum } from '@/lib/util/format'
import { LineChartView } from '@/components/charts/line-chart'
import { ErrorState } from '@/components/ui/states'
import { Stat, StatGrid } from '../stat'
import type { SimBodyProps } from '../types'

const ConfigSchema = z.object({
  strategies: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string(),
        legs: z.array(
          z.object({
            kind: z.enum(['call', 'put', 'stock']),
            position: z.union([z.literal(1), z.literal(-1)]),
            strike: z.enum(['strike1', 'strike2']),
            premium: z.enum(['premium1', 'premium2']).nullable(),
          }),
        ),
      }),
    )
    .min(1),
})

export function OptionsSim({ meta, values }: SimBodyProps) {
  const parsed = ConfigSchema.safeParse(meta.config)
  const [strategyId, setStrategyId] = useState(parsed.success ? (parsed.data.strategies[0]?.id ?? '') : '')
  if (!parsed.success) return <ErrorState title="Cấu hình mô phỏng không hợp lệ" error={parsed.error.message} />
  const strategy = parsed.data.strategies.find((s) => s.id === strategyId) ?? parsed.data.strategies[0]
  if (!strategy) return null
  const qty = Math.max(1, Math.round(values.qty ?? 1))
  const legs: Leg[] = strategy.legs.map((l) => ({ kind: l.kind, position: l.position, strike: values[l.strike] ?? 0, premium: l.premium ? (values[l.premium] ?? 0) : 0, qty }))
  const strikes = legs.map((l) => l.strike)
  const from = Math.max(0, Math.min(...strikes) * 0.5)
  const to = Math.max(...strikes) * 1.5 || 1
  const curve = payoffCurve(legs, from, to, 120)
  const range = profitRange(legs, from, to)
  const bes = breakevens(legs, from, to)
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Chiến lược">
        {parsed.data.strategies.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={s.id === strategy.id} onClick={() => setStrategyId(s.id)} className="rounded-md border border-rule px-2.5 py-1 text-sm aria-checked:border-accent aria-checked:bg-accent-soft">
            {s.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm text-ink-2">{strategy.description}</p>
      <StatGrid>
        <Stat label="Lãi tối đa (trong vùng vẽ)" value={range.unboundedUp ? 'không giới hạn ↑' : fmtNum(range.maxProfit, 2)} />
        <Stat label="Lỗ tối đa (trong vùng vẽ)" value={range.unboundedDown ? 'không giới hạn ↓' : fmtNum(range.maxLoss, 2)} />
        <Stat label="Điểm hoà vốn" value={bes.length ? bes.map((b) => fmtNum(b, 2)).join(' · ') : 'không có'} />
      </StatGrid>
      <LineChartView
        data={curve.map((c) => ({ spot: c.spot, profit: c.profit, payoff: c.payoff }))}
        x="spot"
        xLabel="Giá tài sản cơ sở lúc đáo hạn"
        yLabel="Lãi/lỗ"
        series={[
          { key: 'profit', label: 'Lãi/lỗ (đã trừ phí)', slot: 1 },
          { key: 'payoff', label: 'Payoff (chưa trừ phí)', slot: 2, dashed: true },
        ]}
        refLines={[{ axis: 'y', value: 0, label: 'Hoà vốn' }, ...strikes.map((k, i) => ({ axis: 'x' as const, value: k, label: `K${i + 1}` }))]}
      />
    </div>
  )
}
