'use client'

import { effectiveAnnualRate, growthSeries, yearsToMultiply } from '@/lib/finance/tvm'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { LineChartView } from '@/components/charts/line-chart'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

export function TvmSim({ values }: SimBodyProps) {
  const r = (values.ratePct ?? 0) / 100
  const m = values.compoundsPerYear ?? 1
  const years = Math.round(values.years ?? 0)
  const pv = values.principal ?? 0
  const pmt = values.contribution ?? 0
  const discrete = growthSeries(pv, r, years, m, pmt)
  const simple = discrete.map((p) => pv * (1 + r * p.year) + pmt * p.year)
  const continuous = growthSeries(pv, r, years, Infinity, pmt)
  const data = discrete.map((p, i) => ({ year: p.year, compound: p.balance, continuous: continuous[i]?.balance ?? null, simple: simple[i] ?? null, contributed: p.contributed }))
  const last = discrete[discrete.length - 1]
  const doubling = yearsToMultiply(2, effectiveAnnualRate(r, m))
  return (
    <div>
      {r < 0 && <Warning>Lãi suất âm: tiền gốc bị bào mòn mỗi kỳ — số dư giảm dần thay vì tăng.</Warning>}
      <StatGrid>
        <Stat label="Số dư cuối kỳ" value={fmtNum(last?.balance, 0)} />
        <Stat label="Tổng tiền đã góp" value={fmtNum(last?.contributed, 0)} />
        <Stat label="Phần lãi" value={fmtNum(last?.interest, 0)} />
        <Stat label="Lãi suất hiệu dụng năm (EAR)" value={fmtPct(effectiveAnnualRate(r, m))} hint={`ghép ${fmtNum(m, 0)} lần/năm`} />
        <Stat label="Thời gian nhân đôi" value={doubling === null || doubling < 0 ? '—' : `${fmtNum(doubling, 1)} năm`} />
      </StatGrid>
      <LineChartView
        data={data}
        x="year"
        xLabel="Năm"
        yLabel="Số dư"
        formatY={(v) => fmtNum(v, 0)}
        series={[
          { key: 'compound', label: 'Lãi kép', slot: 1 },
          { key: 'continuous', label: 'Ghép liên tục', slot: 3, dashed: true },
          { key: 'simple', label: 'Lãi đơn', slot: 2 },
        ]}
      />
    </div>
  )
}
